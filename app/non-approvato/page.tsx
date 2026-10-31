import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Frame, PageIntro, TopBar } from "@/components/shell";
import { destinationForAccount } from "@/lib/domain";
import { it } from "@/lib/i18n/it";
import { getAccount } from "@/lib/session";

export const metadata: Metadata = { title: "Non approvato" };
export const dynamic = "force-dynamic";

export default async function RejectedPage() {
  const account = await getAccount();
  if (!account) redirect("/accedi");
  if (account.role !== "athlete" || account.status !== "rejected") {
    redirect(destinationForAccount(account));
  }

  return (
    <Frame>
      <TopBar name={account.fullName} href="/non-approvato" />
      <PageIntro title={it.auth.rejectedTitle} lead={it.auth.rejectedLead} />
    </Frame>
  );
}
