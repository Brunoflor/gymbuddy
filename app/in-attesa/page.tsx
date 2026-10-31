import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Frame, PageIntro, TopBar } from "@/components/shell";
import { Panel, WrongDoorNotice } from "@/components/ui";
import { destinationForAccount } from "@/lib/domain";
import { it } from "@/lib/i18n/it";
import { getCoachName } from "@/lib/queries";
import { getAccount } from "@/lib/session";

export const metadata: Metadata = { title: "In attesa" };
export const dynamic = "force-dynamic";

export default async function PendingPage({
  searchParams,
}: {
  searchParams: Promise<{ ingresso?: string }>;
}) {
  const account = await getAccount();
  const query = await searchParams;
  if (!account) redirect("/atleta");
  if (account.role !== "athlete" || account.status !== "pending") {
    redirect(destinationForAccount(account));
  }

  const coachName = account.coachId ? await getCoachName(account.coachId) : null;

  return (
    <Frame>
      <TopBar name={account.fullName} href="/in-attesa" returnTo="/atleta" />
      <WrongDoorNotice ingresso={query.ingresso} />
      <PageIntro title={it.auth.pendingTitle} lead={it.auth.pendingLead} />
      <Panel>
        <p className="text-sm text-muted">{it.auth.pendingCoach}</p>
        <p className="mt-1 font-display text-3xl">{coachName ?? "—"}</p>
      </Panel>
    </Frame>
  );
}
