import type { Metadata } from "next";
import { MeasurementChart } from "@/components/measurement-chart";
import { Panel } from "@/components/ui";
import { formatDate, formatNumber } from "@/lib/format";
import { it } from "@/lib/i18n/it";
import { getCharacteristics, listMeasurements } from "@/lib/queries";
import { requireApprovedAthlete } from "@/lib/session";

export const metadata: Metadata = { title: "Progressi" };

const sexLabel = {
  female: it.characteristics.female,
  male: it.characteristics.male,
  other: it.characteristics.other,
  unspecified: it.characteristics.unspecified,
} as const;

export default async function AthleteProgressPage() {
  const account = await requireApprovedAthlete();
  const [characteristics, measurements] = await Promise.all([
    getCharacteristics(account.userId),
    listMeasurements(account.userId),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="font-display text-4xl">{it.nav.progress}</h1>
      <Panel>
        <h2 className="font-display text-2xl">{it.characteristics.title}</h2>
        {characteristics ? (
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-muted">{it.characteristics.sex}</dt>
              <dd className="font-semibold">{sexLabel[characteristics.sex]}</dd>
            </div>
            <div>
              <dt className="text-muted">{it.characteristics.height}</dt>
              <dd className="font-semibold">
                {characteristics.heightCm === null ? "—" : `${formatNumber(characteristics.heightCm)} cm`}
              </dd>
            </div>
            <div>
              <dt className="text-muted">{it.characteristics.birthDate}</dt>
              <dd className="font-semibold">
                {characteristics.birthDate ? formatDate(characteristics.birthDate) : "—"}
              </dd>
            </div>
            {characteristics.notes ? (
              <div className="col-span-2">
                <dt className="text-muted">{it.characteristics.notes}</dt>
                <dd>{characteristics.notes}</dd>
              </div>
            ) : null}
          </dl>
        ) : (
          <p className="mt-2 text-sm text-muted">{it.characteristics.empty}</p>
        )}
      </Panel>
      <Panel>
        {measurements.length === 0 ? (
          <p className="text-sm text-muted">{it.measurements.athleteEmpty}</p>
        ) : (
          <MeasurementChart measurements={measurements} />
        )}
      </Panel>
      {[...measurements].reverse().map((measurement) => (
        <Panel key={measurement.id}>
          <p className="font-semibold">{formatDate(measurement.recordedOn)}</p>
          <p className="mt-1 text-sm text-muted">
            {[
              measurement.weightKg !== null ? `${formatNumber(measurement.weightKg)} kg` : null,
              measurement.bodyFatPct !== null ? `${formatNumber(measurement.bodyFatPct)}%` : null,
              measurement.waistCm !== null ? `vita ${formatNumber(measurement.waistCm)}` : null,
              measurement.chestCm !== null ? `petto ${formatNumber(measurement.chestCm)}` : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {measurement.notes ? <p className="mt-1 text-sm">{measurement.notes}</p> : null}
          {measurement.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={measurement.photoUrl}
              alt={`${it.measurements.photoAlt} ${formatDate(measurement.recordedOn)}`}
              className="mt-3 max-h-72 w-full rounded-2xl object-cover"
            />
          ) : null}
        </Panel>
      ))}
    </div>
  );
}
