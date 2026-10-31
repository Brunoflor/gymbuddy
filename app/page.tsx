import Link from "next/link";
import { it } from "@/lib/i18n/it";

export default function HomePage() {
  return (
    <main className="mx-auto grid min-h-dvh w-full max-w-5xl items-center gap-10 px-4 py-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">{it.landing.eyebrow}</p>
        <h1 className="mt-3 max-w-xl font-display text-5xl leading-[1.05] tracking-tight sm:text-6xl">
          {it.landing.title}
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-muted">{it.landing.lead}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/accedi" className="rounded-full bg-pine px-5 py-3 text-sm font-semibold text-white">
            {it.landing.signIn}
          </Link>
          <Link href="/registrati" className="rounded-full border border-line bg-card px-5 py-3 text-sm font-semibold">
            {it.landing.registerCoach}
          </Link>
        </div>
        <p className="mt-4 max-w-md text-sm text-muted">{it.landing.haveCode}</p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <article className="rounded-3xl border border-line bg-card p-4">
            <h2 className="font-display text-2xl">{it.landing.coachTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{it.landing.coachBody}</p>
          </article>
          <article className="rounded-3xl border border-line bg-card p-4">
            <h2 className="font-display text-2xl">{it.landing.athleteTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{it.landing.athleteBody}</p>
          </article>
        </div>
      </div>
      <aside className="rounded-[2rem] bg-pine p-5 text-white shadow-xl">
        <p className="text-xs uppercase tracking-[0.16em] text-white/60">{it.appName}</p>
        <h2 className="mt-6 font-display text-3xl">{it.landing.sampleDay}</h2>
        <ul className="mt-4 space-y-3">
          {[
            [it.landing.sampleExercise, it.landing.sampleDetail],
            ["Lento manubri", "3 × 8-10 · recupero 90″"],
            ["French press", "3 × 10 · recupero 75″"],
          ].map(([name, detail]) => (
            <li key={name} className="rounded-2xl bg-white/10 px-3 py-3">
              <p className="font-semibold">{name}</p>
              <p className="text-sm text-white/70">{detail}</p>
            </li>
          ))}
        </ul>
      </aside>
    </main>
  );
}
