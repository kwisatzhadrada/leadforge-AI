import type { AnchorHTMLAttributes, PropsWithChildren } from "react";

type Variant = "primary" | "outline";

/**
 * A label that "flips" up on hover — a small, on-brand nod to the split-flap
 * departure board, without needing a literal per-character 3D flip.
 */
export function FlapLabel({ children }: { children: string }) {
  return (
    <span className="relative inline-block h-[1.2em] overflow-hidden align-middle">
      <span className="block transition-transform duration-300 [transition-timing-function:var(--ease)] group-hover:-translate-y-full">
        {children}
      </span>
      <span
        aria-hidden
        className="absolute inset-0 block translate-y-full transition-transform duration-300 [transition-timing-function:var(--ease)] group-hover:translate-y-0"
      >
        {children}
      </span>
    </span>
  );
}

export function Button({
  variant = "primary",
  className = "",
  children,
  ...rest
}: PropsWithChildren<{ variant?: Variant } & AnchorHTMLAttributes<HTMLAnchorElement>>) {
  const base =
    "group inline-flex items-center justify-center gap-2.5 rounded-full px-7 py-3.5 text-[0.95rem] font-semibold tracking-wide transition-all duration-300 [transition-timing-function:var(--ease)] whitespace-nowrap";

  const styles =
    variant === "primary"
      ? "text-[#14100a] bg-[linear-gradient(135deg,var(--amber-bright)_0%,var(--amber)_55%,var(--amber-dim)_100%)] shadow-[0_10px_30px_-10px_var(--amber-glow)] hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-8px_var(--amber-glow)]"
      : "text-[var(--text)] bg-white/[0.03] border border-[var(--border)] backdrop-blur hover:border-[var(--amber)] hover:-translate-y-0.5 hover:bg-white/[0.05]";

  return (
    <a className={`${base} ${styles} ${className}`} {...rest}>
      {children}
    </a>
  );
}
