import type { AnchorHTMLAttributes, PropsWithChildren } from "react";

type Variant = "primary" | "outline";

export function Button({
  variant = "primary",
  className = "",
  children,
  ...rest
}: PropsWithChildren<
  { variant?: Variant } & AnchorHTMLAttributes<HTMLAnchorElement>
>) {
  const base =
    "inline-flex items-center justify-center gap-2.5 rounded-full px-7 py-3.5 text-[0.95rem] font-semibold tracking-wide transition-all duration-300 [transition-timing-function:var(--ease)] whitespace-nowrap";

  const styles =
    variant === "primary"
      ? "text-[#150f06] bg-[linear-gradient(135deg,var(--brass-bright)_0%,var(--brass)_55%,var(--brass-dark)_100%)] shadow-[0_10px_30px_-10px_var(--brass-glow)] hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-8px_var(--brass-glow)]"
      : "text-[var(--text)] bg-white/[0.03] border border-[var(--border)] backdrop-blur hover:border-[var(--brass)] hover:-translate-y-0.5 hover:bg-white/[0.05]";

  return (
    <a className={`${base} ${styles} ${className}`} {...rest}>
      {children}
    </a>
  );
}
