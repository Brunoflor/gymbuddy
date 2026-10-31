"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, signUpAthlete, signUpCoach } from "@/lib/actions";
import type { Door } from "@/lib/domain";
import { it } from "@/lib/i18n/it";
import { Button, Notice, TextField } from "@/components/ui";

export function LoginForm({ door, showDemo }: { door: Door; showDemo: boolean }) {
  const [state, action, pending] = useActionState(signIn, null);
  const coachDoor = door === "coach";

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="door" value={door} />
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
      <Button type="submit" disabled={pending} className="w-full" variant={coachDoor ? "primary" : "ember"}>
        {pending ? it.common.saving : it.auth.submitSignIn}
      </Button>
      {showDemo ? (
        <div className="rounded-2xl bg-sand px-3 py-3 text-xs leading-5 text-muted">
          <p className="font-semibold text-ink">{it.auth.demoTitle}</p>
          {coachDoor ? <p>bruno@gymbuddy.local</p> : (
            <>
              <p>giulia@gymbuddy.local · atleta</p>
              <p>luca@gymbuddy.local · in attesa</p>
            </>
          )}
          <p>Password: GymBuddy-demo-1</p>
        </div>
      ) : null}
      {coachDoor ? (
        <p className="text-sm text-muted">
          {it.auth.noAccount}{" "}
          <Link href="/coach/registrati" className="font-semibold text-pine">
            {it.landing.registerCoach}
          </Link>
        </p>
      ) : (
        <InviteCodeJump />
      )}
      <p className="text-sm text-muted">
        {coachDoor ? it.auth.switchToAthlete : it.auth.switchToCoach}{" "}
        <Link href={coachDoor ? "/atleta" : "/coach"} className="font-semibold text-ember">
          {coachDoor ? it.landing.athleteEntry : it.landing.coachEntry}
        </Link>
      </p>
    </form>
  );
}

function InviteCodeJump() {
  const router = useRouter();
  const [code, setCode] = useState("");

  return (
    <div className="rounded-2xl bg-sand px-3 py-3">
      <p className="text-sm font-medium">{it.auth.inviteJumpHint}</p>
      <div className="mt-2 flex gap-2">
        <input
          className="w-full rounded-2xl border border-line bg-white px-3 py-3 text-base uppercase"
          aria-label={it.auth.inviteJumpLabel}
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          maxLength={12}
        />
        <button
          type="button"
          className="shrink-0 rounded-full bg-ember px-4 py-2 text-sm font-semibold text-white"
          onClick={() => {
            const normalized = code.trim();
            if (normalized) router.push(`/iscriviti/${normalized}`);
          }}
        >
          {it.auth.inviteJumpButton}
        </button>
      </div>
    </div>
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
        <Link href="/coach" className="font-semibold text-pine">
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
      <Button type="submit" disabled={pending} className="w-full" variant="ember">
        {pending ? it.common.saving : it.auth.submitAthlete}
      </Button>
      <p className="text-sm text-muted">
        {it.auth.hasAccount}{" "}
        <Link href="/atleta" className="font-semibold text-ember">
          {it.auth.goSignIn}
        </Link>
      </p>
    </form>
  );
}
