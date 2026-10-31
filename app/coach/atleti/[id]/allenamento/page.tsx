import { WorkoutEditor } from "@/components/plan-editors";
import { Panel } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { it } from "@/lib/i18n/it";
import { getWorkout } from "@/lib/queries";

export default async function CoachWorkoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const workout = await getWorkout(id);

  return (
    <div className="space-y-4">
      <Panel>
        <h2 className="mb-4 font-display text-2xl">{it.workout.title}</h2>
        <WorkoutEditor
          athleteId={id}
          title={workout.current?.title ?? ""}
          notes={workout.current?.notes ?? ""}
          content={workout.current?.content ?? null}
        />
      </Panel>
      {workout.history.length > 0 ? (
        <Panel>
          <h3 className="font-semibold">{it.workout.history}</h3>
          <ul className="mt-2 space-y-1 text-sm text-muted">
            {workout.history.map((plan) => (
              <li key={plan.id}>
                {plan.title} · {formatDate(plan.updatedAt)}
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
    </div>
  );
}
