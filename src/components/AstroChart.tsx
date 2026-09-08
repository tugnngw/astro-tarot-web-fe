interface Planet {
  name: string;
  symbol: string;
  angle: number; // degrees 0-360
  color?: string;
}

interface Props {
  planetPositions?: Planet[];
  size?: number;
}

const ZODIAC = [
  "♈",
  "♉",
  "♊",
  "♋",
  "♌",
  "♍",
  "♎",
  "♏",
  "♐",
  "♑",
  "♒",
  "♓",
];

const DEFAULT_PLANETS: Planet[] = [
  { name: "Sun", symbol: "☉", angle: 45 },
  { name: "Moon", symbol: "☽", angle: 120 },
  { name: "Mercury", symbol: "☿", angle: 75 },
  { name: "Venus", symbol: "♀", angle: 200 },
  { name: "Mars", symbol: "♂", angle: 280 },
  { name: "Jupiter", symbol: "♃", angle: 330 },
];

export function AstroChart({
  planetPositions = DEFAULT_PLANETS,
  size = 320,
}: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size / 2 - 8;
  const rInner = rOuter - 32;
  const rPlanet = rInner - 30;
  const rCore = 36;

  const polar = (r: number, deg: number) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)] as const;
  };

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full">
      <defs>
        <radialGradient id="core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="oklch(0.85 0.11 85)" stopOpacity="0.9" />
          <stop
            offset="100%"
            stopColor="oklch(0.35 0.15 290)"
            stopOpacity="0.1"
          />
        </radialGradient>
      </defs>

      {/* outer ring */}
      <circle
        cx={cx}
        cy={cy}
        r={rOuter}
        fill="none"
        stroke="var(--gold)"
        strokeOpacity="0.55"
        strokeWidth="1.2"
      />
      <circle
        cx={cx}
        cy={cy}
        r={rInner}
        fill="none"
        stroke="var(--gold)"
        strokeOpacity="0.35"
        strokeWidth="0.8"
      />
      <circle cx={cx} cy={cy} r={rCore} fill="url(#core)" />

      {/* zodiac segments */}
      <g
        className="animate-zodiac"
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      >
        {ZODIAC.map((sym, i) => {
          const deg = i * 30;
          const [x1, y1] = polar(rInner, deg);
          const [x2, y2] = polar(rOuter, deg);
          const [tx, ty] = polar(rInner + 16, deg + 15);
          return (
            <g key={i}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="var(--gold)"
                strokeOpacity="0.4"
              />
              <text
                x={tx}
                y={ty}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="var(--gold)"
                fontSize="14"
              >
                {sym}
              </text>
            </g>
          );
        })}
      </g>

      {/* aspect lines between planets */}
      <g>
        {planetPositions.slice(0, 4).map((p, i) =>
          planetPositions.slice(i + 1, 4).map((q, j) => {
            const [x1, y1] = polar(rPlanet, p.angle);
            const [x2, y2] = polar(rPlanet, q.angle);
            return (
              <line
                key={`${i}-${j}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="var(--mystic)"
                strokeOpacity="0.35"
                strokeWidth="0.7"
              />
            );
          }),
        )}
      </g>

      {/* planets */}
      {planetPositions.map((p) => {
        const [x, y] = polar(rPlanet, p.angle);
        return (
          <g key={p.name}>
            <circle
              cx={x}
              cy={y}
              r="11"
              fill="var(--card)"
              stroke="var(--gold)"
              strokeWidth="1.2"
            />
            <text
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="var(--gold-soft)"
              fontSize="11"
            >
              {p.symbol}
            </text>
          </g>
        );
      })}

      <text
        x={cx}
        y={cy + 4}
        textAnchor="middle"
        fill="var(--gold)"
        fontSize="14"
        className="font-display"
      >
        ✦
      </text>
    </svg>
  );
}
