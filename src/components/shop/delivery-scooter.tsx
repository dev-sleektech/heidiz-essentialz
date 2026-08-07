import { cn } from "@/lib/utils";

// Hand-built line-art scooter + rider, matching the same aesthetic as the
// hero's Abuja skyline (src/components/home/abuja-skyline.tsx) — thin
// single-color stroke, no fills, no stock icon/emoji. Wheels spin and the
// whole scooter bobs gently on its suspension; both respect
// prefers-reduced-motion (see .animate-scooter-* in globals.css).
export function DeliveryScooter({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 160 90"
      fill="none"
      className={cn("animate-scooter-bounce", className)}
      aria-hidden="true"
    >
      {/* Road */}
      <line x1="4" y1="80" x2="156" y2="80" stroke="currentColor" strokeOpacity="0.15" strokeWidth="2" strokeDasharray="6 6" />

      {/* Delivery box, mounted on the rear rack */}
      <rect x="16" y="42" width="22" height="20" rx="3" stroke="currentColor" strokeWidth="3" />
      <line x1="27" y1="42" x2="27" y2="62" stroke="currentColor" strokeWidth="2" strokeOpacity="0.5" />

      {/* Scooter body: rear rack -> footboard -> rises to front fork */}
      <path
        d="M38 52 L46 52 L52 70 L100 70 L112 42"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Seat post + seat */}
      <path d="M78 70 L78 56 L92 56" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Handlebar */}
      <path d="M112 42 L120 34 M112 42 L124 46" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />

      {/* Rider: seated, leaning forward, one arm to the handlebar */}
      <circle cx="98" cy="24" r="8" stroke="currentColor" strokeWidth="3.5" />
      <path
        d="M94 31 L88 50 L92 56 M88 50 L112 42"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M92 56 L86 70" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />

      {/* Wheels */}
      <g className="animate-scooter-wheel" style={{ transformOrigin: "52px 70px" }}>
        <circle cx="52" cy="70" r="11" stroke="currentColor" strokeWidth="3.5" />
        <path d="M52 62 V78 M44 70 H60" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.6" />
      </g>
      <g className="animate-scooter-wheel" style={{ transformOrigin: "112px 70px" }}>
        <circle cx="112" cy="70" r="11" stroke="currentColor" strokeWidth="3.5" />
        <path d="M112 62 V78 M104 70 H120" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.6" />
      </g>
    </svg>
  );
}
