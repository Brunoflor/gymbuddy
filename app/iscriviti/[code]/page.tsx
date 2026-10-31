import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AthleteSignUpForm } from "@/components/auth-forms";
import { Frame, PageIntro, TopBar } from "@/components/shell";
import { Panel } from "@/components/ui";
import { destinationForAccount } from "@/lib/domain";
import { it } from "@/lib/i18n/it";
import { coachNameForCode } from "@/lib/queries";
import { getAccount } from "@/lib/session";

export const metadata: Metadata = { title: "Iscrizione" };
export const dynamic = "force-dynamic";

export default async function AthleteSignupPage({ params }: { params: Promise<{ code: string }> }) {
  const account = await getAccount();
  if (account) redirect(destinationForAccount(account));

  const { code } = await params;
  const normalized = code.trim().toUpperCase();
  const coachName = /^[A-Z0-9]{6,12}$/.test(normalized) ? await coachNameForCode(normalized) : null;

  return (
    <Frame>
      <TopBar name="" href="/" showSignOut={false} />
      <PageIntro title={it.auth.athleteTitle} />
      <Panel>
        {coachName ? (
          <AthleteSignUpForm code={normalized} coachName={coachName} />
        ) : (
          <p className="text-sm text-danger">{it.auth.unknownCode}</p>
        )}
      </Panel>
    </Frame>
  );
}
