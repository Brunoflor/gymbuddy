import { setMembershipStatus } from "@/lib/actions";
import { CharacteristicsForm } from "@/components/body-forms";
import { Button, Notice, Panel } from "@/components/ui";
import { it } from "@/lib/i18n/it";
import { getAthleteSummary, getCharacteristics } from "@/lib/queries";

export default async function AthleteProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ esito?: string; errore?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const athlete = await getAthleteSummary(id);
  const characteristics = athlete ? await getCharacteristics(id) : null;
  if (!athlete) return null;

  return (
    <div className="space-y-4">
      {query.esito === "approved" ? <Notice>{it.coach.approved}</Notice> : null}
      {query.errore ? <Notice tone="bad">{it.coach.decisionFailed}</Notice> : null}
      <Panel className="flex flex-wrap gap-2">
        {athlete.status !== "approved" ? (
          <form action={setMembershipStatus}>
            <input type="hidden" name="athleteId" value={id} />
            <input type="hidden" name="status" value="approved" />
            <Button type="submit">{it.coach.approve}</Button>
          </form>
        ) : null}
        {athlete.status === "pending" ? (
          <form action={setMembershipStatus}>
            <input type="hidden" name="athleteId" value={id} />
            <input type="hidden" name="status" value="rejected" />
            <Button type="submit" variant="danger">
              {it.coach.reject}
            </Button>
          </form>
        ) : null}
        {athlete.status !== "pending" ? (
          <form action={setMembershipStatus}>
            <input type="hidden" name="athleteId" value={id} />
            <input type="hidden" name="status" value="pending" />
            <Button type="submit" variant="secondary">
              {it.coach.reopen}
            </Button>
          </form>
        ) : null}
      </Panel>
      <Panel>
        <h2 className="mb-3 font-display text-2xl">{it.characteristics.title}</h2>
        <p className="mb-4 text-sm text-muted">{it.characteristics.lead}</p>
        <CharacteristicsForm
          athleteId={id}
          fullName={athlete.fullName}
          sex={characteristics?.sex ?? "unspecified"}
          birthDate={characteristics?.birthDate ?? ""}
          heightCm={characteristics?.heightCm?.toString() ?? ""}
          notes={characteristics?.notes ?? ""}
        />
      </Panel>
    </div>
  );
}
