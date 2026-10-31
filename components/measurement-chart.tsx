"use client";

import { useState } from "react";
import { formatDate, formatNumber } from "@/lib/format";
import { it } from "@/lib/i18n/it";

export type ChartMeasurement = {
  id: string;
  recordedOn: string;
  weightKg: number | null;
  bodyFatPct: number | null;
  chestCm: number | null;
  waistCm: number | null;
  hipsCm: number | null;
  armCm: number | null;
  thighCm: number | null;
  notes: string;
  photoUrl: string | null;
};

const metrics = [
  { key: "weightKg", label: it.measurements.weight, unit: "kg" },
  { key: "bodyFatPct", label: it.measurements.bodyFat, unit: "%" },
  { key: "chestCm", label: it.measurements.chest, unit: "cm" },
  { key: "waistCm", label: it.measurements.waist, unit: "cm" },
  { key: "hipsCm", label: it.measurements.hips, unit: "cm" },
  { key: "armCm", label: it.measurements.arm, unit: "cm" },
  { key: "thighCm", label: it.measurements.thigh, unit: "cm" },
] as const;

type MetricKey = (typeof metrics)[number]["key"];

export function MeasurementChart({ measurements }: { measurements: ChartMeasurement[] }) {
  const [metric, setMetric] = useState<MetricKey>("weightKg");
  const selected = metrics.find((item) => item.key === metric) ?? metrics[0];
  const points = measurements.flatMap((measurement) => {
    const value = measurement[selected.key];
    return value === null ? [] : [{ date: measurement.recordedOn, value }];
  });

  return (
    <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {metrics.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setMetric(item.key)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
              item.key === metric ? "bg-pine text-white" : "bg-sand text-ink"
            }`}
            aria-pressed={item.key === metric}
          >
            {item.label.replace(/ \(.+\)$/, "")}
          </button>
        ))}
      </div>
      <Chart points={points} unit={selected.unit} label={selected.label} />
    </div>
  );
}

function Chart({
  points,
  unit,
  label,
}: {
  points: Array<{ date: string; value: number }>;
  unit: string;
  label: string;
}) {
  if (points.length < 2) {
    return <p className="text-sm text-muted">{it.measurements.chartEmpty}</p>;
  }

  const width = 360;
  const height = 200;
  const pad = { left: 42, right: 12, top: 16, bottom: 28 };
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const plotWidth = width - pad.left - pad.right;
  const plotHeight = height - pad.top - pad.bottom;

  const coords = points.map((point, index) => {
    const x = pad.left + (points.length === 1 ? plotWidth / 2 : (index / (points.length - 1)) * plotWidth);
    const y = pad.top + ((max - point.value) / span) * plotHeight;
    return { ...point, x, y };
  });
  const line = coords.map((point) => `${point.x},${point.y}`).join(" ");
  const summary = `${label}: ${formatNumber(points[0].value)} → ${formatNumber(points[points.length - 1].value)} ${unit}`;

  return (
    <figure>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={summary}>
        <line x1={pad.left} y1={pad.top} x2={pad.left} y2={height - pad.bottom} stroke="#e3d8c6" />
        <line
          x1={pad.left}
          y1={height - pad.bottom}
          x2={width - pad.right}
          y2={height - pad.bottom}
          stroke="#e3d8c6"
        />
        <text x={4} y={pad.top + 4} fontSize="11" fill="#6d655c">
          {formatNumber(max)}
        </text>
        <text x={4} y={height - pad.bottom} fontSize="11" fill="#6d655c">
          {formatNumber(min)}
        </text>
        <polyline fill="none" stroke="#1e3a32" strokeWidth="2.5" points={line} />
        {coords.map((point) => (
          <circle key={point.date} cx={point.x} cy={point.y} r="3.5" fill="#c2410c" />
        ))}
      </svg>
      <figcaption className="mt-1 flex justify-between text-xs text-muted">
        <span>{formatDate(points[0].date)}</span>
        <span>
          {formatNumber(points[points.length - 1].value)} {unit}
        </span>
        <span>{formatDate(points[points.length - 1].date)}</span>
      </figcaption>
    </figure>
  );
}
