import { z } from "zod";
import { it } from "@/lib/i18n/it";

export const roles = ["coach", "athlete"] as const;
export const membershipStatuses = ["pending", "approved", "rejected"] as const;
export const sexValues = ["female", "male", "other", "unspecified"] as const;

export type Role = (typeof roles)[number];
export type MembershipStatus = (typeof membershipStatuses)[number];
export type Sex = (typeof sexValues)[number];

export type DietItem = { food: string; quantity: string; notes: string };
export type DietMeal = { name: string; time: string; items: DietItem[] };
export type DietContent = { meals: DietMeal[] };

export type WorkoutExercise = {
  name: string;
  sets: number;
  reps: string;
  rest_seconds: number;
  notes: string;
};
export type WorkoutDay = { name: string; notes: string; exercises: WorkoutExercise[] };
export type WorkoutContent = { days: WorkoutDay[] };

export type ActionResult = { ok: boolean; message: string };

const dietItemSchema = z.object({
  food: z.string().trim().min(1).max(80),
  quantity: z.string().trim().min(1).max(40),
  notes: z.string().trim().max(200).optional().default(""),
});

const dietMealSchema = z.object({
  name: z.string().trim().min(1).max(60),
  time: z.string().trim().max(20).optional().default(""),
  items: z.array(dietItemSchema).min(1).max(30),
});

export const dietContentSchema = z.object({
  meals: z.array(dietMealSchema).min(1).max(12),
});

const workoutExerciseSchema = z.object({
  name: z.string().trim().min(1).max(80),
  sets: z.number().int().min(1).max(20),
  reps: z.string().trim().min(1).max(30),
  rest_seconds: z.number().int().min(0).max(900),
  notes: z.string().trim().max(200).optional().default(""),
});

const workoutDaySchema = z.object({
  name: z.string().trim().min(1).max(60),
  notes: z.string().trim().max(500).optional().default(""),
  exercises: z.array(workoutExerciseSchema).min(1).max(20),
});

export const workoutContentSchema = z.object({
  days: z.array(workoutDaySchema).min(1).max(7),
});

export const saveDietSchema = z.object({
  athleteId: z.string().uuid(),
  title: z.string().trim().min(1).max(80),
  notes: z.string().trim().max(2000).optional().default(""),
  content: dietContentSchema,
});

export const saveWorkoutSchema = z.object({
  athleteId: z.string().uuid(),
  title: z.string().trim().min(1).max(80),
  notes: z.string().trim().max(2000).optional().default(""),
  content: workoutContentSchema,
});

export const signInSchema = z.object({
  email: z.string().trim().email().max(160),
  password: z.string().min(8).max(72),
});

export const coachSignUpSchema = signInSchema.extend({
  fullName: z.string().trim().min(1).max(80),
  coachSignupCode: z.string().trim().min(1).max(80),
});

export const athleteSignUpSchema = signInSchema.extend({
  fullName: z.string().trim().min(1).max(80),
  inviteCode: z.string().trim().min(6).max(12),
});

export function emptyDiet(): DietContent {
  return {
    meals: [{ name: "Colazione", time: "08:00", items: [{ food: "", quantity: "", notes: "" }] }],
  };
}

export function emptyWorkout(): WorkoutContent {
  return {
    days: [
      {
        name: "Giorno A",
        notes: "",
        exercises: [{ name: "", sets: 3, reps: "8-10", rest_seconds: 90, notes: "" }],
      },
    ],
  };
}

export type Door = "coach" | "athlete";

export function destinationForAccount(input: {
  role: Role;
  status: MembershipStatus | null;
}): string {
  if (input.role === "coach") return "/coach";
  if (input.status === "approved") return "/atleta";
  if (input.status === "rejected") return "/non-approvato";
  return "/in-attesa";
}

/** Where to send someone after they use a specific door. A mismatch keeps them out of the wrong area and explains the hop. */
export function pathAfterEntry(
  door: Door,
  account: { role: Role; status: MembershipStatus | null },
): string {
  const home = destinationForAccount(account);
  const wrongDoor =
    (door === "coach" && account.role !== "coach") ||
    (door === "athlete" && account.role !== "athlete");
  if (!wrongDoor) return home;
  const joiner = home.includes("?") ? "&" : "?";
  const usedDoor = door === "athlete" ? "atleta" : "coach";
  return `${home}${joiner}ingresso=${usedDoor}`;
}

const privatePrefixes = [
  "/coach/atleti",
  "/atleta/dieta",
  "/atleta/allenamento",
  "/atleta/progressi",
  "/in-attesa",
  "/non-approvato",
];

