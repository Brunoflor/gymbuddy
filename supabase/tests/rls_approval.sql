begin;

create extension if not exists pgtap with schema extensions;

create or replace function public._test_make_user(
  p_id uuid,
  p_email text,
  p_name text,
  p_role text,
  p_extra jsonb
) returns void
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token,
    is_super_admin, is_sso_user, is_anonymous
  ) values (
    '00000000-0000-0000-0000-000000000000',
    p_id,
    'authenticated',
    'authenticated',
    p_email,
    extensions.crypt('test-password', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', p_name, 'role', p_role) || coalesce(p_extra, '{}'::jsonb),
    now(), now(),
    '', '', '', '', '', '', '', '',
    false, false, false
  );
end;
$$;

create or replace function public._test_as(p_id uuid) returns void
language plpgsql
as $$
begin
  perform set_config('request.jwt.claim.sub', p_id::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', p_id::text, 'role', 'authenticated')::text,
    true
  );
end;
$$;

create or replace function public._test_approve(p_athlete uuid) returns bigint
language plpgsql
as $$
declare
  updated_rows bigint;
begin
  update public.memberships
  set status = 'approved'
  where athlete_id = p_athlete;
  get diagnostics updated_rows = row_count;
  return updated_rows;
end;
$$;

select plan(29);

select ok((select relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname = 'profiles'), 'RLS profiles');
select ok((select relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname = 'coaches'), 'RLS coaches');
select ok((select relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname = 'memberships'), 'RLS memberships');
select ok((select relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname = 'athlete_profiles'), 'RLS athlete_profiles');
select ok((select relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname = 'measurements'), 'RLS measurements');
select ok((select relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname = 'diet_plans'), 'RLS diet_plans');
select ok((select relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname = 'workout_plans'), 'RLS workout_plans');
select ok(
  exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'athlete_files_select'
  ),
  'storage read policy exists'
);

select throws_ok(
  $$ select public._test_make_user(
       'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
       'bad-coach@gymbuddy.test',
       'Nessuno',
       'coach',
       '{"coach_signup_code":"wrong"}'::jsonb
     ) $$,
  'P0001',
  'Codice registrazione coach non valido',
  'coach registration requires the project code'
);

select throws_ok(
  $$ select public._test_make_user(
       'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
       'bad-athlete@gymbuddy.test',
       'Nessuno',
       'athlete',
       '{"invite_code":"NOPE0000"}'::jsonb
     ) $$,
  'P0001',
  'Codice invito non valido',
  'athlete registration requires a real invite code'
);

select public._test_make_user(
  'c1111111-1111-4111-8111-111111111111',
  'coach-a@gymbuddy.test',
  'Coach A',
  'coach',
  jsonb_build_object('coach_signup_code', (select value from private.settings where key = 'coach_signup_code'))
);
select public._test_make_user(
  'c2222222-2222-4222-8222-222222222222',
  'coach-b@gymbuddy.test',
  'Coach B',
  'coach',
  jsonb_build_object('coach_signup_code', (select value from private.settings where key = 'coach_signup_code'))
);

update public.coaches set signup_code = 'COACHA01' where id = 'c1111111-1111-4111-8111-111111111111';
update public.coaches set signup_code = 'COACHB02' where id = 'c2222222-2222-4222-8222-222222222222';

select public._test_make_user(
  'a1111111-1111-4111-8111-111111111111',
  'athlete-a@gymbuddy.test',
  'Athlete A',
  'athlete',
  '{"invite_code":"COACHA01"}'::jsonb
);
select public._test_make_user(
  'a2222222-2222-4222-8222-222222222222',
  'athlete-b@gymbuddy.test',
  'Athlete B',
  'athlete',
  '{"invite_code":"COACHB02"}'::jsonb
);

select is(
  (select status::text from public.memberships where athlete_id = 'a1111111-1111-4111-8111-111111111111'),
  'pending',
  'self-signup waits for the coach'
);

