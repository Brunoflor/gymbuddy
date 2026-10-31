import { DietEditor } from "@/components/plan-editors";
import { Panel } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { it } from "@/lib/i18n/it";
import { getDiet } from "@/lib/queries";

export default async function CoachDietPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const diet = await getDiet(id);

  return (
    <div className="space-y-4">
      <Panel>
        <h2 className="mb-4 font-display text-2xl">{it.diet.title}</h2>
        <DietEditor
          athleteId={id}
          title={diet.current?.title ?? ""}
          notes={diet.current?.notes ?? ""}
          content={diet.current?.content ?? null}
        />
      </Panel>
      {diet.history.length > 0 ? (
        <Panel>
          <h3 className="font-semibold">{it.diet.history}</h3>
          <ul className="mt-2 space-y-1 text-sm text-muted">
            {diet.history.map((plan) => (
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
