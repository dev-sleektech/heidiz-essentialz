// Stylized flat-silhouette skyline of Abuja, standing in for cinematic city
// photography until the client supplies real footage/stills. Two SVGs (far
// hills, near skyline) are each tiled twice and slid horizontally in the
// hero for a slow parallax "sliding through the city" effect.

type SkylineProps = { className?: string };

// Distant layer: Zuma Rock and the Aso Rock massif on the horizon.
export function AbujaHills({ className }: SkylineProps) {
  return (
    <svg
      viewBox="0 0 1600 300"
      preserveAspectRatio="none"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      {/* Zuma Rock */}
      <path d="M160,300 C155,240 158,180 175,140 C190,110 205,95 220,88 C235,95 250,110 265,140 C282,180 285,240 280,300 Z" />
      {/* Aso Rock massif */}
      <path d="M480,300 C470,250 478,210 510,190 C540,175 580,168 620,172 C650,160 690,158 720,168 C760,160 800,165 830,185 C860,205 875,240 870,300 Z" />
      {/* rolling companion hills for rhythm across the tile width */}
      <path d="M1050,300 C1045,270 1055,245 1080,235 C1100,228 1120,230 1140,240 C1160,250 1165,270 1160,300 Z" />
      <path d="M1350,300 C1345,275 1355,255 1380,248 C1400,242 1420,244 1435,252 C1450,262 1455,280 1450,300 Z" />
    </svg>
  );
}

const BUILDINGS = [
  { x: 40, w: 34, h: 130 },
  { x: 84, w: 20, h: 190 },
  { x: 112, w: 42, h: 100 },
  { x: 162, w: 26, h: 230 },
  { x: 196, w: 30, h: 150 },
  { x: 234, w: 18, h: 175 },
  { x: 260, w: 46, h: 120 },
  { x: 320, w: 24, h: 200 },
  { x: 352, w: 30, h: 140 },
  { x: 700, w: 28, h: 210 },
  { x: 736, w: 40, h: 150 },
  { x: 814, w: 34, h: 170 },
  { x: 856, w: 20, h: 200 },
  { x: 884, w: 44, h: 130 },
  { x: 936, w: 26, h: 240 },
  { x: 1340, w: 30, h: 140 },
  { x: 1378, w: 22, h: 190 },
  { x: 1408, w: 38, h: 110 },
  { x: 1454, w: 24, h: 220 },
  { x: 1486, w: 30, h: 160 },
  { x: 1524, w: 20, h: 180 },
  { x: 1552, w: 36, h: 120 },
];

const GROUND = 420;

// Near layer: downtown towers, the Nigerian National Mosque, and the
// National Assembly complex, the recognizable heart of the city skyline.
export function AbujaCity({ className }: SkylineProps) {
  return (
    <svg
      viewBox="0 0 1600 420"
      preserveAspectRatio="none"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      {BUILDINGS.map((b) => (
        <rect key={b.x} x={b.x} y={GROUND - b.h} width={b.w} height={b.h} />
      ))}

      {/* tapered downtown tower, echoing Abuja's angular high-rises */}
      <path d="M784,420 L784,200 L806,160 L828,420 Z" />

      {/* Nigerian National Mosque: central dome + four minarets */}
      <g>
        <rect x="415" y="250" width="14" height="170" />
        <path d="M415,250 L422,225 L429,250 Z" />
        <rect x="460" y="280" width="10" height="140" />
        <path d="M460,280 L465,262 L470,280 Z" />
        <rect x="565" y="280" width="10" height="140" />
        <path d="M565,280 L570,262 L575,280 Z" />
        <rect x="605" y="250" width="14" height="170" />
        <path d="M605,250 L612,225 L619,250 Z" />
        <rect x="440" y="340" width="140" height="80" />
        <path d="M455,340 A55,55 0 0 1 565,340 Z" />
      </g>

      {/* National Assembly: twin towers flanking the green dome */}
      <g>
        <rect x="1080" y="200" width="50" height="220" />
        <rect x="1210" y="200" width="50" height="220" />
        <rect x="1140" y="340" width="90" height="80" />
        <path d="M1140,340 A45,45 0 0 1 1230,340 Z" />
      </g>
    </svg>
  );
}
