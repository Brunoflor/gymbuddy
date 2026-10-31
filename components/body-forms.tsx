"use client";

import { useActionState } from "react";
import { saveCharacteristics, saveMeasurement } from "@/lib/actions";
import type { Sex } from "@/lib/domain";
import { it } from "@/lib/i18n/it";
import { Button, Notice } from "@/components/ui";

const inputClass = "w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm";

export function CharacteristicsForm({
  athleteId,
  fullName,
  sex,
  birthDate,
  heightCm,
  notes,
}: {
  athleteId: string;
  fullName: string;
  sex: Sex;
  birthDate: string;
  heightCm: string;
  notes: string;
}) {
  const [state, action, pending] = useActionState(saveCharacteristics, null);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="athleteId" value={athleteId} />
      <label className="block text-sm font-medium">
        {it.auth.fullName}
        <input className={`${inputClass} mt-1.5`} name="fullName" defaultValue={fullName} required />
      </label>
      <label className="block text-sm font-medium">
        {it.characteristics.sex}
        <select className={`${inputClass} mt-1.5`} name="sex" defaultValue={sex}>
          <option value="female">{it.characteristics.female}</option>
          <option value="male">{it.characteristics.male}</option>
          <option value="other">{it.characteristics.other}</option>
          <option value="unspecified">{it.characteristics.unspecified}</option>
        </select>
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          {it.characteristics.birthDate}
          <input className={`${inputClass} mt-1.5`} type="date" name="birthDate" defaultValue={birthDate} />
        </label>
        <label className="block text-sm font-medium">
          {it.characteristics.height}
          <input className={`${inputClass} mt-1.5`} name="heightCm" inputMode="decimal" defaultValue={heightCm} />
        </label>
      </div>
      <label className="block text-sm font-medium">
        {it.characteristics.notes}
        <textarea className={`${inputClass} mt-1.5 min-h-24`} name="notes" defaultValue={notes} />
      </label>
      {state?.message ? <Notice tone={state.ok ? "ok" : "bad"}>{state.message}</Notice> : null}
      <Button type="submit" disabled={pending}>
        {pending ? it.common.saving : it.characteristics.save}
      </Button>
    </form>
  );
}

export function MeasurementForm({ athleteId, today }: { athleteId: string; today: string }) {
  const [state, action, pending] = useActionState(saveMeasurement, null);
  const fields = [
    ["weightKg", it.measurements.weight],
    ["bodyFatPct", it.measurements.bodyFat],
    ["chestCm", it.measurements.chest],
    ["waistCm", it.measurements.waist],
    ["hipsCm", it.measurements.hips],
    ["armCm", it.measurements.arm],
    ["thighCm", it.measurements.thigh],
  ] as const;

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="athleteId" value={athleteId} />
      <label className="block text-sm font-medium">
        {it.measurements.date}
        <input className={`${inputClass} mt-1.5`} type="date" name="recordedOn" defaultValue={today} required />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map(([name, label]) => (
          <label key={name} className="block text-sm font-medium">
            {label}
            <input className={`${inputClass} mt-1.5`} name={name} inputMode="decimal" />
          </label>
        ))}
      </div>
      <label className="block text-sm font-medium">
        {it.measurements.notes}
        <textarea className={`${inputClass} mt-1.5`} name="notes" />
      </label>
      <label className="block text-sm font-medium">
        {it.measurements.photo}
        <input className={`${inputClass} mt-1.5`} type="file" name="photo" accept="image/jpeg,image/png,image/webp" />
      </label>
      {state?.message ? <Notice tone={state.ok ? "ok" : "bad"}>{state.message}</Notice> : null}
      <Button type="submit" disabled={pending}>
        {pending ? it.common.saving : it.measurements.save}
      </Button>
    </form>
  );
}
