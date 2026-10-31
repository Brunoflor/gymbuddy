"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn, signUpAthlete, signUpCoach } from "@/lib/actions";
import { it } from "@/lib/i18n/it";
import { Button, Notice, TextField } from "@/components/ui";

export function LoginForm({ showDemo }: { showDemo: boolean }) {
  const [state, action, pending] = useActionState(signIn, null);

  return (
    <form action={action} className="space-y-4">
      <TextField label={it.auth.email} name="email" type="email" autoComplete="email" required />
      <TextField
        label={it.auth.password}
        name="password"
        type="password"
        autoComplete="current-password"
        required
        minLength={8}
      />
      {state?.message ? <Notice tone="bad">{state.message}</Notice> : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? it.common.saving : it.auth.submitSignIn}
      </Button>
      {showDemo ? (
        <div className="rounded-2xl bg-sand px-3 py-3 text-xs leading-5 text-muted">
          <p className="font-semibold text-ink">{it.auth.demoTitle}</p>
          <p>bruno@gymbuddy.local · coach</p>
          <p>giulia@gymbuddy.local · atleta</p>
          <p>luca@gymbuddy.local · in attesa</p>
          <p>Password: GymBuddy-demo-1</p>
        </div>
      ) : null}
      <p className="text-sm text-muted">
        {it.auth.noAccount}{" "}
        <Link href="/registrati" className="font-semibold text-pine">
          {it.landing.registerCoach}
        </Link>
      </p>
    </form>
  );
}

export function CoachSignUpForm() {
  const [state, action, pending] = useActionState(signUpCoach, null);
  return (
    <form action={action} className="space-y-4">
      <TextField label={it.auth.fullName} name="fullName" autoComplete="name" required />
      <TextField label={it.auth.email} name="email" type="email" autoComplete="email" required />
      <TextField
        label={it.auth.password}
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        hint={it.auth.passwordHint}
      />
      <TextField label={it.auth.coachCode} name="coachSignupCode" required />
      {state?.message ? <Notice tone={state.ok ? "ok" : "bad"}>{state.message}</Notice> : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? it.common.saving : it.auth.submitCoach}
      </Button>
      <p className="text-sm text-muted">
        {it.auth.hasAccount}{" "}
        <Link href="/accedi" className="font-semibold text-pine">
          {it.auth.goSignIn}
        </Link>
      </p>
    </form>
  );
}

export function AthleteSignUpForm({ code, coachName }: { code: string; coachName: string }) {
  const [state, action, pending] = useActionState(signUpAthlete, null);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="inviteCode" value={code} />
      <p className="text-sm text-muted">
        {it.auth.athleteLead} <span className="font-semibold text-ink">{coachName}</span>.
      </p>
      <TextField label={it.auth.fullName} name="fullName" autoComplete="name" required />
      <TextField label={it.auth.email} name="email" type="email" autoComplete="email" required />
      <TextField
        label={it.auth.password}
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        hint={it.auth.passwordHint}
      />
      {state?.message ? <Notice tone={state.ok ? "ok" : "bad"}>{state.message}</Notice> : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? it.common.saving : it.auth.submitAthlete}
      </Button>
    </form>
  );
}
