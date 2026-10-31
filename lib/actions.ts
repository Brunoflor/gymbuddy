"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  athleteSignUpSchema,
  coachSignUpSchema,
  membershipStatuses,
  pathAfterEntry,
  parseCharacteristics,
  parseMeasurement,
  saveDietSchema,
  saveWorkoutSchema,
  signInSchema,
  translateAuthError,
  type ActionResult,
  type MembershipStatus,
  type Role,
} from "@/lib/domain";
import { it } from "@/lib/i18n/it";
import { createClient } from "@/lib/supabase/server";

const photoTypes: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function refreshAthlete(athleteId: string) {
  revalidatePath("/coach");
  revalidatePath(`/coach/atleti/${athleteId}`);
  revalidatePath(`/coach/atleti/${athleteId}/dieta`);
  revalidatePath(`/coach/atleti/${athleteId}/allenamento`);
  revalidatePath(`/coach/atleti/${athleteId}/misure`);
  revalidatePath("/atleta");
  revalidatePath("/atleta/dieta");
  revalidatePath("/atleta/allenamento");
  revalidatePath("/atleta/progressi");
}

async function accountDestination(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  const role = profile?.role;
  if (role !== "coach" && role !== "athlete") return null;

  let status: MembershipStatus | null = null;
  if (role === "athlete") {
    const { data: membership } = await supabase
      .from("memberships")
      .select("status")
      .eq("athlete_id", userId)
      .maybeSingle();
    if (
      membership?.status === "pending" ||
      membership?.status === "approved" ||
      membership?.status === "rejected"
    ) {
      status = membership.status;
    } else {
      status = "pending";
    }
  }

  return { role: role as Role, status };
}

export async function signIn(_previous: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { ok: false, message: it.auth.invalidForm };

  const door = formData.get("door") === "coach" ? "coach" : "athlete";
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { ok: false, message: translateAuthError(error.message) };

  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (typeof userId !== "string") return { ok: false, message: it.auth.genericError };

  const account = await accountDestination(supabase, userId);
  if (!account) return { ok: false, message: it.auth.genericError };
  redirect(pathAfterEntry(door, account));
}

export async function signUpCoach(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = coachSignUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    fullName: formData.get("fullName"),
    coachSignupCode: formData.get("coachSignupCode"),
  });
  if (!parsed.success) return { ok: false, message: it.auth.invalidForm };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        role: "coach",
        full_name: parsed.data.fullName,
        coach_signup_code: parsed.data.coachSignupCode,
      },
    },
  });

  if (error) return { ok: false, message: translateAuthError(error.message) };
  if (!data.session) return { ok: true, message: it.auth.confirmEmail };
  redirect("/coach");
}

export async function signUpAthlete(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = athleteSignUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    fullName: formData.get("fullName"),
    inviteCode: formData.get("inviteCode"),
  });
  if (!parsed.success) return { ok: false, message: it.auth.invalidForm };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        role: "athlete",
        full_name: parsed.data.fullName,
        invite_code: parsed.data.inviteCode.toUpperCase(),
      },
    },
  });

  if (error) return { ok: false, message: translateAuthError(error.message) };
  if (!data.session) return { ok: true, message: it.auth.confirmEmail };
  redirect("/in-attesa");
}

export async function signOut(formData: FormData) {
  const returnTo = String(formData.get("returnTo") ?? "");
  const next = returnTo === "/coach" || returnTo === "/atleta" ? returnTo : "/accedi";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(next);
}

