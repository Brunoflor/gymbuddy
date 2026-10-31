import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CoachSignUpForm } from "@/components/auth-forms";
import { Frame, PageIntro, TopBar } from "@/components/shell";
import { Panel } from "@/components/ui";
import { destinationForAccount } from "@/lib/domain";
import { it } from "@/lib/i18n/it";
import { getAccount } from "@/lib/session";

export const metadata: Metadata = { title: "Registra coach" };
export const dynamic = "force-dynamic";

export default async function RegisterCoachPage() {
  const account = await getAccount();
  if (account) redirect(destinationForAccount(account));

  return (
    <Frame>
      <TopBar name="" href="/coach" showSignOut={false} />
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pine">{it.landing.coachEntry}</p>
      <PageIntro title={it.auth.coachTitle} lead={it.auth.coachLead} />
      <Panel>
        <CoachSignUpForm />
      </Panel>
    </Frame>
  );
}
