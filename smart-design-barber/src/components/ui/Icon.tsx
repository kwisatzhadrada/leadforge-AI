import type { ReactElement, SVGProps } from "react";

const paths: Record<string, ReactElement> = {
  logo: (
    <>
      <path d="M6 6l12 12M18 6L6 18" />
      <circle cx="6" cy="6" r="2.2" />
      <circle cx="6" cy="18" r="2.2" />
    </>
  ),
  fade: <path d="M3 18c3-8 6-11 9-11M7 19c3-7 6-10 9-10M11 20c3-6 6-9 9-9" />,
  razor: (
    <>
      <path d="M4 14l9-9 3 3-9 9z" />
      <path d="M13 8l3 3" />
      <path d="M6 16l-2 5 5-2z" />
    </>
  ),
  shave: (
    <>
      <path d="M4 12a8 8 0 0 1 16 0" />
      <path d="M4 12v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
    </>
  ),
  kid: (
    <>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 21c0-4 3-6.5 7-6.5s7 2.5 7 6.5" />
    </>
  ),
  home: (
    <>
      <path d="M4 11l8-7 8 7" />
      <path d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9" />
    </>
  ),
  wifi: (
    <>
      <path d="M3 9a15 15 0 0 1 18 0" />
      <path d="M6.5 12.5a10 10 0 0 1 11 0" />
      <path d="M10 16a5 5 0 0 1 4 0" />
      <circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  accessible: (
    <>
      <circle cx="12" cy="4.5" r="1.6" />
      <path d="M11 8v5l-4 6M11 13h6M13 8l5 2M9 19h9" />
    </>
  ),
  parking: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M9 17V7h3.5a3 3 0 0 1 0 6H9" />
    </>
  ),
  phone: <path d="M4 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L14 13l5 2v4a2 2 0 0 1-2 2C9.7 21 3 14.3 3 6a2 2 0 0 1 1-2z" />,
  pin: (
    <>
      <path d="M12 22s7-7.4 7-12.5A7 7 0 0 0 5 9.5C5 14.6 12 22 12 22z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  star: <path d="M12 2l2.9 6.5 7.1.7-5.4 4.7 1.7 7-6.3-3.8-6.3 3.8 1.7-7-5.4-4.7 7.1-.7z" fill="currentColor" stroke="none" />,
  check: <path d="M20 6L9 17l-5-5" />,
  menu: <path d="M3 6h18M3 12h18M3 18h18" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  chevronDown: <path d="M6 9l6 6 6-6" />,
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  facebook: <path d="M14 9h3V6h-3a4 4 0 0 0-4 4v2H7v3h3v6h3v-6h3l1-3h-4v-2a1 1 0 0 1 1-1z" />,
  tiktok: (
    <>
      <path d="M15 3v10.5a3.5 3.5 0 1 1-3-3.46" />
      <path d="M15 3c.7 2.4 2.4 4 5 4.2" />
    </>
  ),
  tea: (
    <>
      <path d="M7 3c1 3-2 3-1 6M13 3c1 3-2 3-1 6" />
      <path d="M6 9h9l-1 9a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2z" />
      <path d="M15 11h2a2 2 0 0 1 0 4h-2" />
    </>
  ),
  tools: (
    <>
      <rect x="7" y="2" width="6" height="9" rx="1.5" />
      <path d="M9 11v3M11 11v3" />
      <path d="M7 14h6l4 8h-3l-3-6-3 6H5z" />
    </>
  ),
  beard: (
    <>
      <path d="M6 4v6c0 6 3 10 6 10s6-4 6-10V4" />
      <path d="M9 4v5M15 4v5" />
    </>
  ),
  photo: (
    <>
      <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
      <circle cx="12" cy="13.5" r="3.5" />
    </>
  ),
};

export function Icon({
  name,
  ...rest
}: { name: keyof typeof paths } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {paths[name]}
    </svg>
  );
}
