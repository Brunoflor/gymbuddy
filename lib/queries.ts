import "server-only";
import {
  asDietContent,
  asWorkoutContent,
  type DietContent,
  type MembershipStatus,
  type Sex,
  type WorkoutContent,
} from "@/lib/domain";
import { createClient } from "@/lib/supabase/server";

export type RosterEntry = {
  membershipId: string;
  status: MembershipStatus;
  createdAt: string;
  athleteId: string;
  fullName: string;
  email: string;
};

export type AthleteSummary = {
  athleteId: string;
  fullName: string;
  email: string;
  status: MembershipStatus;
};

export type Characteristics = {
  sex: Sex;
  birthDate: string | null;
  heightCm: number | null;
  notes: string;
};

export type PlanSummary = {
  id: string;
  title: string;
  notes: string;
  isCurrent: boolean;
  updatedAt: string;
};

export type DietPlan = PlanSummary & { content: DietContent };
export type WorkoutPlan = PlanSummary & { content: WorkoutContent };

export type Measurement = {
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

function asNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : null;
}

function asStatus(value: unknown): MembershipStatus | null {
  if (value === "pending" || value === "approved" || value === "rejected") return value;
  return null;
}

export async function listRoster(): Promise<RosterEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("memberships")
    .select("id, status, created_at, athlete_id, profiles!memberships_athlete_id_fkey(full_name, email)")
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.flatMap((row) => {
    const status = asStatus(row.status);
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    if (!status || !profile) return [];
    return [
      {
        membershipId: row.id,
        status,
        createdAt: row.created_at,
        athleteId: row.athlete_id,
        fullName: profile.full_name,
        email: profile.email,
      },
    ];
  });
}

export async function getAthleteSummary(athleteId: string): Promise<AthleteSummary | null> {
  const supabase = await createClient();
  const { data: membership } = await supabase
    .from("memberships")
    .select("status, athlete_id")
    .eq("athlete_id", athleteId)
    .maybeSingle();

  const status = asStatus(membership?.status);
  if (!membership || !status) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", athleteId)
    .maybeSingle();

  if (!profile) return null;

  return {
    athleteId,
    fullName: profile.full_name,
    email: profile.email,
    status,
  };
}

export async function getCoachName(coachId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("full_name").eq("id", coachId).maybeSingle();
  return data?.full_name ?? null;
}

export async function getCharacteristics(athleteId: string): Promise<Characteristics | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("athlete_profiles")
    .select("sex, birth_date, height_cm, notes")
    .eq("athlete_id", athleteId)
    .maybeSingle();

  if (!data) return null;
  const sex: Sex =
    data.sex === "female" || data.sex === "male" || data.sex === "other" || data.sex === "unspecified"
      ? data.sex
      : "unspecified";

  return {
    sex,
    birthDate: data.birth_date,
    heightCm: asNumber(data.height_cm),
    notes: data.notes ?? "",
  };
}

async function listPlans(
  table: "diet_plans" | "workout_plans",
  athleteId: string,
): Promise<Array<PlanSummary & { content: unknown }>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from(table)
    .select("id, title, notes, is_current, content, updated_at")
    .eq("athlete_id", athleteId)
    .order("updated_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    title: row.title,
    notes: row.notes ?? "",
    isCurrent: row.is_current,
    updatedAt: row.updated_at,
    content: row.content,
  }));
}

export async function getDiet(athleteId: string): Promise<{ current: DietPlan | null; history: PlanSummary[] }> {
  const plans = await listPlans("diet_plans", athleteId);
  const current = plans.find((plan) => plan.isCurrent) ?? null;
  return {
    current: current ? { ...current, content: asDietContent(current.content) } : null,
    history: plans.filter((plan) => !plan.isCurrent),
  };
}

export async function getWorkout(
  athleteId: string,
): Promise<{ current: WorkoutPlan | null; history: PlanSummary[] }> {
  const plans = await listPlans("workout_plans", athleteId);
  const current = plans.find((plan) => plan.isCurrent) ?? null;
  return {
    current: current ? { ...current, content: asWorkoutContent(current.content) } : null,
    history: plans.filter((plan) => !plan.isCurrent),
  };
}

export async function listMeasurements(athleteId: string): Promise<Measurement[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("measurements")
    .select("id, recorded_on, weight_kg, body_fat_pct, chest_cm, waist_cm, hips_cm, arm_cm, thigh_cm, notes, photo_path")
    .eq("athlete_id", athleteId)
    .order("recorded_on", { ascending: true });

  if (error || !data) return [];

  const measurements = await Promise.all(
    data.map(async (row) => {
      let photoUrl: string | null = null;
      if (row.photo_path) {
        const signed = await supabase.storage.from("athlete-files").createSignedUrl(row.photo_path, 60 * 60);
        photoUrl = signed.data?.signedUrl ?? null;
      }

      return {
        id: row.id,
        recordedOn: row.recorded_on,
        weightKg: asNumber(row.weight_kg),
        bodyFatPct: asNumber(row.body_fat_pct),
        chestCm: asNumber(row.chest_cm),
        waistCm: asNumber(row.waist_cm),
        hipsCm: asNumber(row.hips_cm),
        armCm: asNumber(row.arm_cm),
        thighCm: asNumber(row.thigh_cm),
        notes: row.notes ?? "",
        photoUrl,
      };
    }),
  );

  return measurements;
}

export async function coachNameForCode(code: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("coach_name_for_code", { code });
  if (error || typeof data !== "string" || data.trim() === "") return null;
  return data;
}
