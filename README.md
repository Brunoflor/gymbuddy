# 💪 GymBuddy

**A personal training management platform for coaches and their athletes.**

GymBuddy brings everything a personal trainer needs into one place: clients' diets, body measurements and training plans, with a dedicated experience for each side of the relationship.

## Two sides, one platform

### 🧑‍💼 Admin (coach)
- Manage the client roster
- Create and update **diet plans** for each client
- Track **physical characteristics** and body measurements over time
- Build and assign **workout plans** (training cards)

### 🏋️ Athlete
- See your current diet and workout plan
- Follow your progress on physical characteristics
- Always know what's next, without chasing your coach on chat

## Status
v1 foundation: responsive installable web app (Italian UI), Supabase schema with row level security, auth, and the coach approval flow. Native store apps can come later; the rules live in Postgres so another client can reuse the same project.

## Author
Built by [Bruno Flora](https://github.com/Brunoflor) — Naples 🇮🇹

## Stack

- Next.js (App Router, TypeScript) and Tailwind
- Supabase: Postgres, Auth, Row Level Security, Storage
- Deploy target: Vercel
- UI copy lives in `lib/i18n/it.ts` so another language is a new dictionary, not a scavenger hunt

v1 runs with a single coach, but the schema is already multi-coach. Every athlete belongs to one coach. Policies keep each coach on their own roster and each athlete on their own data.

## Local development

Requirements: Docker, the [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started), and Node.js 22.

```bash
supabase start
supabase status
cp .env.example .env.local
# paste API URL and the anon key (or the publishable key) into .env.local
npm install
npm run dev
```

Open http://127.0.0.1:3000. The app is a PWA: from the browser menu, install it on the home screen.

`supabase start` applies migrations and `supabase/seed.sql`. Reset anytime with `supabase db reset`.

### Demo accounts

Local only. Password for every account: `GymBuddy-demo-1`

| Email | Role |
| --- | --- |
| bruno@gymbuddy.local | Coach Bruno Flora, invite code `BRUNO001` |
| giulia@gymbuddy.local | Approved athlete |
| luca@gymbuddy.local | Waiting for approval |
| marco@gymbuddy.local | Second coach, invite code `MARCO002`, used to prove isolation |

Two doors, locally and in production (`https://gymbuddy-olive.vercel.app`):

| Who | Path |
| --- | --- |
| Coach | `/coach` |
| Athlete | `/atleta` |

Share `/atleta` with clients who already have an account. New athletes still register through the coach's invite link, for Bruno: http://127.0.0.1:3000/iscriviti/BRUNO001

The coach registration code stored in this local database is `gymbuddy-coach-local`. It is required on `/coach/registrati` and is not the same thing as an athlete invite code. `/registrati` redirects there. `/accedi` only asks which door to use.

Mailpit (local auth emails) is at http://127.0.0.1:54324. Email confirmation is off in the local stack.

## Checks

```bash
npm run lint
npm run typecheck
npm test          # domain rules and the approval routing
npm run test:db   # pgTAP: RLS and the approval flow, needs the local stack
npm run build
```

`npm run check` runs lint, typecheck, unit tests, and the production build.

## Deploy

### Supabase

1. Create a project on [supabase.com](https://supabase.com). Use Postgres 17 so it matches `supabase/config.toml`.
2. Install the CLI, then `supabase login` and `supabase link --project-ref <ref>`.
3. `supabase db push` to apply `supabase/migrations`.
4. In the SQL editor, replace the coach registration secret before anyone can open a coach account:

```sql
update private.settings
set value = 'a-long-random-secret'
where key = 'coach_signup_code';
```

5. In Authentication → URL configuration, set Site URL to the Vercel domain and add `https://<your-app>.vercel.app` to the redirect allow list.
6. Turn on email confirmations and configure custom SMTP before real users sign up. The built-in Supabase mailer is only for early experiments.
7. Register the first coach at `/coach/registrati` with that secret. Share `/coach` only with coaches and `/atleta` with clients. New athletes still join through `/iscriviti/<code>` from the coach home screen.

Storage bucket `athlete-files` is created by the migration (private progress photos). You do not need to create it by hand.

### Vercel

1. Import this repository. Framework preset: Next.js.
2. Environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon or publishable key>
```

`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is accepted if the project uses the newer key name instead of the anon key. Leave `NEXT_PUBLIC_DEMO_HINTS` unset in production so the sign-in screen does not list demo accounts.

3. Deploy. The live doors are `/coach` and `/atleta`. After the first coach exists, new athletes join through `/iscriviti/<code>` and stay on the waiting screen until that coach approves them. A coach who signs in on `/atleta` (or an athlete on `/coach`) is sent to their own area with a short explanation.

## What is in v1

- Separate coach door (`/coach`) and athlete door (`/atleta`), plus invite-code signup
- Personal invite code and link; athletes start as `pending`
- Approve, reject, or put a request back to waiting
- Diet plans and workout cards (days, exercises, sets, reps, rest, notes), including previous versions kept in the database
- Physical characteristics and measurement history, with charts and optional progress photos
- Row level security so coach A cannot read coach B, and a pending or rejected athlete cannot read plans or measurements

## Still for the owner

- Set the production coach registration secret, then create the real coach account at `/coach/registrati`
- Share `/coach` with coaches and `/atleta` with clients. New athletes still need `/iscriviti/<code>`
- Configure production email (SMTP) and confirmations
- Decide whether rejected athletes may reapply with another email; v1 keeps a single membership per athlete and lets the coach move it back to waiting
- A future native app can use the same Supabase project. No schema rewrite is required to add coaches
