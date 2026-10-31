"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { it } from "@/lib/i18n/it";

export function AthleteTabs({ athleteId }: { athleteId: string }) {
  const pathname = usePathname();
  const tabs = [
    { href: `/coach/atleti/${athleteId}`, label: it.nav.profile },
    { href: `/coach/atleti/${athleteId}/dieta`, label: it.nav.diet },
    { href: `/coach/atleti/${athleteId}/allenamento`, label: it.nav.workout },
    { href: `/coach/atleti/${athleteId}/misure`, label: it.nav.measurements },
  ];

  return (
    <nav className="mt-4 flex gap-2 overflow-x-auto">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold ${
              active ? "bg-ink text-white" : "bg-card text-ink"
            }`}
            aria-current={active ? "page" : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
