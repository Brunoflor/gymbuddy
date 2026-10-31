-- Local demo data only. Password for every account: GymBuddy-demo-1
-- Coach registration secret for this database: gymbuddy-coach-local

update private.settings
set value = 'gymbuddy-coach-local'
where key = 'coach_signup_code';

create or replace function public.seed_login(
  p_id uuid,
  p_email text,
  p_name text,
  p_role text,
  p_extra jsonb
)
returns void
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
begin
  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    email_change_token_current,
    phone_change,
    phone_change_token,
    reauthentication_token,
    is_super_admin,
    is_sso_user,
    is_anonymous
  ) values (
    '00000000-0000-0000-0000-000000000000',
    p_id,
    'authenticated',
    'authenticated',
    p_email,
    extensions.crypt('GymBuddy-demo-1', extensions.gen_salt('bf', 10)),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', p_name, 'role', p_role) || coalesce(p_extra, '{}'::jsonb),
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    false,
    false,
    false
  );

  insert into auth.identities (
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) values (
    p_id::text,
    p_id,
    jsonb_build_object(
      'sub', p_id::text,
      'email', p_email,
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    now(),
    now(),
    now()
  );
end;
$$;

select public.seed_login(
  '11111111-1111-4111-8111-111111111111',
  'bruno@gymbuddy.local',
  'Bruno Flora',
  'coach',
  jsonb_build_object('coach_signup_code', 'gymbuddy-coach-local')
);

select public.seed_login(
  '44444444-4444-4444-8444-444444444444',
  'marco@gymbuddy.local',
  'Marco Rossi',
  'coach',
  jsonb_build_object('coach_signup_code', 'gymbuddy-coach-local')
);

update public.coaches
set signup_code = 'BRUNO001'
where id = '11111111-1111-4111-8111-111111111111';

update public.coaches
set signup_code = 'MARCO002'
where id = '44444444-4444-4444-8444-444444444444';

select public.seed_login(
  '22222222-2222-4222-8222-222222222222',
  'giulia@gymbuddy.local',
  'Giulia Ferrara',
  'athlete',
  jsonb_build_object('invite_code', 'BRUNO001')
);

select public.seed_login(
  '33333333-3333-4333-8333-333333333333',
  'luca@gymbuddy.local',
  'Luca Esposito',
  'athlete',
  jsonb_build_object('invite_code', 'BRUNO001')
);

select public.seed_login(
  '55555555-5555-4555-8555-555555555555',
  'sara@gymbuddy.local',
  'Sara Conti',
  'athlete',
  jsonb_build_object('invite_code', 'MARCO002')
);

update public.memberships
set status = 'approved'
where athlete_id in (
  '22222222-2222-4222-8222-222222222222',
  '55555555-5555-4555-8555-555555555555'
);

insert into public.athlete_profiles (athlete_id, sex, birth_date, height_cm, notes)
values
  (
    '22222222-2222-4222-8222-222222222222',
    'female',
    '1996-04-12',
    168,
    'Tre sedute a settimana, meglio la sera. Nessun dolore segnalato.'
  ),
  (
    '55555555-5555-4555-8555-555555555555',
    'female',
    '1998-11-02',
    172,
    'Preferisce il lavoro con i manubri. Disponibile lunedì e giovedì.'
  );

insert into public.measurements (
  athlete_id, recorded_on, weight_kg, body_fat_pct, chest_cm, waist_cm, hips_cm, arm_cm, thigh_cm, notes, created_by
) values
  ('22222222-2222-4222-8222-222222222222', '2026-09-02', 68.4, 27.0, 90.0, 78.0, 98.0, 29.5, 57.0, 'Prima rilevazione.', '11111111-1111-4111-8111-111111111111'),
  ('22222222-2222-4222-8222-222222222222', '2026-09-16', 67.6, 26.4, 90.0, 76.5, 97.0, 29.5, 56.5, '', '11111111-1111-4111-8111-111111111111'),
  ('22222222-2222-4222-8222-222222222222', '2026-09-30', 67.0, 25.8, 91.0, 75.0, 96.5, 30.0, 56.0, '', '11111111-1111-4111-8111-111111111111'),
  ('22222222-2222-4222-8222-222222222222', '2026-10-14', 66.4, 25.2, 91.0, 74.0, 96.0, 30.0, 56.0, 'Vita in calo, forza stabile.', '11111111-1111-4111-8111-111111111111'),
  ('22222222-2222-4222-8222-222222222222', '2026-10-28', 66.1, 24.8, 91.5, 73.5, 95.5, 30.5, 55.5, '', '11111111-1111-4111-8111-111111111111'),
  ('55555555-5555-4555-8555-555555555555', '2026-10-01', 61.2, 23.0, 86.0, 70.0, 94.0, 27.0, 54.0, 'Visibile solo a Marco.', '44444444-4444-4444-8444-444444444444'),
  ('55555555-5555-4555-8555-555555555555', '2026-10-20', 60.8, 22.6, 86.0, 69.0, 93.5, 27.0, 54.0, '', '44444444-4444-4444-8444-444444444444');

insert into public.diet_plans (athlete_id, coach_id, title, notes, is_current, content)
values (
  '22222222-2222-4222-8222-222222222222',
  '11111111-1111-4111-8111-111111111111',
  'Piano Giulia — storico',
  'Sostituito a ottobre.',
  false,
  jsonb_build_object(
    'meals', jsonb_build_array(
      jsonb_build_object(
        'name', 'Pranzo',
        'time', '13:30',
        'items', jsonb_build_array(
          jsonb_build_object('food', 'Pasta al pomodoro', 'quantity', '80 g', 'notes', '')
        )
      )
    )
  )
);

insert into public.diet_plans (athlete_id, coach_id, title, notes, is_current, content)
values (
  '22222222-2222-4222-8222-222222222222',
  '11111111-1111-4111-8111-111111111111',
  'Piano Giulia — ricomposizione',
  'Indicativo. Bevi durante il giorno e adatta il riso se la seduta è pesante.',
  true,
  jsonb_build_object(
    'meals', jsonb_build_array(
      jsonb_build_object(
        'name', 'Colazione',
        'time', '07:30',
        'items', jsonb_build_array(
          jsonb_build_object('food', 'Yogurt greco 0%', 'quantity', '170 g', 'notes', ''),
          jsonb_build_object('food', 'Avena', 'quantity', '40 g', 'notes', ''),
          jsonb_build_object('food', 'Mirtilli', 'quantity', '80 g', 'notes', '')
        )
      ),
      jsonb_build_object(
        'name', 'Spuntino',
        'time', '11:00',
        'items', jsonb_build_array(
          jsonb_build_object('food', 'Mela', 'quantity', '1', 'notes', ''),
          jsonb_build_object('food', 'Mandorle', 'quantity', '15 g', 'notes', '')
        )
      ),
      jsonb_build_object(
        'name', 'Pranzo',
        'time', '13:30',
        'items', jsonb_build_array(
          jsonb_build_object('food', 'Petto di pollo', 'quantity', '150 g', 'notes', ''),
          jsonb_build_object('food', 'Riso basmati', 'quantity', '70 g', 'notes', 'Peso a crudo'),
          jsonb_build_object('food', 'Zucchine', 'quantity', '200 g', 'notes', ''),
          jsonb_build_object('food', 'Olio extravergine', 'quantity', '10 g', 'notes', '')
        )
      ),
      jsonb_build_object(
        'name', 'Cena',
        'time', '20:30',
        'items', jsonb_build_array(
          jsonb_build_object('food', 'Orata al forno', 'quantity', '180 g', 'notes', ''),
          jsonb_build_object('food', 'Patate', 'quantity', '150 g', 'notes', ''),
          jsonb_build_object('food', 'Insalata mista', 'quantity', 'a volontà', 'notes', '')
        )
      )
    )
  )
);

insert into public.diet_plans (athlete_id, coach_id, title, notes, is_current, content)
values (
  '55555555-5555-4555-8555-555555555555',
  '44444444-4444-4444-8444-444444444444',
  'Piano Sara — definizione',
  'Solo per il roster di Marco.',
  true,
  jsonb_build_object(
    'meals', jsonb_build_array(
      jsonb_build_object(
        'name', 'Pranzo',
        'time', '13:00',
        'items', jsonb_build_array(
          jsonb_build_object('food', 'Salmone', 'quantity', '140 g', 'notes', ''),
          jsonb_build_object('food', 'Quinoa', 'quantity', '60 g', 'notes', '')
        )
      )
    )
  )
);

insert into public.workout_plans (athlete_id, coach_id, title, notes, is_current, content)
values (
  '22222222-2222-4222-8222-222222222222',
  '11111111-1111-4111-8111-111111111111',
  'Scheda Giulia — autunno',
  'Riscaldamento 8 minuti. Ferma la serie se perdi il controllo del movimento.',
  true,
  jsonb_build_object(
    'days', jsonb_build_array(
      jsonb_build_object(
        'name', 'Giorno A — Spinta',
        'notes', 'Petto, spalle, tricipiti.',
        'exercises', jsonb_build_array(
          jsonb_build_object('name', 'Panca piana', 'sets', 4, 'reps', '6-8', 'rest_seconds', 120, 'notes', 'Discesa controllata'),
          jsonb_build_object('name', 'Lento manubri', 'sets', 3, 'reps', '8-10', 'rest_seconds', 90, 'notes', ''),
          jsonb_build_object('name', 'Croci ai cavi', 'sets', 3, 'reps', '12', 'rest_seconds', 60, 'notes', ''),
          jsonb_build_object('name', 'French press', 'sets', 3, 'reps', '10', 'rest_seconds', 75, 'notes', '')
        )
      ),
      jsonb_build_object(
        'name', 'Giorno B — Trazione',
        'notes', '',
        'exercises', jsonb_build_array(
          jsonb_build_object('name', 'Lat machine', 'sets', 4, 'reps', '6-8', 'rest_seconds', 120, 'notes', ''),
          jsonb_build_object('name', 'Rematore manubrio', 'sets', 3, 'reps', '8-10', 'rest_seconds', 90, 'notes', ''),
          jsonb_build_object('name', 'Face pull', 'sets', 3, 'reps', '15', 'rest_seconds', 60, 'notes', ''),
          jsonb_build_object('name', 'Curl manubri', 'sets', 3, 'reps', '10', 'rest_seconds', 60, 'notes', '')
        )
      ),
      jsonb_build_object(
        'name', 'Giorno C — Gambe',
        'notes', '',
        'exercises', jsonb_build_array(
          jsonb_build_object('name', 'Squat', 'sets', 4, 'reps', '6-8', 'rest_seconds', 150, 'notes', ''),
          jsonb_build_object('name', 'Affondi', 'sets', 3, 'reps', '8/gamba', 'rest_seconds', 90, 'notes', ''),
          jsonb_build_object('name', 'Leg curl', 'sets', 3, 'reps', '12', 'rest_seconds', 60, 'notes', ''),
          jsonb_build_object('name', 'Calf raise', 'sets', 3, 'reps', '15', 'rest_seconds', 45, 'notes', '')
        )
      )
    )
  )
);

insert into public.workout_plans (athlete_id, coach_id, title, notes, is_current, content)
values (
  '55555555-5555-4555-8555-555555555555',
  '44444444-4444-4444-8444-444444444444',
  'Scheda Sara',
  'Visibile solo a Marco.',
  true,
  jsonb_build_object(
    'days', jsonb_build_array(
      jsonb_build_object(
        'name', 'Full body',
        'notes', '',
        'exercises', jsonb_build_array(
          jsonb_build_object('name', 'Goblet squat', 'sets', 3, 'reps', '10', 'rest_seconds', 90, 'notes', '')
        )
      )
    )
  )
);

revoke all on function public.seed_login(uuid, text, text, text, jsonb) from public, anon, authenticated;
drop function public.seed_login(uuid, text, text, text, jsonb);
