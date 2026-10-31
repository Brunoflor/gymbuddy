import { describe, expect, it } from "vitest";
import {
  destinationForAccount,
  dietContentSchema,
  emptyDiet,
  parseCharacteristics,
  parseMeasurement,
  translateAuthError,
  workoutContentSchema,
} from "@/lib/domain";

const athleteId = "22222222-2222-4222-8222-222222222222";

describe("destinationForAccount", () => {
  it("sends each role and approval state to its own screen", () => {
    expect(destinationForAccount({ role: "coach", status: null })).toBe("/coach");
    expect(destinationForAccount({ role: "athlete", status: "pending" })).toBe("/in-attesa");
    expect(destinationForAccount({ role: "athlete", status: "approved" })).toBe("/atleta");
    expect(destinationForAccount({ role: "athlete", status: "rejected" })).toBe("/non-approvato");
    expect(destinationForAccount({ role: "athlete", status: null })).toBe("/in-attesa");
  });
});

describe("plan schemas", () => {
  it("accepts a diet and a workout that match the database rules", () => {
    expect(
      dietContentSchema.safeParse({
        meals: [{ name: "Pranzo", time: "13:30", items: [{ food: "Riso", quantity: "70 g", notes: "" }] }],
      }).success,
    ).toBe(true);

    expect(
      workoutContentSchema.safeParse({
        days: [
          {
            name: "Giorno A",
            notes: "",
            exercises: [{ name: "Panca piana", sets: 4, reps: "6-8", rest_seconds: 120, notes: "" }],
          },
        ],
      }).success,
    ).toBe(true);
  });

  it("rejects an empty diet and an impossible set count", () => {
    expect(dietContentSchema.safeParse({ meals: [] }).success).toBe(false);
    expect(dietContentSchema.safeParse(emptyDiet()).success).toBe(false);
    expect(
      workoutContentSchema.safeParse({
        days: [{ name: "A", exercises: [{ name: "Squat", sets: 0, reps: "8", rest_seconds: 60 }] }],
      }).success,
    ).toBe(false);
  });
});

describe("parseMeasurement", () => {
  it("requires a date and at least one value", () => {
    expect(
      parseMeasurement({
        athleteId,
        recordedOn: "2026-10-28",
        weightKg: "",
        bodyFatPct: "",
        chestCm: "",
        waistCm: "",
        hipsCm: "",
        armCm: "",
        thighCm: "",
        notes: "",
      }).ok,
    ).toBe(false);
  });

  it("accepts Italian decimal commas inside the allowed range", () => {
    const parsed = parseMeasurement({
      athleteId,
      recordedOn: "2026-10-28",
      weightKg: "66,1",
      bodyFatPct: "",
      chestCm: "",
      waistCm: "73.5",
      hipsCm: "",
      armCm: "",
      thighCm: "",
      notes: "ok",
    });
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.data.weightKg).toBe(66.1);
      expect(parsed.data.waistCm).toBe(73.5);
    }
  });
});

describe("parseCharacteristics", () => {
  it("rejects a future birth date and keeps a valid height", () => {
    expect(
      parseCharacteristics({
        athleteId,
        fullName: "Giulia Ferrara",
        sex: "female",
        birthDate: "2099-01-01",
        heightCm: "168",
        notes: "",
      }).ok,
    ).toBe(false);

    const parsed = parseCharacteristics({
      athleteId,
      fullName: "Giulia Ferrara",
      sex: "female",
      birthDate: "1996-04-12",
      heightCm: "168",
      notes: "Sera",
    });
    expect(parsed.ok).toBe(true);
  });
});

describe("translateAuthError", () => {
  it("maps database and auth failures to Italian", () => {
    expect(translateAuthError("Codice invito non valido")).toMatch(/invito/i);
    expect(translateAuthError("Invalid login credentials")).toMatch(/password/i);
    expect(translateAuthError("something unexpected")).toMatch(/riprova/i);
  });
});
