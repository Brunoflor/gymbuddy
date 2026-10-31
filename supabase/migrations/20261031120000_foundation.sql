-- GymBuddy v1
-- Multi-coach from day one: every athlete belongs to exactly one coach.
-- RLS keys off auth.uid(), so another coach is a new row, not a schema change.

create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table private.settings (
  key text primary key,
  value text not null
);

revoke all on table private.settings from public, anon, authenticated;

insert into private.settings (key, value)
values ('coach_signup_code', 'change-me');

create type public.user_role as enum ('coach', 'athlete');
create type public.membership_status as enum ('pending', 'approved', 'rejected');
create type public.biological_sex as enum ('female', 'male', 'other', 'unspecified');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null,
  full_name text not null,
  email text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_full_name_length check (char_length(trim(full_name)) between 1 and 80)
);

create table public.coaches (
  id uuid primary key references public.profiles (id) on delete cascade,
  signup_code text not null unique,
  created_at timestamptz not null default now(),
  constraint coaches_signup_code_format check (signup_code ~ '^[A-Z0-9]{6,12}$')
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coaches (id) on delete cascade,
  athlete_id uuid not null unique references public.profiles (id) on delete cascade,
  status public.membership_status not null default 'pending',
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  constraint memberships_not_self check (coach_id <> athlete_id),
  constraint memberships_decision_timestamp check (
    (status = 'pending' and decided_at is null)
    or (status <> 'pending' and decided_at is not null)
  )
);

create index memberships_coach_status_idx on public.memberships (coach_id, status);

create table public.athlete_profiles (
  athlete_id uuid primary key references public.profiles (id) on delete cascade,
  sex public.biological_sex not null default 'unspecified',
  birth_date date,
  height_cm numeric(5, 1),
  notes text not null default '',
  updated_at timestamptz not null default now(),
  constraint athlete_profiles_birth_date check (
    birth_date is null or (birth_date >= date '1920-01-01' and birth_date <= current_date)
  ),
  constraint athlete_profiles_height check (
    height_cm is null or height_cm between 100 and 230
  ),
  constraint athlete_profiles_notes_length check (char_length(notes) <= 2000)
);

create table public.measurements (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.profiles (id) on delete cascade,
  recorded_on date not null,
  weight_kg numeric(5, 1),
  body_fat_pct numeric(4, 1),
  chest_cm numeric(5, 1),
  waist_cm numeric(5, 1),
  hips_cm numeric(5, 1),
  arm_cm numeric(5, 1),
  thigh_cm numeric(5, 1),
  notes text not null default '',
  photo_path text,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id),
  constraint measurements_unique_day unique (athlete_id, recorded_on),
  constraint measurements_recorded_on check (
    recorded_on >= date '1990-01-01' and recorded_on <= (current_date + 1)
  ),
  constraint measurements_weight check (weight_kg is null or weight_kg between 30 and 300),
  constraint measurements_body_fat check (body_fat_pct is null or body_fat_pct between 2 and 70),
  constraint measurements_chest check (chest_cm is null or chest_cm between 40 and 200),
  constraint measurements_waist check (waist_cm is null or waist_cm between 40 and 200),
  constraint measurements_hips check (hips_cm is null or hips_cm between 40 and 200),
  constraint measurements_arm check (arm_cm is null or arm_cm between 15 and 80),
  constraint measurements_thigh check (thigh_cm is null or thigh_cm between 20 and 120),
  constraint measurements_notes_length check (char_length(notes) <= 500),
  constraint measurements_photo_path check (
    photo_path is null
    or photo_path ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[A-Za-z0-9._-]{1,80}$'
  ),
  constraint measurements_has_value check (
    weight_kg is not null
    or body_fat_pct is not null
    or chest_cm is not null
    or waist_cm is not null
    or hips_cm is not null
    or arm_cm is not null
    or thigh_cm is not null
    or photo_path is not null
  )
);

create index measurements_athlete_date_idx on public.measurements (athlete_id, recorded_on);

create or replace function public.is_valid_diet_content(payload jsonb)
returns boolean
language plpgsql
immutable
as $$
declare
  meal jsonb;
  item jsonb;
  meal_count int;
  item_count int;