export function isPrivateAppPath(pathname: string): boolean {
  return privatePrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function entryPathFor(pathname: string): "/coach" | "/atleta" {
  if (pathname === "/coach" || pathname.startsWith("/coach/")) return "/coach";
  return "/atleta";
}

export function translateAuthError(message: string): string {
  const known: Array<[string, string]> = [
    ["Codice invito non valido", it.auth.invalidInvite],
    ["Codice registrazione coach non valido", it.auth.invalidCoachCode],
    ["Nome non valido", it.auth.invalidName],
    ["Invalid login credentials", it.auth.invalidCredentials],
    ["Invalid login", it.auth.invalidCredentials],
    ["User already registered", it.auth.alreadyRegistered],
    ["already been registered", it.auth.alreadyRegistered],
  ];

  for (const [needle, translation] of known) {
    if (message.toLowerCase().includes(needle.toLowerCase())) return translation;
  }

  return it.auth.genericError;
}

export type CharacteristicsInput = {
  athleteId: string;
  fullName: string;
  sex: Sex;
  birthDate: string | null;
  heightCm: number | null;
  notes: string;
};

export function parseCharacteristics(input: {
  athleteId: string;
  fullName: string;
  sex: string;
  birthDate: string;
  heightCm: string;
  notes: string;
}): { ok: true; data: CharacteristicsInput } | { ok: false; message: string } {
  if (!z.string().uuid().safeParse(input.athleteId).success) {
    return { ok: false, message: it.auth.invalidForm };
  }

  const fullName = input.fullName.trim();
  if (fullName.length < 1 || fullName.length > 80) {
    return { ok: false, message: it.auth.invalidName };
  }

  if (!sexValues.includes(input.sex as Sex)) {
    return { ok: false, message: it.auth.invalidForm };
  }

  const birthDate = input.birthDate.trim();
  if (birthDate !== "" && !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    return { ok: false, message: it.auth.invalidForm };
  }
  if (birthDate !== "") {
    const date = new Date(`${birthDate}T12:00:00`);
    const today = new Date();
    if (Number.isNaN(date.getTime()) || date > today || date.getFullYear() < 1920) {
      return { ok: false, message: it.auth.invalidForm };
    }
  }

  const heightRaw = input.heightCm.trim().replace(",", ".");
  let heightCm: number | null = null;
  if (heightRaw !== "") {
    heightCm = Number(heightRaw);
    if (!Number.isFinite(heightCm) || heightCm < 100 || heightCm > 230) {
      return { ok: false, message: it.auth.invalidForm };
    }
  }

  const notes = input.notes.trim();
  if (notes.length > 2000) return { ok: false, message: it.auth.invalidForm };

  return {
    ok: true,
    data: {
      athleteId: input.athleteId,
      fullName,
      sex: input.sex as Sex,
      birthDate: birthDate === "" ? null : birthDate,
      heightCm,
      notes,
    },
  };
}

export type MeasurementInput = {
  athleteId: string;
  recordedOn: string;
  weightKg: number | null;
  bodyFatPct: number | null;
  chestCm: number | null;
  waistCm: number | null;
  hipsCm: number | null;
  armCm: number | null;
  thighCm: number | null;
  notes: string;
};

const measurementRanges = {
  weightKg: [30, 300],
  bodyFatPct: [2, 70],
  chestCm: [40, 200],
  waistCm: [40, 200],
  hipsCm: [40, 200],
  armCm: [15, 80],
  thighCm: [20, 120],
} as const;

function parseOptionalNumber(
  raw: string,
  min: number,
  max: number,
): { ok: true; value: number | null } | { ok: false } {
  const trimmed = raw.trim().replace(",", ".");
  if (trimmed === "") return { ok: true, value: null };
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < min || value > max) return { ok: false };
  return { ok: true, value };
}

export function parseMeasurement(input: {
  athleteId: string;
  recordedOn: string;
  weightKg: string;
  bodyFatPct: string;
  chestCm: string;
  waistCm: string;
  hipsCm: string;
  armCm: string;
  thighCm: string;
  notes: string;
}): { ok: true; data: MeasurementInput } | { ok: false; message: string } {
  if (!z.string().uuid().safeParse(input.athleteId).success) {
    return { ok: false, message: it.measurements.invalid };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.recordedOn)) {
    return { ok: false, message: it.measurements.invalid };
  }

  const numbers = {
    weightKg: parseOptionalNumber(input.weightKg, ...measurementRanges.weightKg),
    bodyFatPct: parseOptionalNumber(input.bodyFatPct, ...measurementRanges.bodyFatPct),
    chestCm: parseOptionalNumber(input.chestCm, ...measurementRanges.chestCm),
    waistCm: parseOptionalNumber(input.waistCm, ...measurementRanges.waistCm),
    hipsCm: parseOptionalNumber(input.hipsCm, ...measurementRanges.hipsCm),
    armCm: parseOptionalNumber(input.armCm, ...measurementRanges.armCm),
    thighCm: parseOptionalNumber(input.thighCm, ...measurementRanges.thighCm),
  };

  if (Object.values(numbers).some((entry) => !entry.ok)) {
    return { ok: false, message: it.measurements.invalid };
  }

  const parsed = {
    weightKg: numbers.weightKg.ok ? numbers.weightKg.value : null,
    bodyFatPct: numbers.bodyFatPct.ok ? numbers.bodyFatPct.value : null,
    chestCm: numbers.chestCm.ok ? numbers.chestCm.value : null,
    waistCm: numbers.waistCm.ok ? numbers.waistCm.value : null,
    hipsCm: numbers.hipsCm.ok ? numbers.hipsCm.value : null,
    armCm: numbers.armCm.ok ? numbers.armCm.value : null,
    thighCm: numbers.thighCm.ok ? numbers.thighCm.value : null,
  };

  const notes = input.notes.trim();
  if (notes.length > 500) return { ok: false, message: it.measurements.invalid };
  if (Object.values(parsed).every((value) => value === null)) {
    return { ok: false, message: it.measurements.invalid };
  }

  return {
    ok: true,
    data: {
      athleteId: input.athleteId,
      recordedOn: input.recordedOn,
      notes,
      ...parsed,
    },
  };
}

export function asDietContent(value: unknown): DietContent {
  const parsed = dietContentSchema.safeParse(value);
  return parsed.success ? parsed.data : emptyDiet();
}

export function asWorkoutContent(value: unknown): WorkoutContent {
  const parsed = workoutContentSchema.safeParse(value);
  return parsed.success ? parsed.data : emptyWorkout();
}
