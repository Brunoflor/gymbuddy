import type { Metadata } from "next";
import Link from "next/link";
import { setMembershipStatus } from "@/lib/actions";
import { CopyInvite } from "@/components/copy-invite";
import { Frame, PageIntro, TopBar } from "@/components/shell";
import { Button, Panel, StatusBadge } from "@/components/ui";
import { it } from "@/lib/i18n/it";
import { listRoster, type RosterEntry } from "@/lib/queries";
import { requireCoach } from "@/lib/session";

export const metadata: Metadata = { title: "Atleti" };
export const dynamic = "force-dynamic";

export default async function CoachHomePage({
  searchParams,
}: {
  searchParams: Promise<{ esito?: string }>;
}) {
  const account = await requireCoach();
  const roster = await listRoster();
  const query = await searchParams;
  const pending = roster.filter((entry) => entry.status === "pending");
  const active = roster.filter((entry) => entry.status === "approved");
  const rejected = roster.filter((entry) => entry.status === "rejected");

  return (
    <Frame>
      <TopBar name={account.fullName} href="/coach" />
      <PageIntro title={it.coach.rosterTitle} lead={it.coach.rosterLead} />
      {account.signupCode ? <CopyInvite code={account.signupCode} /> : null}
      {query.esito === "rejected" ? <p className="mt-4 text-sm text-pine">{it.coach.rejectedDone}</p> : null}
      {query.esito === "pending" ? <p className="mt-4 text-sm text-pine">{it.coach.reopened}</p> : null}
      <section className="mt-6 space-y-3">
        <h2 className="font-display text-2xl">{it.coach.pending}</h2>
        {pending.length === 0 ? <p className="text-sm text-muted">{it.coach.emptyPending}</p> : null}
        {pending.map((entry) => (
          <AthleteCard key={entry.membershipId} entry={entry} actions />
        ))}
      </section>
      <section className="mt-8 space-y-3">
        <h2 className="font-display text-2xl">{it.coach.active}</h2>
        {active.length === 0 ? <p className="text-sm text-muted">{it.coach.emptyActive}</p> : null}
        {active.map((entry) => (
          <AthleteCard key={entry.membershipId} entry={entry} />
        ))}
      </section>
      {rejected.length > 0 ? (
        <section className="mt-8 space-y-3">
          <h2 className="font-display text-2xl">{it.coach.rejected}</h2>
          {rejected.map((entry) => (
            <AthleteCard key={entry.membershipId} entry={entry} />
          ))}
        </section>
      ) : null}
    </Frame>
  );
}

function AthleteCard({ entry, actions = false }: { entry: RosterEntry; actions?: boolean }) {
  return (
    <Panel>
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link href={`/coach/atleti/${entry.athleteId}`} className="font-display text-2xl">
            {entry.fullName}
          </Link>
          <p className="text-sm text-muted">{entry.email}</p>
        </div>
        <StatusBadge status={entry.status} />
      </div>
      {actions ? (
        <div className="mt-3 flex gap-2">
          <form action={setMembershipStatus}>
            <input type="hidden" name="athleteId" value={entry.athleteId} />
            <input type="hidden" name="status" value="approved" />
            <Button type="submit">{it.coach.approve}</Button>
          </form>
          <form action={setMembershipStatus}>
            <input type="hidden" name="athleteId" value={entry.athleteId} />
            <input type="hidden" name="status" value="rejected" />
            <Button type="submit" variant="danger">
              {it.coach.reject}
            </Button>
          </form>
        </div>
      ) : null}
    </Panel>
  );
}