begin
  if payload is null or jsonb_typeof(payload) <> 'object' then
    return false;
  end if;
  if not (payload ? 'meals') or jsonb_typeof(payload -> 'meals') <> 'array' then
    return false;
  end if;

  meal_count := jsonb_array_length(payload -> 'meals');
  if meal_count < 1 or meal_count > 12 then
    return false;
  end if;

  for meal in select value from jsonb_array_elements(payload -> 'meals')
  loop
    if jsonb_typeof(meal) <> 'object' then
      return false;
    end if;
    if coalesce(char_length(btrim(meal ->> 'name')), 0) not between 1 and 60 then
      return false;
    end if;
    if meal ? 'time' and meal ->> 'time' is not null and char_length(meal ->> 'time') > 20 then
      return false;
    end if;
    if not (meal ? 'items') or jsonb_typeof(meal -> 'items') <> 'array' then
      return false;
    end if;

    item_count := jsonb_array_length(meal -> 'items');
    if item_count < 1 or item_count > 30 then
      return false;
    end if;

    for item in select value from jsonb_array_elements(meal -> 'items')
    loop
      if jsonb_typeof(item) <> 'object' then
        return false;
      end if;
      if coalesce(char_length(btrim(item ->> 'food')), 0) not between 1 and 80 then
        return false;
      end if;
      if coalesce(char_length(btrim(item ->> 'quantity')), 0) not between 1 and 40 then
        return false;
      end if;
      if item ? 'notes' and item ->> 'notes' is not null and char_length(item ->> 'notes') > 200 then
        return false;
      end if;
    end loop;
  end loop;

  return true;
exception
  when others then
    return false;
end;
$$;

create or replace function public.is_valid_workout_content(payload jsonb)
returns boolean
language plpgsql
immutable
as $$
declare
  day jsonb;
  exercise jsonb;
  day_count int;
  exercise_count int;
  sets_value int;
  rest_value int;
begin
  if payload is null or jsonb_typeof(payload) <> 'object' then
    return false;
  end if;
  if not (payload ? 'days') or jsonb_typeof(payload -> 'days') <> 'array' then
    return false;
  end if;

  day_count := jsonb_array_length(payload -> 'days');
  if day_count < 1 or day_count > 7 then
    return false;
  end if;

  for day in select value from jsonb_array_elements(payload -> 'days')
  loop
    if jsonb_typeof(day) <> 'object' then
      return false;
    end if;
    if coalesce(char_length(btrim(day ->> 'name')), 0) not between 1 and 60 then
      return false;
    end if;
    if day ? 'notes' and day ->> 'notes' is not null and char_length(day ->> 'notes') > 500 then
      return false;
    end if;
    if not (day ? 'exercises') or jsonb_typeof(day -> 'exercises') <> 'array' then
      return false;
    end if;

    exercise_count := jsonb_array_length(day -> 'exercises');
    if exercise_count < 1 or exercise_count > 20 then
      return false;
    end if;

    for exercise in select value from jsonb_array_elements(day -> 'exercises')
    loop
      if jsonb_typeof(exercise) <> 'object' then
        return false;
      end if;
      if coalesce(char_length(btrim(exercise ->> 'name')), 0) not between 1 and 80 then
        return false;
      end if;
      if coalesce(char_length(btrim(exercise ->> 'reps')), 0) not between 1 and 30 then
        return false;
      end if;
      if exercise ? 'notes' and exercise ->> 'notes' is not null and char_length(exercise ->> 'notes') > 200 then
        return false;
      end if;
      if jsonb_typeof(exercise -> 'sets') <> 'number' then
        return false;
      end if;
      sets_value := (exercise ->> 'sets')::int;
      if sets_value < 1 or sets_value > 20 then
        return false;
      end if;
      if jsonb_typeof(exercise -> 'rest_seconds') <> 'number' then
        return false;
      end if;
      rest_value := (exercise ->> 'rest_seconds')::int;
      if rest_value < 0 or rest_value > 900 then
        return false;
      end if;
    end loop;
  end loop;

  return true;
exception
  when others then
    return false;
end;
$$;

create table public.diet_plans (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.profiles (id) on delete cascade,
  coach_id uuid not null references public.coaches (id) on delete cascade,
  title text not null,
  notes text not null default '',
  is_current boolean not null default true,
  content jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint diet_plans_title_length check (char_length(btrim(title)) between 1 and 80),
  constraint diet_plans_notes_length check (char_length(notes) <= 2000),
  constraint diet_plans_content_valid check (public.is_valid_diet_content(content))
);

