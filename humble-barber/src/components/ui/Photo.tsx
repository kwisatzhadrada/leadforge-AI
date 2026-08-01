import { useState, type CSSProperties } from "react";
import { Icon } from "./Icon";

type Props = {
  src: string;
  alt: string;
  icon?: string;
  className?: string;
  loading?: "eager" | "lazy";
  style?: CSSProperties;
};

/**
 * Renders a real <img>, but falls back to a styled placeholder tile (icon +
 * label) if the photo fails to load — a blocked/offline network, a dead
 * stock-photo link, etc. — instead of a broken-image icon. Fills its parent
 * exactly like a normal object-cover image would.
 */
export function Photo({ src, alt, icon = "photo", className = "", loading = "lazy", style }: Props) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <div
        className={`relative flex h-full w-full flex-col items-center justify-center gap-2.5 overflow-hidden bg-[linear-gradient(155deg,var(--surface-2)_0%,var(--ink-elevated)_65%,var(--surface)_100%)] ${className}`}
      >
        <div
          className="pointer-events-none absolute inset-[-20%] opacity-40"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, rgba(244,239,226,0.04) 0 2px, transparent 2px 26px)",
          }}
        />
        <Icon name={icon as never} className="relative h-8 w-8 text-[var(--amber-dim)] opacity-70" />
        <span className="relative px-4 text-center font-mono text-[0.62rem] uppercase tracking-[0.1em] text-[var(--text-faint)]">
          {alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      onError={() => setErrored(true)}
      className={`h-full w-full object-cover ${className}`}
      style={style}
    />
  );
}
