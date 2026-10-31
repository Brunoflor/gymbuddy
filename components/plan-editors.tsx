"use client";

import { useActionState, useState } from "react";
import { saveDiet, saveWorkout } from "@/lib/actions";
import {
  emptyDiet,
  emptyWorkout,
  type DietContent,
  type DietMeal,
  type WorkoutContent,
  type WorkoutDay,
} from "@/lib/domain";
import { it } from "@/lib/i18n/it";
import { Button, Notice } from "@/components/ui";

const inputClass = "w-full rounded-xl border border-line bg-white px-3 py-2 text-sm";

export function DietEditor({
  athleteId,
  title,
  notes,
  content,
}: {
  athleteId: string;
  title: string;
  notes: string;
  content: DietContent | null;
}) {
  const [state, action, pending] = useActionState(saveDiet, null);
  const [planTitle, setPlanTitle] = useState(title);
  const [planNotes, setPlanNotes] = useState(notes);
  const [meals, setMeals] = useState<DietContent>(content ?? emptyDiet());

  function updateMeal(index: number, meal: DietMeal) {
    setMeals({ meals: meals.meals.map((item, itemIndex) => (itemIndex === index ? meal : item)) });
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="athleteId" value={athleteId} />
      <input type="hidden" name="title" value={planTitle} />
      <input type="hidden" name="notes" value={planNotes} />
      <input type="hidden" name="content" value={JSON.stringify(meals)} />
      <label className="block text-sm font-medium">
        {it.diet.planTitle}
        <input className={`${inputClass} mt-1.5`} value={planTitle} onChange={(event) => setPlanTitle(event.target.value)} required />
      </label>
      <label className="block text-sm font-medium">
        {it.diet.notes}
        <textarea className={`${inputClass} mt-1.5 min-h-20`} value={planNotes} onChange={(event) => setPlanNotes(event.target.value)} />
      </label>
      {meals.meals.map((meal, mealIndex) => (
        <fieldset key={mealIndex} className="space-y-3 rounded-3xl border border-line bg-sand/60 p-3">
          <legend className="px-1 text-sm font-semibold">{it.diet.meal}</legend>
          <div className="grid gap-2 sm:grid-cols-[1fr_8rem]">
            <input
              className={inputClass}
              aria-label={it.diet.meal}
              value={meal.name}
              onChange={(event) => updateMeal(mealIndex, { ...meal, name: event.target.value })}
            />
            <input
              className={inputClass}
              aria-label={it.diet.time}
              value={meal.time}
              onChange={(event) => updateMeal(mealIndex, { ...meal, time: event.target.value })}
            />
          </div>
          {meal.items.map((item, itemIndex) => (
            <div key={itemIndex} className="grid gap-2 sm:grid-cols-[1fr_7rem_auto]">
              <input
                className={inputClass}
                aria-label={it.diet.food}
                placeholder={it.diet.food}
                value={item.food}
                onChange={(event) => {
                  const items = meal.items.map((entry, index) =>
                    index === itemIndex ? { ...entry, food: event.target.value } : entry,
                  );
                  updateMeal(mealIndex, { ...meal, items });
                }}
              />
              <input
                className={inputClass}
                aria-label={it.diet.quantity}
                placeholder={it.diet.quantity}
                value={item.quantity}
                onChange={(event) => {
                  const items = meal.items.map((entry, index) =>
                    index === itemIndex ? { ...entry, quantity: event.target.value } : entry,
                  );
                  updateMeal(mealIndex, { ...meal, items });
                }}
              />
              <button
                type="button"
                className="rounded-xl px-3 py-2 text-sm text-danger"
                onClick={() =>
                  updateMeal(mealIndex, { ...meal, items: meal.items.filter((_, index) => index !== itemIndex) })
                }
                disabled={meal.items.length === 1}
              >
                {it.diet.removeItem}
              </button>
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-full bg-white px-3 py-2 text-sm font-semibold"
              onClick={() =>
                updateMeal(mealIndex, { ...meal, items: [...meal.items, { food: "", quantity: "", notes: "" }] })
              }
            >
              {it.diet.addItem}
            </button>
            <button
              type="button"
              className="rounded-full px-3 py-2 text-sm text-danger"
              onClick={() => setMeals({ meals: meals.meals.filter((_, index) => index !== mealIndex) })}
              disabled={meals.meals.length === 1}
            >
              {it.diet.removeMeal}
            </button>
          </div>
        </fieldset>
      ))}
      <button
        type="button"
        className="rounded-full border border-line bg-card px-4 py-2 text-sm font-semibold"
        onClick={() =>
          setMeals({
            meals: [...meals.meals, { name: "Pasto", time: "", items: [{ food: "", quantity: "", notes: "" }] }],
          })
        }
      >
        {it.diet.addMeal}
      </button>
      {state?.message ? <Notice tone={state.ok ? "ok" : "bad"}>{state.message}</Notice> : null}
      <Button type="submit" disabled={pending}>
        {pending ? it.common.saving : it.diet.save}
      </Button>
    </form>
  );
}

export function WorkoutEditor({
  athleteId,
  title,
  notes,
  content,
}: {
  athleteId: string;
  title: string;
  notes: string;
  content: WorkoutContent | null;
}) {
  const [state, action, pending] = useActionState(saveWorkout, null);
  const [planTitle, setPlanTitle] = useState(title);
  const [planNotes, setPlanNotes] = useState(notes);
  const [plan, setPlan] = useState<WorkoutContent>(content ?? emptyWorkout());

  function updateDay(index: number, day: WorkoutDay) {
    setPlan({ days: plan.days.map((item, itemIndex) => (itemIndex === index ? day : item)) });
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="athleteId" value={athleteId} />
      <input type="hidden" name="title" value={planTitle} />
      <input type="hidden" name="notes" value={planNotes} />
      <input type="hidden" name="content" value={JSON.stringify(plan)} />
      <label className="block text-sm font-medium">
        {it.workout.planTitle}
        <input className={`${inputClass} mt-1.5`} value={planTitle} onChange={(event) => setPlanTitle(event.target.value)} required />
      </label>
      <label className="block text-sm font-medium">
        {it.workout.notes}
        <textarea className={`${inputClass} mt-1.5 min-h-20`} value={planNotes} onChange={(event) => setPlanNotes(event.target.value)} />
      </label>
      {plan.days.map((day, dayIndex) => (
        <fieldset key={dayIndex} className="space-y-3 rounded-3xl border border-line bg-sand/60 p-3">
          <legend className="px-1 text-sm font-semibold">{it.workout.day}</legend>
          <input
            className={inputClass}
            aria-label={it.workout.day}
            value={day.name}
            onChange={(event) => updateDay(dayIndex, { ...day, name: event.target.value })}
          />
          <textarea
            className={inputClass}
            aria-label={it.workout.dayNotes}
            placeholder={it.workout.dayNotes}
            value={day.notes}
            onChange={(event) => updateDay(dayIndex, { ...day, notes: event.target.value })}
          />
          {day.exercises.map((exercise, exerciseIndex) => (
            <div key={exerciseIndex} className="space-y-2 rounded-2xl bg-card p-3">
              <input
                className={inputClass}
                aria-label={it.workout.exercise}
                placeholder={it.workout.exercise}
                value={exercise.name}
                onChange={(event) => {
                  const exercises = day.exercises.map((entry, index) =>
                    index === exerciseIndex ? { ...entry, name: event.target.value } : entry,
                  );
                  updateDay(dayIndex, { ...day, exercises });
                }}
              />
              <div className="grid grid-cols-3 gap-2">
                <label className="text-xs text-muted">
                  {it.workout.sets}
                  <input
                    className={`${inputClass} mt-1`}
                    type="number"
                    min={1}
                    max={20}
                    value={exercise.sets}
                    onChange={(event) => {
                      const exercises = day.exercises.map((entry, index) =>
                        index === exerciseIndex ? { ...entry, sets: Number(event.target.value) } : entry,
                      );
                      updateDay(dayIndex, { ...day, exercises });
                    }}
                  />
                </label>
                <label className="text-xs text-muted">
                  {it.workout.reps}
                  <input
                    className={`${inputClass} mt-1`}
                    value={exercise.reps}
                    onChange={(event) => {
                      const exercises = day.exercises.map((entry, index) =>
                        index === exerciseIndex ? { ...entry, reps: event.target.value } : entry,
                      );
                      updateDay(dayIndex, { ...day, exercises });
                    }}
                  />
                </label>
                <label className="text-xs text-muted">
                  {it.workout.rest}
                  <input
                    className={`${inputClass} mt-1`}
                    type="number"
                    min={0}
                    max={900}
                    value={exercise.rest_seconds}
                    onChange={(event) => {
                      const exercises = day.exercises.map((entry, index) =>
                        index === exerciseIndex ? { ...entry, rest_seconds: Number(event.target.value) } : entry,
                      );
                      updateDay(dayIndex, { ...day, exercises });
                    }}
                  />
                </label>
              </div>
              <button
                type="button"
                className="text-sm text-danger"
                disabled={day.exercises.length === 1}
                onClick={() =>
                  updateDay(dayIndex, {
                    ...day,
                    exercises: day.exercises.filter((_, index) => index !== exerciseIndex),
                  })
                }
              >
                {it.workout.removeExercise}
              </button>
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-full bg-white px-3 py-2 text-sm font-semibold"
              onClick={() =>
                updateDay(dayIndex, {
                  ...day,
                  exercises: [...day.exercises, { name: "", sets: 3, reps: "8-10", rest_seconds: 90, notes: "" }],
                })
              }
            >
              {it.workout.addExercise}
            </button>
            <button
              type="button"
              className="rounded-full px-3 py-2 text-sm text-danger"
              disabled={plan.days.length === 1}
              onClick={() => setPlan({ days: plan.days.filter((_, index) => index !== dayIndex) })}
            >
              {it.workout.removeDay}
            </button>
          </div>
        </fieldset>
      ))}
      <button
        type="button"
        className="rounded-full border border-line bg-card px-4 py-2 text-sm font-semibold"
        onClick={() =>
          setPlan({
            days: [
              ...plan.days,
              { name: "Giorno", notes: "", exercises: [{ name: "", sets: 3, reps: "8-10", rest_seconds: 90, notes: "" }] },
            ],
          })
        }
      >
        {it.workout.addDay}
      </button>
      {state?.message ? <Notice tone={state.ok ? "ok" : "bad"}>{state.message}</Notice> : null}
      <Button type="submit" disabled={pending}>
        {pending ? it.common.saving : it.workout.save}
      </Button>
    </form>
  );
}
