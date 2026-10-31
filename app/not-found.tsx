import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-lg px-4 py-16">
      <h1 className="font-display text-4xl">Pagina non trovata</h1>
      <p className="mt-3 text-sm text-muted">Il link non corrisponde a una pagina di GymBuddy.</p>
      <Link href="/" className="mt-6 inline-block font-semibold text-pine">
        Torna all&apos;inizio
      </Link>
    </main>
  );
}