create unique index diet_plans_one_current_idx
  on public.diet_plans (athlete_id)
  where is_current;

create index diet_plans_athlete_idx on public.diet_plans (athlete_id, updated_at desc);

create table public.workout_plans (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.profiles (id) on delete cascade,
  coach_id uuid not null references public.coaches (id) on delete cascade,
  title text not null,
  notes text not null default '',
  is_current boolean not null default true,
  content jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workout_plans_title_length check (char_length(btrim(title)) between 1 and 80),
  constraint workout_plans_notes_length check (char_length(notes) <= 2000),
  constraint workout_plans_content_valid check (public.is_valid_workout_content(content))
);

create unique index workout_plans_one_current_idx
  on public.workout_plans (athlete_id)
  where is_current;

create index workout_plans_athlete_idx on public.workout_plans (athlete_id, updated_at desc);

create or replace function public.generate_signup_code()
returns text
language plpgsql
volatile
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
begin
  for i in 1..8 loop
    result := result || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  end loop;
  return result;
end;
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.protect_profile()
returns trigger
language plpgsql
as $$
begin
  if new.id is distinct from old.id
     or new.role is distinct from old.role
     or new.email is distinct from old.email
     or new.created_at is distinct from old.created_at then
    raise exception 'Campi del profilo non modificabili';
  end if;

  new.full_name := btrim(new.full_name);
  if char_length(new.full_name) not between 1 and 80 then
    raise exception 'Nome non valido';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.sync_membership_decision()
returns trigger
language plpgsql
as $$
begin
  if new.coach_id is distinct from old.coach_id
     or new.athlete_id is distinct from old.athlete_id
     or new.created_at is distinct from old.created_at then
    raise exception 'Dati di iscrizione non modificabili';
  end if;

  if new.status is distinct from old.status then
    if new.status = 'pending' then
      new.decided_at := null;
    else
      new.decided_at := now();
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.guard_membership_insert()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1 from public.profiles
    where id = new.athlete_id and role = 'athlete'
  ) then
    raise exception 'Il profilo non è un atleta';
  end if;

  if not exists (select 1 from public.coaches where id = new.coach_id) then
    raise exception 'Coach inesistente';
  end if;

  return new;
end;
$$;

create or replace function public.freeze_plan_owner()
returns trigger
language plpgsql
as $$
begin
  if new.athlete_id is distinct from old.athlete_id
     or new.coach_id is distinct from old.coach_id then
    raise exception 'Il piano non può cambiare atleta';
  end if;
  return new;
end;
$$;

create or replace function public.ensure_single_current_diet()
returns trigger
language plpgsql
as $$
begin
  if new.is_current then
    update public.diet_plans
    set is_current = false
    where athlete_id = new.athlete_id
      and is_current
      and id is distinct from new.id;
  end if;
  return new;
end;
$$;

create or replace function public.ensure_single_current_workout()
returns trigger
language plpgsql
as $$
begin
  if new.is_current then
    update public.workout_plans
    set is_current = false
    where athlete_id = new.athlete_id
      and is_current
      and id is distinct from new.id;
  end if;
  return new;
end;
$$;

create trigger profiles_protect
  before update on public.profiles
  for each row execute function public.protect_profile();

create trigger memberships_guard_insert
  before insert on public.memberships
  for each row execute function public.guard_membership_insert();

create trigger memberships_sync_decision
  before update on public.memberships
  for each row execute function public.sync_membership_decision();

create trigger athlete_profiles_touch
  before update on public.athlete_profiles
  for each row execute function public.touch_updated_at();

create trigger diet_plans_single_current
  before insert or update of is_current, athlete_id on public.diet_plans
  for each row execute function public.ensure_single_current_diet();

create trigger diet_plans_freeze_owner
  before update on public.diet_plans
  for each row execute function public.freeze_plan_owner();

create trigger diet_plans_touch
  before update on public.diet_plans
  for each row execute function public.touch_updated_at();

create trigger workout_plans_single_current
  before insert or update of is_current, athlete_id on public.workout_plans
  for each row execute function public.ensure_single_current_workout();

create trigger workout_plans_freeze_owner
  before update on public.workout_plans
  for each row execute function public.freeze_plan_owner();

create trigger workout_plans_touch
  before update on public.workout_plans
  for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  requested_role text;
  resolved_role public.user_role;
  cleaned_name text;
  invite text;
  coach uuid;
  secret text;
  provided_secret text;
  new_code text;
  attempts int := 0;
