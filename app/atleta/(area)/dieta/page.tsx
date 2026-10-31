import type { Metadata } from "next";
import { Panel } from "@/components/ui";
import { it } from "@/lib/i18n/it";
import { getDiet } from "@/lib/queries";
import { requireApprovedAthlete } from "@/lib/session";

export const metadata: Metadata = { title: "Dieta" };

export default async function AthleteDietPage() {
  const account = await requireApprovedAthlete();
  const diet = await getDiet(account.userId);

  if (!diet.current) {
    return <p className="text-sm text-muted">{it.diet.athleteEmpty}</p>;
  }

  return (
    <div className="space-y-3">
      <h1 className="font-display text-4xl">{diet.current.title}</h1>
      {diet.current.notes ? <p className="text-sm leading-6 text-muted">{diet.current.notes}</p> : null}
      {diet.current.content.meals.map((meal) => (
        <Panel key={`${meal.name}-${meal.time}`}>
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-2xl">{meal.name}</h2>
            {meal.time ? <span className="text-sm text-muted">{meal.time}</span> : null}
          </div>
          <ul className="mt-3 space-y-2">
            {meal.items.map((item) => (
              <li key={`${item.food}-${item.quantity}`} className="flex items-baseline justify-between gap-3 text-sm">
                <span>{item.food}</span>
                <span className="shrink-0 font-semibold">{item.quantity}</span>
              </li>
            ))}
          </ul>
        </Panel>
      ))}
    </div>
  );
}
