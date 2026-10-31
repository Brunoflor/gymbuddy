export function supabaseEnv(): { url: string; key: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Mancano NEXT_PUBLIC_SUPABASE_URL e la chiave anon/publishable. Copia .env.example in .env.local.",
    );
  }

  return { url, key };
}

export function demoHintsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_HINTS === "true";
}
