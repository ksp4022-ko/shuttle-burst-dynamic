import type { ReactNode } from "react";

// Small sticker-style line icons (24px grid, 2.2 stroke). Supporting marks
// only -- labels carry the meaning.

export type V9IconName =
  | "date"
  | "time"
  | "shuttle"
  | "fee"
  | "court"
  | "people"
  | "list"
  | "proxy"
  | "bill"
  | "me"
  | "chevron"
  | "close"
  | "edit";

const PATHS: Record<V9IconName, ReactNode> = {
  edit: (
    <>
      <path d="M15.5 4.5 19.5 8.5 9 19H5v-4z" />
      <path d="M13.5 6.5l4 4" />
    </>
  ),
  date: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="3.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  time: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  shuttle: (
    <>
      <circle cx="12" cy="18" r="3" />
      <path d="M9.6 16.2 6 5h12l-3.6 11.2M10 5.2l.8 10.6M14 5.2l-.8 10.6" />
    </>
  ),
  fee: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M14.8 9.2c-.5-1-1.5-1.5-2.8-1.5-1.6 0-2.7.8-2.7 2s1 1.7 2.7 2.1c1.8.4 2.9 1 2.9 2.3s-1.2 2.1-2.9 2.1c-1.4 0-2.5-.6-3-1.6M12 6v1.7M12 16.3V18" />
    </>
  ),
  court: (
    <>
      <rect x="3.5" y="4" width="17" height="16" rx="2.5" />
      <path d="M3.5 12h17M12 4v16M7.5 4v16M16.5 4v16" />
    </>
  ),
  people: (
    <>
      <circle cx="9" cy="8.5" r="3.2" />
      <path d="M3 19.5c.6-3.3 3-5.2 6-5.2s5.4 1.9 6 5.2" />
      <circle cx="17" cy="9.5" r="2.6" />
      <path d="M16.5 14.4c2.4.2 4.1 1.8 4.5 4.6" />
    </>
  ),
  list: (
    <>
      <path d="M9 7h11M9 12h11M9 17h11" />
      <circle cx="4.8" cy="7" r="1.3" />
      <circle cx="4.8" cy="12" r="1.3" />
      <circle cx="4.8" cy="17" r="1.3" />
    </>
  ),
  proxy: (
    <>
      <circle cx="9" cy="8.5" r="3.2" />
      <path d="M3 19.5c.6-3.3 3-5.2 6-5.2 1.5 0 2.8.4 3.8 1.2M18 13v7M14.5 16.5h7" />
    </>
  ),
  bill: (
    <>
      <path d="M6 3.5h12v17l-2.4-1.6-2.4 1.6-2.4-1.6-2.4 1.6L6 20.5z" />
      <path d="M9 8.5h6M9 12h6M9 15.5h3.5" />
    </>
  ),
  me: (
    <>
      <circle cx="12" cy="8.5" r="3.8" />
      <path d="M4.5 20c.8-4 3.8-6.2 7.5-6.2s6.7 2.2 7.5 6.2" />
    </>
  ),
  chevron: <path d="m9 5 7 7-7 7" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
};

export function V9Icon({ name, size = 24 }: { name: V9IconName; size?: number }) {
  return (
    <svg
      className="v9-icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
