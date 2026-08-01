import type { ReactElement, SVGProps } from "react";

const paths: Record<string, ReactElement> = {
  logo: (
    <>
      <path d="M6 6l12 12M18 6L6 18" />
      <circle cx="6" cy="6" r="2.2" />
      <circle cx="6" cy="18" r="2.2" />
    </>
  ),
  scissors: (
    <>
      <path d="M6 6l12 12M18 6L6 18" />
      <circle cx="6" cy="6" r="2.2" />
      <circle cx="6" cy="18" r="2.2" />
    </>
  ),
  fade: <path d="M3 18c3-8 6-11 9-11M7 19c3-7 6-10 9-10M11 20c3-6 6-9 9-9" />,
  beard: (
    <>
      <path d="M6 4v6c0 6 3 10 6 10s6-4 6-10V4" />
      <path d="M9 4v5M15 4v5" />
    </>
  ),
  shave: (
    <>
      <path d="M4 12a8 8 0 0 1 16 0" />
      <path d="M4 12v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
    </>
  ),
  towel: (
    <>
      <path d="M5 10h14v3a7 7 0 0 1-14 0z" />
      <path d="M9 4c0 1.5-1.5 1.5-1.5 3S9 8.5 9 10M15 4c0 1.5-1.5 1.5-1.5 3s1.5 1.5 1.5 3" />
    </>
  ),
  steam: (
    <>
      <path d="M7 3c1.2 2.5-1.2 3-1 5.5M12 3c1.2 2.5-1.2 3-1 5.5M17 3c1.2 2.5-1.2 3-1 5.5" />
      <path d="M5 11h14v3a7 7 0 0 1-14 0z" />
    </>
  ),
  star: <path d="M12 2l2.9 6.5 7.1.7-5.4 4.7 1.7 7-6.3-3.8-6.3 3.8 1.7-7-5.4-4.7 7.1-.7z" fill="currentColor" stroke="none" />,
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
  walkin: (
    <>
      <path d="M12 3v6M12 21v-6M5 12h4M15 12h4" />
      <circle cx="12" cy="12" r="9" />
    </>
  ),
  cap: (
    <>
      <path d="M2 9l10-4 10 4-10 4z" />
      <path d="M6 11v4c0 1.5 2.7 3 6 3s6-1.5 6-3v-4" />
      <path d="M21 9v6" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  photo: (
    <>
      <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
      <circle cx="12" cy="13.5" r="3.5" />
    </>
  ),
  flap: (
    <>
      <rect x="3" y="4" width="8" height="16" rx="1" />
      <rect x="13" y="4" width="8" height="16" rx="1" />
      <path d="M3 12h8M13 12h8" />
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
