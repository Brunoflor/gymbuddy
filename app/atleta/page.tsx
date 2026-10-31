import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth-forms";
import { AthleteNav, Frame, TopBar } from "@/components/shell";
import { Panel, WrongDoorNotice } from "@/components/ui";
import { pathAfterEntry } from "@/lib/domain";
import { demoHintsEnabled } from "@/lib/env";
import { it } from "@/lib/i18n/it";
import { getDiet, getWorkout } from "@/lib/queries";
import { getAccount, type Account } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const account = await getAccount();
  if (account?.role === "athlete" && account.status === "approved") return { title: "Oggi" };
  return { title: it.landing.athleteEntry };
}

export default async function AthleteEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ ingresso?: string }>;
}) {
  const account = await getAccount();
  const query = await searchParams;
  if (!account) return <AthleteLogin />;
  if (account.role !== "athlete" || account.status !== "approved") {
    redirect(pathAfterEntry("athlete", account));
  }

  return (
    <>
      <Frame bottomNav>
        <TopBar name={account.fullName} href="/atleta" returnTo="/atleta" />
        <WrongDoorNotice ingresso={query.ingresso} />
        <AthleteToday account={account} />
      </Frame>
      <AthleteNav />
    </>
  );
}

function AthleteLogin() {
  return (
    <Frame>
      <TopBar name="" href="/" showSignOut={false} />
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">{it.landing.athleteEntry}</p>
      <h1 className="mt-3 font-display text-4xl leading-tight tracking-tight">{it.auth.athleteDoorTitle}</h1>
      <p className="mt-2 mb-5 text-sm leading-6 text-muted">{it.auth.athleteDoorLead}</p>
      <Panel className="border-ember/30">
        <LoginForm door="athlete" showDemo={demoHintsEnabled()} />
      </Panel>
    </Frame>
  );
}

async function AthleteToday({ account }: { account: Account }) {
  const [diet, workout] = await Promise.all([getDiet(account.userId), getWorkout(account.userId)]);

  return (
    <div>
      <h1 className="font-display text-4xl leading-tight">
        {it.athlete.hello}, {account.fullName.split(" ")[0]}
      </h1>
      <p className="mt-2 text-sm leading-6 text-muted">{it.athlete.todayLead}</p>
      <div className="mt-5 space-y-3">
        <Panel>
          <h2 className="font-display text-2xl">{it.nav.diet}</h2>
          {diet.current ? (
            <>
              <p className="mt-1 font-semibold">{diet.current.title}</p>
              <p className="mt-2 text-sm text-muted">
                {it.athlete.meals}: {diet.current.content.meals.map((meal) => meal.name).join(", ")}
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted">{it.diet.athleteEmpty}</p>
          )}
          <Link href="/atleta/dieta" className="mt-3 inline-block text-sm font-semibold text-ember">
            {it.athlete.openDiet}
          </Link>
        </Panel>
        <Panel>
          <h2 className="font-display text-2xl">{it.nav.workout}</h2>
          {workout.current ? (
            <>
              <p className="mt-1 font-semibold">{workout.current.title}</p>
              <p className="mt-2 text-sm text-muted">
                {it.athlete.days}: {workout.current.content.days.map((day) => day.name).join(", ")}
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted">{it.workout.athleteEmpty}</p>
          )}
          <Link href="/atleta/allenamento" className="mt-3 inline-block text-sm font-semibold text-ember">
            {it.athlete.openWorkout}
          </Link>
        </Panel>
        <Link href="/atleta/progressi" className="inline-block text-sm font-semibold text-ember">
          {it.athlete.openProgress}
        </Link>
      </div>
    </div>
  );
}
