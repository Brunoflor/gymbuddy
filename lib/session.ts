import "server-only";
import { redirect } from "next/navigation";
import { destinationForAccount, type MembershipStatus, type Role } from "@/lib/domain";
import { createClient } from "@/lib/supabase/server";

export type Account = {
  userId: string;
  email: string;
  fullName: string;
  role: Role;
  status: MembershipStatus | null;
  coachId: string | null;
  signupCode: string | null;
};

export async function getAccount(): Promise<Account | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || typeof userId !== "string") return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, email")
    .eq("id", userId)
    .maybeSingle();

  if (!profile || (profile.role !== "coach" && profile.role !== "athlete")) return null;

  let status: MembershipStatus | null = null;
  let coachId: string | null = null;
  let signupCode: string | null = null;

  if (profile.role === "athlete") {
    const { data: membership } = await supabase
      .from("memberships")
      .select("status, coach_id")
      .eq("athlete_id", userId)
      .maybeSingle();
    if (
      membership?.status === "pending" ||
      membership?.status === "approved" ||
      membership?.status === "rejected"
    ) {
      status = membership.status;
      coachId = membership.coach_id;
    } else {
      status = "pending";
    }
  } else {
    const { data: coach } = await supabase
      .from("coaches")
      .select("signup_code")
      .eq("id", userId)
      .maybeSingle();
    signupCode = coach?.signup_code ?? null;
  }

  return {
    userId,
    email: profile.email ?? "",
    fullName: profile.full_name,
    role: profile.role,
    status,
    coachId,
    signupCode,
  };
}

export async function requireAccount(): Promise<Account> {
  const account = await getAccount();
  if (!account) redirect("/accedi");
  return account;
}

export async function requireCoach(): Promise<Account> {
  const account = await requireAccount();
  if (account.role !== "coach") redirect(destinationForAccount(account));
  return account;
}

export async function requireApprovedAthlete(): Promise<Account> {
  const account = await requireAccount();
  if (account.role !== "athlete" || account.status !== "approved") {
    redirect(destinationForAccount(account));
  }
  return account;
}