insert into public.diet_plans (athlete_id, coach_id, title, notes, is_current, content)
values
  (
    'a1111111-1111-4111-8111-111111111111',
    'c1111111-1111-4111-8111-111111111111',
    'Piano storico A',
    '',
    false,
    '{"meals":[{"name":"Pranzo","items":[{"food":"Pasta","quantity":"80 g"}]}]}'::jsonb
  ),
  (
    'a1111111-1111-4111-8111-111111111111',
    'c1111111-1111-4111-8111-111111111111',
    'Piano attuale A',
    '',
    true,
    '{"meals":[{"name":"Cena","items":[{"food":"Orata","quantity":"180 g"}]}]}'::jsonb
  ),
  (
    'a2222222-2222-4222-8222-222222222222',
    'c2222222-2222-4222-8222-222222222222',
    'Segreto di B',
    '',
    true,
    '{"meals":[{"name":"Pranzo","items":[{"food":"Quinoa","quantity":"60 g"}]}]}'::jsonb
  );

insert into public.measurements (athlete_id, recorded_on, weight_kg, created_by)
values
  ('a1111111-1111-4111-8111-111111111111', '2026-10-01', 70, 'c1111111-1111-4111-8111-111111111111'),
  ('a2222222-2222-4222-8222-222222222222', '2026-10-01', 61, 'c2222222-2222-4222-8222-222222222222');

select public._test_as('c1111111-1111-4111-8111-111111111111');
set local role authenticated;

select is((select count(*) from public.memberships), 1::bigint, 'coach A sees only their athlete');
select is((select count(*) from public.profiles where id = 'a2222222-2222-4222-8222-222222222222'), 0::bigint, 'coach A cannot read coach B athlete');
select is((select count(*) from public.diet_plans where title = 'Segreto di B'), 0::bigint, 'coach A cannot read coach B diet');
select is((select count(*) from public.measurements where weight_kg = 61), 0::bigint, 'coach A cannot read coach B measurements');
select is((select signup_code from public.coaches), 'COACHA01', 'coach reads only their invite code');

reset role;
select public._test_as('a1111111-1111-4111-8111-111111111111');
set local role authenticated;

select is((select count(*) from public.diet_plans), 0::bigint, 'pending athlete cannot read diets');
select is((select count(*) from public.measurements), 0::bigint, 'pending athlete cannot read measurements');
select is((select count(*) from public.coaches), 0::bigint, 'athlete cannot read invite codes');
select is(
  public._test_approve('a1111111-1111-4111-8111-111111111111'),
  0::bigint,
  'athlete cannot approve themselves'
);

reset role;
select public._test_as('c2222222-2222-4222-8222-222222222222');
set local role authenticated;
select is(
  public._test_approve('a1111111-1111-4111-8111-111111111111'),
  0::bigint,
  'another coach cannot approve the athlete'
);

reset role;
select public._test_as('c1111111-1111-4111-8111-111111111111');
set local role authenticated;
update public.memberships
set status = 'approved'
where athlete_id = 'a1111111-1111-4111-8111-111111111111';

reset role;
select is(
  (select status::text from public.memberships where athlete_id = 'a1111111-1111-4111-8111-111111111111'),
  'approved',
  'owning coach approval sticks'
);

select public._test_as('a1111111-1111-4111-8111-111111111111');
set local role authenticated;
select is((select count(*) from public.diet_plans), 1::bigint, 'approved athlete sees only the current diet');
select is((select title from public.diet_plans), 'Piano attuale A', 'approved athlete sees their own plan');
select is((select count(*) from public.measurements), 1::bigint, 'approved athlete sees their measurements');
select is((select count(*) from public.measurements where weight_kg = 61), 0::bigint, 'approved athlete cannot see another athlete');
select throws_ok(
  $$ insert into public.diet_plans (athlete_id, coach_id, title, content)
     values (
       'a1111111-1111-4111-8111-111111111111',
       'c1111111-1111-4111-8111-111111111111',
       'Autogestito',
       '{"meals":[{"name":"Snack","items":[{"food":"Mela","quantity":"1"}]}]}'::jsonb
     ) $$,
  '42501',
  NULL,
  'athlete cannot write a diet'
);

reset role;
select throws_ok(
  $$ insert into public.diet_plans (athlete_id, coach_id, title, content)
     values (
       'a1111111-1111-4111-8111-111111111111',
       'c1111111-1111-4111-8111-111111111111',
       'Vuoto',
       '{"meals":[]}'::jsonb
     ) $$,
  '23514',
  NULL,
  'invalid diet content is rejected'
);

set local role anon;
select throws_ok(
  'select * from public.profiles',
  '42501',
  NULL,
  'anonymous role cannot read profiles'
);

select * from finish();
rollback;
