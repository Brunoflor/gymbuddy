import type { Metadata } from "next";
import Link from "next/link";
import { Panel } from "@/components/ui";
import { it } from "@/lib/i18n/it";
import { getDiet, getWorkout } from "@/lib/queries";
import { requireApprovedAthlete } from "@/lib/session";

export const metadata: Metadata = { title: "Oggi" };

export default async function AthleteHomePage() {
  const account = await requireApprovedAthlete();
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
          <Link href="/atleta/dieta" className="mt-3 inline-block text-sm font-semibold text-pine">
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
          <Link href="/atleta/allenamento" className="mt-3 inline-block text-sm font-semibold text-pine">
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
