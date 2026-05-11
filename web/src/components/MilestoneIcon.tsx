// Hand-drawn clipart-style SVG icons, one per milestone. Index matches
// analytics.json `milestone_keys` and i18n `milestones`. All icons use a
// shared 24x24 viewBox, stroke-only style with `currentColor`, so they pick
// up the surrounding text color via CSS.

interface Props {
  index: number;
  size?: number;
  className?: string;
}

const COMMON = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function PaperPlane() {
  // Submit: outgoing paper plane.
  return (
    <>
      <path d="M2 12 L22 3 L18 21 L11 14 Z" {...COMMON} />
      <path d="M11 14 L22 3" {...COMMON} />
      <path d="M11 14 L11 19" {...COMMON} />
    </>
  );
}

function DocumentCheck() {
  // Acknowledged: document with corner fold and a check.
  return (
    <>
      <path d="M5 3 H15 L19 7 V20 a1 1 0 0 1 -1 1 H6 a1 1 0 0 1 -1 -1 Z" {...COMMON} />
      <path d="M15 3 V7 H19" {...COMMON} />
      <path d="M8 14 L11 17 L16 11" {...COMMON} stroke="currentColor" strokeWidth={2} />
    </>
  );
}

function ShieldCheck() {
  // Background check cleared: shield with check.
  return (
    <>
      <path d="M12 2 L4 5 V12 C 4 17 8 20 12 22 C 16 20 20 17 20 12 V5 Z" {...COMMON} />
      <path d="M8 12 L11 15 L16 9" {...COMMON} stroke="currentColor" strokeWidth={2} />
    </>
  );
}

function CalendarStar() {
  // Invited to test: calendar with a date marker.
  return (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" {...COMMON} />
      <path d="M3 10 H21" {...COMMON} />
      <path d="M8 3 V7" {...COMMON} />
      <path d="M16 3 V7" {...COMMON} />
      <circle cx="12" cy="15" r="2.5" {...COMMON} />
    </>
  );
}

function PencilPaper() {
  // Took the test: pencil over lined paper.
  return (
    <>
      <path d="M5 4 H14 L19 9 V20 a1 1 0 0 1 -1 1 H6 a1 1 0 0 1 -1 -1 Z" {...COMMON} />
      <path d="M14 4 V9 H19" {...COMMON} />
      <path d="M8 13 H13" {...COMMON} />
      <path d="M8 16 H15" {...COMMON} />
      <path d="M16 17 L20 13 L22 15 L18 19 L15 20 Z" {...COMMON} />
    </>
  );
}

function CeremonyCap() {
  // Ceremony: graduation cap.
  return (
    <>
      <path d="M2 9 L12 5 L22 9 L12 13 Z" {...COMMON} />
      <path d="M6 11 V16 c0 1 3 3 6 3 s6 -2 6 -3 V11" {...COMMON} />
      <path d="M22 9 V14" {...COMMON} />
      <circle cx="22" cy="14.5" r="0.7" fill="currentColor" stroke="none" />
    </>
  );
}

function Scroll() {
  // Certificate received: scroll/diploma with ribbon.
  return (
    <>
      <rect x="4" y="4" width="16" height="14" rx="1" {...COMMON} />
      <path d="M7 8 H17" {...COMMON} />
      <path d="M7 11 H17" {...COMMON} />
      <path d="M7 14 H13" {...COMMON} />
      <path d="M9 18 L8 22 L12 20 L16 22 L15 18" {...COMMON} />
    </>
  );
}

const ICONS = [
  PaperPlane,
  DocumentCheck,
  ShieldCheck,
  CalendarStar,
  PencilPaper,
  CeremonyCap,
  Scroll,
];

export default function MilestoneIcon({ index, size = 28, className }: Props) {
  const Icon = ICONS[index] ?? PaperPlane;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
    >
      <Icon />
    </svg>
  );
}
