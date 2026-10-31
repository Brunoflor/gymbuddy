import type { ReactNode } from "react";
import { AthleteNav, Frame, TopBar } from "@/components/shell";
import { requireApprovedAthlete } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AthleteLayout({ children }: { children: ReactNode }) {
  const account = await requireApprovedAthlete();
  return (
    <>
      <Frame bottomNav>
        <TopBar name={account.fullName} href="/atleta" returnTo="/atleta" />
        {children}
      </Frame>
      <AthleteNav />
    </>
  );
}
