"use client";

import { useState } from "react";
import { it } from "@/lib/i18n/it";

export function CopyInvite({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = `${window.location.origin}/iscriviti/${code}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
  }

  return (
    <div className="rounded-3xl bg-pine px-4 py-4 text-white">
      <p className="text-xs uppercase tracking-[0.16em] text-white/70">{it.coach.codeLabel}</p>
      <p className="mt-1 font-display text-4xl tracking-wide">{code}</p>
      <button
        type="button"
        onClick={copy}
        className="mt-3 rounded-full bg-white px-4 py-2 text-sm font-semibold text-pine"
      >
        {copied ? it.coach.copied : it.coach.copyLink}
      </button>
    </div>
  );
}
