import { deleteMeasurement } from "@/lib/actions";
import { MeasurementForm } from "@/components/body-forms";
import { MeasurementChart } from "@/components/measurement-chart";
import { Button, Panel } from "@/components/ui";
import { formatDate, formatNumber, todayIso } from "@/lib/format";
import { it } from "@/lib/i18n/it";
import { listMeasurements } from "@/lib/queries";

export default async function CoachMeasurementsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const measurements = await listMeasurements(id);

  return (
    <div className="space-y-4">
      <Panel>
        <h2 className="mb-2 font-display text-2xl">{it.measurements.title}</h2>
        <p className="mb-4 text-sm text-muted">{it.measurements.lead}</p>
        <MeasurementChart measurements={measurements} />
      </Panel>
      <Panel>
        <MeasurementForm athleteId={id} today={todayIso()} />
      </Panel>
      <div className="space-y-3">
        {[...measurements].reverse().map((measurement) => (
          <Panel key={measurement.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{formatDate(measurement.recordedOn)}</p>
                <p className="mt-1 text-sm text-muted">
                  {[
                    measurement.weightKg !== null ? `${formatNumber(measurement.weightKg)} kg` : null,
                    measurement.bodyFatPct !== null ? `${formatNumber(measurement.bodyFatPct)}%` : null,
                    measurement.waistCm !== null ? `vita ${formatNumber(measurement.waistCm)} cm` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </p>
                {measurement.notes ? <p className="mt-1 text-sm">{measurement.notes}</p> : null}
              </div>
              <form action={deleteMeasurement}>
                <input type="hidden" name="athleteId" value={id} />
                <input type="hidden" name="measurementId" value={measurement.id} />
                <Button type="submit" variant="ghost">
                  {it.measurements.delete}
                </Button>
              </form>
            </div>
            {measurement.photoUrl ? (
              // Signed URLs expire and are not worth running through the image optimizer.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={measurement.photoUrl}
                alt={`${it.measurements.photoAlt} ${formatDate(measurement.recordedOn)}`}
                className="mt-3 max-h-72 w-full rounded-2xl object-cover"
              />
            ) : null}
          </Panel>
        ))}
        {measurements.length === 0 ? <p className="text-sm text-muted">{it.measurements.noHistory}</p> : null}
      </div>
    </div>
  );
}
