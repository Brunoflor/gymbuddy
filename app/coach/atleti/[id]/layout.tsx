import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Frame, TopBar } from "@/components/shell";
import { StatusBadge } from "@/components/ui";
import { it } from "@/lib/i18n/it";
import { getAthleteSummary } from "@/lib/queries";
import { requireCoach } from "@/lib/session";
import { AthleteTabs } from "./tabs";

export const dynamic = "force-dynamic";

export default async function AthleteLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const account = await requireCoach();
  const { id } = await params;
  const athlete = await getAthleteSummary(id);
  if (!athlete) notFound();

  return (
    <Frame>
      <TopBar name={account.fullName} href="/coach" />
      <Link href="/coach" className="text-sm font-semibold text-pine">
        ← {it.coach.back}
      </Link>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl leading-tight">{athlete.fullName}</h1>
          <p className="text-sm text-muted">{athlete.email}</p>
        </div>
        <StatusBadge status={athlete.status} />
      </div>
      {athlete.status !== "approved" ? <p className="mt-3 text-sm text-muted">{it.coach.pendingHint}</p> : null}
      <AthleteTabs athleteId={athlete.athleteId} />
      <div className="mt-4">{children}</div>
    </Frame>
  );
}