begin
  if new.email is null or btrim(new.email) = '' then
    raise exception 'Email obbligatoria';
  end if;

  requested_role := lower(btrim(coalesce(new.raw_user_meta_data ->> 'role', '')));
  cleaned_name := btrim(coalesce(new.raw_user_meta_data ->> 'full_name', ''));

  if char_length(cleaned_name) not between 1 and 80 then
    raise exception 'Nome non valido';
  end if;

  if requested_role = 'coach' then
    resolved_role := 'coach';
    provided_secret := coalesce(new.raw_user_meta_data ->> 'coach_signup_code', '');
    select value into secret from private.settings where key = 'coach_signup_code';
    if secret is null or provided_secret = '' or provided_secret is distinct from secret then
      raise exception 'Codice registrazione coach non valido';
    end if;
  elsif requested_role = 'athlete' then
    resolved_role := 'athlete';
  else
    raise exception 'Ruolo non valido';
  end if;

  insert into public.profiles (id, role, full_name, email)
  values (new.id, resolved_role, cleaned_name, lower(new.email));

  if resolved_role = 'coach' then
    loop
      new_code := public.generate_signup_code();
      begin
        insert into public.coaches (id, signup_code)
        values (new.id, new_code);
        exit;
      exception
        when unique_violation then
          attempts := attempts + 1;
          if attempts > 5 then
            raise exception 'Impossibile generare il codice invito';
          end if;
      end;
    end loop;
  else
    invite := upper(btrim(coalesce(new.raw_user_meta_data ->> 'invite_code', '')));
    select id into coach from public.coaches where signup_code = invite;
    if coach is null then
      raise exception 'Codice invito non valido';
    end if;

    insert into public.memberships (coach_id, athlete_id, status)
    values (coach, new.id, 'pending');
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.manages_athlete(target uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships
    where athlete_id = target
      and coach_id = auth.uid()
  );
$$;

create or replace function public.is_approved_self()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships
    where athlete_id = auth.uid()
      and status = 'approved'
  );
$$;

create or replace function public.safe_uuid(value text)
returns uuid
language plpgsql
immutable
as $$
begin
  if value is null or value !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return null;
  end if;
  return value::uuid;
exception
  when others then
    return null;
end;
$$;

create or replace function public.coach_name_for_code(code text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select p.full_name
  from public.coaches c
  join public.profiles p on p.id = c.id
  where c.signup_code = upper(btrim(code))
  limit 1;
$$;

alter table public.profiles enable row level security;
alter table public.coaches enable row level security;
alter table public.memberships enable row level security;
alter table public.athlete_profiles enable row level security;
alter table public.measurements enable row level security;
alter table public.diet_plans enable row level security;
alter table public.workout_plans enable row level security;

grant usage on schema public to anon, authenticated;

revoke all on all tables in schema public from anon, authenticated;

grant select, update on public.profiles to authenticated;
grant select on public.coaches to authenticated;
grant select, update on public.memberships to authenticated;
grant select, insert, update, delete on public.athlete_profiles to authenticated;
grant select, insert, update, delete on public.measurements to authenticated;
grant select, insert, update, delete on public.diet_plans to authenticated;
grant select, insert, update, delete on public.workout_plans to authenticated;

revoke all on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.handle_new_user() to supabase_auth_admin;
revoke all on function public.generate_signup_code() from public, anon, authenticated;
revoke all on function public.is_valid_diet_content(jsonb) from public, anon, authenticated;
revoke all on function public.is_valid_workout_content(jsonb) from public, anon, authenticated;
revoke all on function public.touch_updated_at() from public, anon, authenticated;
revoke all on function public.protect_profile() from public, anon, authenticated;
revoke all on function public.sync_membership_decision() from public, anon, authenticated;
revoke all on function public.guard_membership_insert() from public, anon, authenticated;
revoke all on function public.freeze_plan_owner() from public, anon, authenticated;
revoke all on function public.ensure_single_current_diet() from public, anon, authenticated;
revoke all on function public.ensure_single_current_workout() from public, anon, authenticated;
revoke all on function public.manages_athlete(uuid) from public, anon, authenticated;
revoke all on function public.is_approved_self() from public, anon, authenticated;
revoke all on function public.safe_uuid(text) from public, anon, authenticated;
revoke all on function public.coach_name_for_code(text) from public, anon, authenticated;

grant execute on function public.is_valid_diet_content(jsonb) to authenticated;
grant execute on function public.is_valid_workout_content(jsonb) to authenticated;
grant execute on function public.touch_updated_at() to authenticated;
grant execute on function public.protect_profile() to authenticated;
grant execute on function public.sync_membership_decision() to authenticated;
grant execute on function public.guard_membership_insert() to authenticated;
grant execute on function public.freeze_plan_owner() to authenticated;
grant execute on function public.ensure_single_current_diet() to authenticated;
grant execute on function public.ensure_single_current_workout() to authenticated;
grant execute on function public.manages_athlete(uuid) to authenticated;
grant execute on function public.is_approved_self() to authenticated;
grant execute on function public.safe_uuid(text) to authenticated;
grant execute on function public.coach_name_for_code(text) to anon, authenticated;

create policy profiles_select on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or public.manages_athlete(id)
    or id in (
      select m.coach_id from public.memberships m where m.athlete_id = auth.uid()
    )
  );

