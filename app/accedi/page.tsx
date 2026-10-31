import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Frame, PageIntro, TopBar } from "@/components/shell";
import { destinationForAccount } from "@/lib/domain";
import { it } from "@/lib/i18n/it";
import { getAccount } from "@/lib/session";

export const metadata: Metadata = { title: "Accedi" };
export const dynamic = "force-dynamic";

export default async function LegacyLoginChooser() {
  const account = await getAccount();
  if (account) redirect(destinationForAccount(account));

  return (
    <Frame>
      <TopBar name="" href="/" showSignOut={false} />
      <PageIntro title={it.auth.chooserTitle} lead={it.auth.chooserLead} />
      <div className="grid gap-3">
        <Link href="/coach" className="rounded-3xl bg-pine px-5 py-5 text-white">
          <p className="text-xs uppercase tracking-[0.16em] text-white/70">{it.landing.coachEntry}</p>
          <p className="mt-2 font-display text-3xl">{it.landing.openCoach}</p>
        </Link>
        <Link href="/atleta" className="rounded-3xl border border-line bg-card px-5 py-5">
          <p className="text-xs uppercase tracking-[0.16em] text-ember">{it.landing.athleteEntry}</p>
          <p className="mt-2 font-display text-3xl">{it.landing.openAthlete}</p>
        </Link>
      </div>
    </Frame>
  );
}
