import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth-forms";
import { Frame, PageIntro, TopBar } from "@/components/shell";
import { Panel } from "@/components/ui";
import { demoHintsEnabled } from "@/lib/env";
import { destinationForAccount } from "@/lib/domain";
import { it } from "@/lib/i18n/it";
import { getAccount } from "@/lib/session";

export const metadata: Metadata = { title: "Accedi" };

export default async function LoginPage() {
  const account = await getAccount();
  if (account) redirect(destinationForAccount(account));

  return (
    <Frame>
      <TopBar name="" href="/" showSignOut={false} />
      <PageIntro title={it.auth.signInTitle} lead={it.auth.signInLead} />
      <Panel>
        <LoginForm showDemo={demoHintsEnabled()} />
      </Panel>
    </Frame>
  );
}
