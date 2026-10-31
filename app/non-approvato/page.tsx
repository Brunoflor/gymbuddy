import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Frame, PageIntro, TopBar } from "@/components/shell";
import { WrongDoorNotice } from "@/components/ui";
import { destinationForAccount } from "@/lib/domain";
import { it } from "@/lib/i18n/it";
import { getAccount } from "@/lib/session";

export const metadata: Metadata = { title: "Non approvato" };
export const dynamic = "force-dynamic";

export default async function RejectedPage({
  searchParams,
}: {
  searchParams: Promise<{ ingresso?: string }>;
}) {
  const account = await getAccount();
  const query = await searchParams;
  if (!account) redirect("/atleta");
  if (account.role !== "athlete" || account.status !== "rejected") {
    redirect(destinationForAccount(account));
  }

  return (
    <Frame>
      <TopBar name={account.fullName} href="/non-approvato" returnTo="/atleta" />
      <WrongDoorNotice ingresso={query.ingresso} />
      <PageIntro title={it.auth.rejectedTitle} lead={it.auth.rejectedLead} />
    </Frame>
  );
}
