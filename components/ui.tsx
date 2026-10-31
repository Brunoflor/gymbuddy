import type { ButtonHTMLAttributes, ReactNode } from "react";
import { it } from "@/lib/i18n/it";
import type { MembershipStatus } from "@/lib/domain";

const buttonStyles = {
  primary: "bg-pine text-white hover:bg-pine/90",
  secondary: "border border-line bg-card text-ink hover:bg-sand",
  danger: "border border-danger/30 bg-card text-danger hover:bg-red-50",
  ghost: "text-ink hover:bg-black/5",
} as const;

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof buttonStyles }) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${buttonStyles[variant]} ${className}`}
      {...props}
    />
  );
}

export function TextField({
  label,
  name,
  type = "text",
  defaultValue,
  required = false,
  autoComplete,
  minLength,
  hint,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
  autoComplete?: string;
  minLength?: number;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <input
        className="w-full rounded-2xl border border-line bg-white px-3 py-3 text-base"
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        autoComplete={autoComplete}
        minLength={minLength}
      />
      {hint ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export function Notice({ children, tone = "ok" }: { children: ReactNode; tone?: "ok" | "bad" }) {
  const styles =
    tone === "bad" ? "border-danger/30 bg-red-50 text-danger" : "border-pine/20 bg-moss text-pine";
  return (
    <p role="status" className={`rounded-2xl border px-3 py-2 text-sm ${styles}`}>
      {children}
    </p>
  );
}

export function StatusBadge({ status }: { status: MembershipStatus }) {
  const styles = {
    pending: "bg-amber-100 text-amber-950",
    approved: "bg-moss text-pine",
    rejected: "bg-red-50 text-danger",
  } as const;
  const labels = {
    pending: it.status.pending,
    approved: it.status.approved,
    rejected: it.status.rejected,
  } as const;
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-3xl border border-line bg-card p-4 shadow-sm ${className}`}>{children}</section>;
}
