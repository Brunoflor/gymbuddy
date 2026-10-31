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
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Link href="/coach" className="rounded-3xl bg-pine p-5 text-white">
            <p className="text-xs uppercase tracking-[0.16em] text-white/70">{it.landing.coachEntry}</p>
            <h2 className="mt-3 font-display text-3xl">{it.landing.openCoach}</h2>
            <p className="mt-2 text-sm leading-6 text-white/80">{it.landing.coachCardLead}</p>
          </Link>
          <Link href="/atleta" className="rounded-3xl border border-line bg-card p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-ember">{it.landing.athleteEntry}</p>
            <h2 className="mt-3 font-display text-3xl">{it.landing.openAthlete}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{it.landing.athleteCardLead}</p>
          </Link>
        </div>
        <p className="mt-4 max-w-md text-sm text-muted">{it.landing.haveCode}</p>
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
