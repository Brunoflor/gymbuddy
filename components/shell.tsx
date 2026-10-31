"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { signOut } from "@/lib/actions";
import { it } from "@/lib/i18n/it";

export function TopBar({
  name,
  href,
  showSignOut = true,
}: {
  name: string;
  href: string;
  showSignOut?: boolean;
}) {
  return (
    <header className="flex items-center justify-between gap-3 py-4">
      <Link href={href} className="font-display text-3xl leading-none tracking-tight">
        {it.appName}
      </Link>
      <div className="flex items-center gap-2">
        {name ? <span className="hidden max-w-40 truncate text-sm text-muted sm:inline">{name}</span> : null}
        {showSignOut ? (
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-full px-3 py-2 text-sm font-semibold text-ink hover:bg-black/5"
            >
              {it.nav.signOut}
            </button>
          </form>
        ) : null}
      </div>
    </header>
  );
}

const athleteLinks = [
  { href: "/atleta", label: it.nav.today },
  { href: "/atleta/dieta", label: it.nav.diet },
  { href: "/atleta/allenamento", label: it.nav.workout },
  { href: "/atleta/progressi", label: it.nav.progress },
];

export function AthleteNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-card/95 backdrop-blur">
      <ul className="mx-auto grid max-w-3xl grid-cols-4">
        {athleteLinks.map((link) => {
          const active = pathname === link.href;
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`block px-2 py-3 text-center text-xs font-semibold ${active ? "text-ember" : "text-muted"}`}
                aria-current={active ? "page" : undefined}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function PageIntro({ title, lead }: { title: string; lead?: string }) {
  return (
    <div className="mb-5">
      <h1 className="font-display text-4xl leading-tight tracking-tight">{title}</h1>
      {lead ? <p className="mt-2 text-sm leading-6 text-muted">{lead}</p> : null}
    </div>
  );
}

export function Frame({ children, bottomNav = false }: { children: ReactNode; bottomNav?: boolean }) {
  return (
    <div className={`mx-auto w-full max-w-3xl px-4 ${bottomNav ? "pb-24" : "pb-16"}`}>{children}</div>
  );
}