create policy profiles_update on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.manages_athlete(id))
  with check (id = auth.uid() or public.manages_athlete(id));

create policy coaches_select_own on public.coaches
  for select to authenticated
  using (id = auth.uid());

create policy memberships_select on public.memberships
  for select to authenticated
  using (coach_id = auth.uid() or athlete_id = auth.uid());

create policy memberships_update_coach on public.memberships
  for update to authenticated
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid());

create policy athlete_profiles_select on public.athlete_profiles
  for select to authenticated
  using (
    public.manages_athlete(athlete_id)
    or (athlete_id = auth.uid() and public.is_approved_self())
  );

create policy athlete_profiles_insert on public.athlete_profiles
  for insert to authenticated
  with check (public.manages_athlete(athlete_id));

create policy athlete_profiles_update on public.athlete_profiles
  for update to authenticated
  using (public.manages_athlete(athlete_id))
  with check (public.manages_athlete(athlete_id));

create policy athlete_profiles_delete on public.athlete_profiles
  for delete to authenticated
  using (public.manages_athlete(athlete_id));

create policy measurements_select on public.measurements
  for select to authenticated
  using (
    public.manages_athlete(athlete_id)
    or (athlete_id = auth.uid() and public.is_approved_self())
  );

create policy measurements_insert on public.measurements
  for insert to authenticated
  with check (public.manages_athlete(athlete_id));

create policy measurements_update on public.measurements
  for update to authenticated
  using (public.manages_athlete(athlete_id))
  with check (public.manages_athlete(athlete_id));

create policy measurements_delete on public.measurements
  for delete to authenticated
  using (public.manages_athlete(athlete_id));

create policy diet_plans_select on public.diet_plans
  for select to authenticated
  using (
    coach_id = auth.uid()
    or (
      athlete_id = auth.uid()
      and is_current
      and public.is_approved_self()
    )
  );

create policy diet_plans_insert on public.diet_plans
  for insert to authenticated
  with check (
    coach_id = auth.uid()
    and public.manages_athlete(athlete_id)
  );

create policy diet_plans_update on public.diet_plans
  for update to authenticated
  using (coach_id = auth.uid())
  with check (
    coach_id = auth.uid()
    and public.manages_athlete(athlete_id)
  );

create policy diet_plans_delete on public.diet_plans
  for delete to authenticated
  using (coach_id = auth.uid());

create policy workout_plans_select on public.workout_plans
  for select to authenticated
  using (
    coach_id = auth.uid()
    or (
      athlete_id = auth.uid()
      and is_current
      and public.is_approved_self()
    )
  );

create policy workout_plans_insert on public.workout_plans
  for insert to authenticated
  with check (
    coach_id = auth.uid()
    and public.manages_athlete(athlete_id)
  );

create policy workout_plans_update on public.workout_plans
  for update to authenticated
  using (coach_id = auth.uid())
  with check (
    coach_id = auth.uid()
    and public.manages_athlete(athlete_id)
  );

create policy workout_plans_delete on public.workout_plans
  for delete to authenticated
  using (coach_id = auth.uid());

comment on table public.memberships is
  'One athlete belongs to one coach. status starts at pending until that coach approves.';
comment on table public.coaches is
  'Coach directory. signup_code is the personal athlete registration code.';
comment on table private.settings is
  'Server-side settings. coach_signup_code gates self-service coach registration.';
