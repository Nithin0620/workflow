export function Logo({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect
        x="4"
        y="4"
        width="56"
        height="56"
        rx="14"
        fill="#0a0a0a"
        stroke="#26262b"
        strokeWidth="2"
      />
      <path
        d="M13 20 L24 46 L32 30 L40 46 L51 20"
        fill="none"
        stroke="#ffffff"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}