import type { Metadata } from "next";
import { Panel } from "@/components/ui";
import { it } from "@/lib/i18n/it";
import { getWorkout } from "@/lib/queries";
import { requireApprovedAthlete } from "@/lib/session";

export const metadata: Metadata = { title: "Scheda" };

export default async function AthleteWorkoutPage() {
  const account = await requireApprovedAthlete();
  const workout = await getWorkout(account.userId);

  if (!workout.current) {
    return <p className="text-sm text-muted">{it.workout.athleteEmpty}</p>;
  }

  return (
    <div className="space-y-3">
      <h1 className="font-display text-4xl">{workout.current.title}</h1>
      {workout.current.notes ? <p className="text-sm leading-6 text-muted">{workout.current.notes}</p> : null}
      {workout.current.content.days.map((day) => (
        <Panel key={day.name}>
          <h2 className="font-display text-2xl">{day.name}</h2>
          {day.notes ? <p className="mt-1 text-sm text-muted">{day.notes}</p> : null}
          <ul className="mt-3 space-y-3">
            {day.exercises.map((exercise) => (
              <li key={`${day.name}-${exercise.name}`} className="border-t border-line pt-3 first:border-t-0 first:pt-0">
                <p className="font-semibold">{exercise.name}</p>
                <p className="text-sm text-muted">
                  {exercise.sets} × {exercise.reps} · {exercise.rest_seconds}
                  {it.workout.restUnit}
                </p>
                {exercise.notes ? <p className="text-sm">{exercise.notes}</p> : null}
              </li>
            ))}
          </ul>
        </Panel>
      ))}
    </div>
  );
}