export async function setMembershipStatus(formData: FormData) {
  const athleteId = String(formData.get("athleteId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!membershipStatuses.includes(status as MembershipStatus)) redirect("/coach");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("memberships")
    .update({ status })
    .eq("athlete_id", athleteId)
    .select("id");

  refreshAthlete(athleteId);
  if (error || !data || data.length === 0) {
    redirect(`/coach/atleti/${athleteId}?errore=1`);
  }
  redirect(status === "approved" ? `/coach/atleti/${athleteId}?esito=approved` : `/coach?esito=${status}`);
}

export async function saveCharacteristics(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseCharacteristics({
    athleteId: String(formData.get("athleteId") ?? ""),
    fullName: String(formData.get("fullName") ?? ""),
    sex: String(formData.get("sex") ?? ""),
    birthDate: String(formData.get("birthDate") ?? ""),
    heightCm: String(formData.get("heightCm") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  });
  if (!parsed.ok) return parsed;

  const supabase = await createClient();
  const { error: nameError } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.fullName })
    .eq("id", parsed.data.athleteId);
  if (nameError) return { ok: false, message: it.auth.genericError };

  const { error } = await supabase.from("athlete_profiles").upsert(
    {
      athlete_id: parsed.data.athleteId,
      sex: parsed.data.sex,
      birth_date: parsed.data.birthDate,
      height_cm: parsed.data.heightCm,
      notes: parsed.data.notes,
    },
    { onConflict: "athlete_id" },
  );
  if (error) return { ok: false, message: it.auth.genericError };

  refreshAthlete(parsed.data.athleteId);
  return { ok: true, message: it.coach.saved };
}

async function savePlan(
  table: "diet_plans" | "workout_plans",
  athleteId: string,
  title: string,
  notes: string,
  content: unknown,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const coachId = claims?.claims?.sub;
  if (typeof coachId !== "string") return { ok: false, message: it.auth.genericError };

  const { data: existing } = await supabase
    .from(table)
    .select("id")
    .eq("athlete_id", athleteId)
    .eq("is_current", true)
    .maybeSingle();

  const payload = { title, notes, content };
  const { error } = existing
    ? await supabase.from(table).update(payload).eq("id", existing.id)
    : await supabase.from(table).insert({
        ...payload,
        athlete_id: athleteId,
        coach_id: coachId,
        is_current: true,
      });

  if (error) return { ok: false, message: it.auth.genericError };
  refreshAthlete(athleteId);
  return { ok: true, message: table === "diet_plans" ? it.diet.saved : it.workout.saved };
}

export async function saveDiet(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  let content: unknown;
  try {
    content = JSON.parse(String(formData.get("content") ?? ""));
  } catch {
    return { ok: false, message: it.diet.invalid };
  }

  const parsed = saveDietSchema.safeParse({
    athleteId: formData.get("athleteId"),
    title: formData.get("title"),
    notes: formData.get("notes"),
    content,
  });
  if (!parsed.success) return { ok: false, message: it.diet.invalid };

  return savePlan(
    "diet_plans",
    parsed.data.athleteId,
    parsed.data.title,
    parsed.data.notes,
    parsed.data.content,
  );
}

export async function saveWorkout(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  let content: unknown;
  try {
    content = JSON.parse(String(formData.get("content") ?? ""));
  } catch {
    return { ok: false, message: it.workout.invalid };
  }

  const parsed = saveWorkoutSchema.safeParse({
    athleteId: formData.get("athleteId"),
    title: formData.get("title"),
    notes: formData.get("notes"),
    content,
  });
  if (!parsed.success) return { ok: false, message: it.workout.invalid };

  return savePlan(
    "workout_plans",
    parsed.data.athleteId,
    parsed.data.title,
    parsed.data.notes,
    parsed.data.content,
  );
}

export async function saveMeasurement(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseMeasurement({
    athleteId: String(formData.get("athleteId") ?? ""),
    recordedOn: String(formData.get("recordedOn") ?? ""),
    weightKg: String(formData.get("weightKg") ?? ""),
    bodyFatPct: String(formData.get("bodyFatPct") ?? ""),
    chestCm: String(formData.get("chestCm") ?? ""),
    waistCm: String(formData.get("waistCm") ?? ""),
    hipsCm: String(formData.get("hipsCm") ?? ""),
    armCm: String(formData.get("armCm") ?? ""),
    thighCm: String(formData.get("thighCm") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  });
  if (!parsed.ok) return parsed;

  const file = formData.get("photo");
  const hasFile = file instanceof File && file.size > 0;
  if (hasFile && (!(file.type in photoTypes) || file.size > 5 * 1024 * 1024)) {
    return { ok: false, message: it.measurements.invalid };
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const coachId = claims?.claims?.sub;
  if (typeof coachId !== "string") return { ok: false, message: it.auth.genericError };

  const { data: existing } = await supabase
    .from("measurements")
    .select("id, photo_path")
    .eq("athlete_id", parsed.data.athleteId)
    .eq("recorded_on", parsed.data.recordedOn)
    .maybeSingle();

  let photoPath = existing?.photo_path ?? null;
  if (hasFile && file instanceof File) {
    photoPath = `${parsed.data.athleteId}/${parsed.data.recordedOn}-${randomUUID()}.${photoTypes[file.type]}`;
    const { error: uploadError } = await supabase.storage
      .from("athlete-files")
      .upload(photoPath, file, { contentType: file.type, upsert: false });
    if (uploadError) return { ok: false, message: it.auth.genericError };
  }

  const row = {
    athlete_id: parsed.data.athleteId,
    recorded_on: parsed.data.recordedOn,
    weight_kg: parsed.data.weightKg,
    body_fat_pct: parsed.data.bodyFatPct,
    chest_cm: parsed.data.chestCm,
    waist_cm: parsed.data.waistCm,
    hips_cm: parsed.data.hipsCm,
    arm_cm: parsed.data.armCm,
    thigh_cm: parsed.data.thighCm,
    notes: parsed.data.notes,
    photo_path: photoPath,
    created_by: coachId,
  };

  const { error } = existing
    ? await supabase.from("measurements").update(row).eq("id", existing.id)
    : await supabase.from("measurements").insert(row);

  if (error) {
    if (hasFile && photoPath && photoPath !== existing?.photo_path) {
      await supabase.storage.from("athlete-files").remove([photoPath]);
    }
    return { ok: false, message: it.auth.genericError };
  }

  if (hasFile && existing?.photo_path && existing.photo_path !== photoPath) {
    await supabase.storage.from("athlete-files").remove([existing.photo_path]);
  }

  refreshAthlete(parsed.data.athleteId);
  return { ok: true, message: it.measurements.saved };
}

export async function deleteMeasurement(formData: FormData) {
  const athleteId = String(formData.get("athleteId") ?? "");
  const measurementId = String(formData.get("measurementId") ?? "");
  const supabase = await createClient();
  const { data } = await supabase
    .from("measurements")
    .select("photo_path")
    .eq("id", measurementId)
    .eq("athlete_id", athleteId)
    .maybeSingle();

  const { error } = await supabase
    .from("measurements")
    .delete()
    .eq("id", measurementId)
    .eq("athlete_id", athleteId);

  if (!error && data?.photo_path) {
    await supabase.storage.from("athlete-files").remove([data.photo_path]);
  }

  refreshAthlete(athleteId);
  redirect(`/coach/atleti/${athleteId}/misure`);
}
