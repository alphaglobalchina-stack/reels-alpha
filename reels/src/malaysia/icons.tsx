import React from 'react';
import {FeatureIcon} from './data';

/**
 * Soft "clay 3D" icons drawn in SVG: pearl, champagne and graphite volumes lit from the
 * top-left, with a contact shadow. No external icon images were supplied for these
 * concepts, so they are drawn in code instead of forcing an unrelated picture.
 */

type P = {size?: number; id: string; style?: React.CSSProperties};

const Defs: React.FC<{id: string}> = ({id}) => (
  <defs>
    <linearGradient id={`${id}-pearl`} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#FFFFFF" />
      <stop offset="0.55" stopColor="#F4F2EE" />
      <stop offset="1" stopColor="#D9D4CB" />
    </linearGradient>
    <linearGradient id={`${id}-pearlSide`} x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#E6E1D8" />
      <stop offset="1" stopColor="#CFC8BC" />
    </linearGradient>
    <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#FBF3E0" />
      <stop offset="0.45" stopColor="#E8D9B5" />
      <stop offset="1" stopColor="#BFA06A" />
    </linearGradient>
    <linearGradient id={`${id}-goldV`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#F8EDD3" />
      <stop offset="1" stopColor="#C9AE78" />
    </linearGradient>
    <linearGradient id={`${id}-ink`} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#5A5A60" />
      <stop offset="0.5" stopColor="#2C2C30" />
      <stop offset="1" stopColor="#141416" />
    </linearGradient>
    <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#F3EBD9" />
      <stop offset="1" stopColor="#B9A27A" />
    </linearGradient>
    <linearGradient id={`${id}-shine`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95" />
      <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
    </linearGradient>
    <radialGradient id={`${id}-ao`} cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stopColor="#1C1C1E" stopOpacity="0.28" />
      <stop offset="1" stopColor="#1C1C1E" stopOpacity="0" />
    </radialGradient>
  </defs>
);

const Svg: React.FC<P & {children: React.ReactNode}> = ({size = 180, id, style, children}) => (
  <svg width={size} height={size} viewBox="0 0 200 200" style={{overflow: 'visible', ...style}}>
    <Defs id={id} />
    {children}
  </svg>
);

const u = (id: string, n: string) => `url(#${id}-${n})`;

const Star: React.FC<{cx: number; cy: number; r: number; fill: string}> = ({cx, cy, r, fill}) => {
  const pts = Array.from({length: 10}, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * 0.45;
    return `${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`;
  });
  return <polygon points={pts.join(' ')} fill={fill} strokeLinejoin="round" />;
};

export const HotelIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <ellipse cx="104" cy="182" rx="74" ry="11" fill={u(p.id, 'ao')} />
    {/* side face */}
    <path d="M142 70 L166 82 L166 176 L142 180 Z" fill={u(p.id, 'pearlSide')} />
    {/* front */}
    <rect x="44" y="70" width="98" height="110" rx="8" fill={u(p.id, 'pearl')} />
    <rect x="44" y="70" width="98" height="14" rx="7" fill={u(p.id, 'shine')} opacity="0.7" />
    {/* windows */}
    {[0, 1, 2].map((r) =>
      [0, 1, 2].map((c) => (
        <rect key={`${r}${c}`} x={56 + c * 28} y={92 + r * 24} width="18" height="14" rx="3" fill={(r + c) % 3 === 0 ? u(p.id, 'gold') : u(p.id, 'ink')} opacity={(r + c) % 3 === 0 ? 1 : 0.85} />
      )),
    )}
    {/* door */}
    <path d="M80 180 V160 a13 13 0 0 1 26 0 V180 Z" fill={u(p.id, 'ink')} />
    {/* 4 stars */}
    {[0, 1, 2, 3].map((i) => (
      <Star key={i} cx={58 + i * 25} cy={48 - Math.sin(((i + 0.5) / 4) * Math.PI) * 10} r={11} fill={u(p.id, 'gold')} />
    ))}
  </Svg>
);

export const BreakfastIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <ellipse cx="100" cy="180" rx="80" ry="11" fill={u(p.id, 'ao')} />
    {/* saucer */}
    <ellipse cx="92" cy="164" rx="66" ry="15" fill={u(p.id, 'pearlSide')} />
    <ellipse cx="92" cy="160" rx="62" ry="12" fill={u(p.id, 'pearl')} />
    {/* cup */}
    <path d="M46 92 H136 V118 C136 146 116 160 91 160 C66 160 46 146 46 118 Z" fill={u(p.id, 'pearl')} />
    <path d="M136 104 C162 102 164 136 132 138" fill="none" stroke={u(p.id, 'gold')} strokeWidth="9" strokeLinecap="round" />
    <ellipse cx="91" cy="92" rx="45" ry="10" fill={u(p.id, 'gold')} />
    <ellipse cx="91" cy="93" rx="38" ry="7" fill="#6B4F2E" opacity="0.85" />
    <path d="M56 104 C58 126 66 142 80 150" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" opacity="0.8" />
    {/* steam */}
    {[0, 1, 2].map((i) => (
      <path key={i} d={`M${72 + i * 19} 74 c-8 -10 8 -16 0 -28 c-6 -9 6 -14 2 -22`} fill="none" stroke="#C9C3B8" strokeWidth="5" strokeLinecap="round" opacity={0.75 - i * 0.12} />
    ))}
    {/* croissant */}
    <g transform="translate(150 150) rotate(-18)">
      <path d="M-30 6 C-26 -16 26 -16 30 6 C20 0 12 -2 0 -2 C-12 -2 -20 0 -30 6 Z" fill={u(p.id, 'gold')} />
      <path d="M-14 -9 L-10 2 M0 -12 V0 M14 -9 L10 2" stroke="#B0935D" strokeWidth="3" strokeLinecap="round" />
    </g>
  </Svg>
);

export const FlightIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <ellipse cx="96" cy="184" rx="70" ry="9" fill={u(p.id, 'ao')} />
    <path d="M24 150 C70 150 120 120 150 72" fill="none" stroke={u(p.id, 'goldV')} strokeWidth="5" strokeLinecap="round" strokeDasharray="2 12" />
    <g transform="translate(108 92) rotate(-38)">
      {/* wings */}
      <path d="M-6 -6 L-36 -62 L-22 -64 L26 -6 Z" fill={u(p.id, 'gold')} />
      <path d="M-6 6 L-36 62 L-22 64 L26 6 Z" fill={u(p.id, 'goldV')} />
      {/* tail */}
      <path d="M-52 -3 L-66 -26 L-58 -27 L-40 -4 Z M-52 3 L-66 26 L-58 27 L-40 4 Z" fill={u(p.id, 'gold')} />
      {/* fuselage */}
      <path d="M-62 -9 L46 -9 C64 -9 72 -3 74 0 C72 3 64 9 46 9 L-62 9 C-68 9 -68 -9 -62 -9 Z" fill={u(p.id, 'pearl')} />
      <path d="M-58 -8 L46 -8 C58 -8 66 -5 70 -2 L-58 -2 Z" fill={u(p.id, 'shine')} opacity="0.8" />
      {[0, 1, 2, 3, 4].map((i) => (
        <circle key={i} cx={-30 + i * 14} cy="1" r="2.6" fill={u(p.id, 'ink')} />
      ))}
      <path d="M56 -6 C64 -5 68 -2 70 0 L56 0 Z" fill={u(p.id, 'ink')} />
    </g>
  </Svg>
);

export const CarIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <ellipse cx="100" cy="166" rx="88" ry="12" fill={u(p.id, 'ao')} />
    {/* body */}
    <path d="M14 130 C14 116 20 108 34 104 L58 98 L78 72 C84 64 92 62 104 62 L134 62 C146 62 154 66 162 76 L178 98 C190 102 194 112 194 126 L194 140 C194 146 190 150 184 150 L22 150 C16 150 14 146 14 140 Z" fill={u(p.id, 'ink')} />
    {/* windows */}
    <path d="M70 98 L86 76 C89 72 93 70 100 70 L114 70 L114 98 Z" fill={u(p.id, 'glass')} />
    <path d="M122 70 L136 70 C144 70 148 72 152 78 L166 98 L122 98 Z" fill={u(p.id, 'glass')} />
    <path d="M24 112 C60 104 150 102 186 112" fill="none" stroke="#fff" strokeWidth="4" opacity="0.35" strokeLinecap="round" />
    <path d="M30 120 H180" stroke={u(p.id, 'gold')} strokeWidth="3" opacity="0.9" />
    {/* lights */}
    <rect x="182" y="112" width="10" height="8" rx="3" fill={u(p.id, 'gold')} />
    <rect x="16" y="114" width="8" height="8" rx="3" fill="#E9E4DA" />
    {/* wheels */}
    {[56, 152].map((x) => (
      <g key={x}>
        <circle cx={x} cy="150" r="22" fill="#141416" />
        <circle cx={x} cy="150" r="13" fill={u(p.id, 'pearl')} />
        <circle cx={x} cy="150" r="5" fill={u(p.id, 'gold')} />
      </g>
    ))}
  </Svg>
);

export const VipIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <ellipse cx="100" cy="178" rx="74" ry="10" fill="#000" opacity="0.35" />
    <path d="M34 150 L24 70 L66 104 L100 50 L134 104 L176 70 L166 150 Z" fill={u(p.id, 'gold')} strokeLinejoin="round" />
    <path d="M34 150 L24 70 L66 104 L100 50 L100 150 Z" fill="#fff" opacity="0.18" />
    <rect x="30" y="148" width="140" height="22" rx="8" fill={u(p.id, 'goldV')} />
    <rect x="30" y="148" width="140" height="7" rx="3.5" fill="#fff" opacity="0.45" />
    {[
      [24, 70],
      [100, 50],
      [176, 70],
    ].map(([x, y]) => (
      <circle key={x} cx={x} cy={y} r="10" fill={u(p.id, 'pearl')} />
    ))}
    <circle cx="100" cy="122" r="11" fill={u(p.id, 'pearl')} />
    <circle cx="66" cy="128" r="6" fill={u(p.id, 'pearl')} opacity="0.9" />
    <circle cx="134" cy="128" r="6" fill={u(p.id, 'pearl')} opacity="0.9" />
  </Svg>
);

export const SimIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <ellipse cx="98" cy="186" rx="60" ry="9" fill={u(p.id, 'ao')} />
    {/* card with clipped corner */}
    <path d="M62 82 L104 82 L132 110 L132 176 C132 181 128 184 124 184 L62 184 C57 184 54 181 54 176 L54 90 C54 85 57 82 62 82 Z" fill={u(p.id, 'pearlSide')} transform="translate(5 3)" />
    <path d="M62 82 L104 82 L132 110 L132 176 C132 181 128 184 124 184 L62 184 C57 184 54 181 54 176 L54 90 C54 85 57 82 62 82 Z" fill={u(p.id, 'pearl')} />
    {/* chip */}
    <rect x="68" y="122" width="50" height="44" rx="8" fill={u(p.id, 'gold')} />
    <path d="M68 137 H118 M68 151 H118 M93 122 V166" stroke="#B0935D" strokeWidth="2.4" />
    {/* wifi */}
    {[0, 1, 2].map((i) => (
      <path
        key={i}
        d={`M${150 - 20 - i * 15} ${62 - i * 2} A ${20 + i * 15} ${20 + i * 15} 0 0 1 ${150 + 20 + i * 15} ${62 - i * 2}`}
        transform={`translate(0 ${i * 15})`}
        fill="none"
        stroke={i === 0 ? u(p.id, 'gold') : u(p.id, 'ink')}
        strokeWidth="8"
        strokeLinecap="round"
        opacity={1 - i * 0.18}
      />
    ))}
    <circle cx="150" cy="68" r="7" fill={u(p.id, 'gold')} />
  </Svg>
);

export const ToursIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <ellipse cx="100" cy="178" rx="80" ry="11" fill={u(p.id, 'ao')} />
    {/* body */}
    <rect x="26" y="72" width="152" height="100" rx="20" fill={u(p.id, 'pearlSide')} transform="translate(4 4)" />
    <rect x="26" y="72" width="152" height="100" rx="20" fill={u(p.id, 'pearl')} />
    <path d="M70 72 L80 52 C82 48 86 46 90 46 L114 46 C118 46 122 48 124 52 L134 72 Z" fill={u(p.id, 'pearl')} />
    <rect x="26" y="96" width="152" height="18" fill={u(p.id, 'ink')} opacity="0.9" />
    {/* lens */}
    <circle cx="102" cy="122" r="40" fill={u(p.id, 'gold')} />
    <circle cx="102" cy="122" r="31" fill={u(p.id, 'ink')} />
    <circle cx="102" cy="122" r="19" fill="#3A3A40" />
    <circle cx="93" cy="112" r="8" fill="#fff" opacity="0.7" />
    {/* shutter + flash */}
    <rect x="140" y="58" width="24" height="12" rx="5" fill={u(p.id, 'gold')} />
    <rect x="40" y="82" width="20" height="9" rx="4" fill={u(p.id, 'gold')} />
  </Svg>
);

export const HeartsIcon: React.FC<P & {beatA?: number; beatB?: number}> = ({beatA = 1, beatB = 1, ...p}) => {
  const heart = 'M0 30 C-34 6 -40 -22 -22 -34 C-10 -42 0 -34 0 -24 C0 -34 10 -42 22 -34 C40 -22 34 6 0 30 Z';
  return (
    <Svg {...p}>
      <ellipse cx="100" cy="182" rx="72" ry="10" fill={u(p.id, 'ao')} />
      <g transform={`translate(78 104) scale(${1.55 * beatA}) rotate(-12)`}>
        <path d={heart} fill={u(p.id, 'gold')} />
        <path d="M-24 -26 C-16 -32 -8 -28 -6 -22" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity="0.8" />
      </g>
      <g transform={`translate(128 122) scale(${1.25 * beatB}) rotate(14)`}>
        <path d={heart} fill={u(p.id, 'ink')} />
        <path d="M-24 -26 C-16 -32 -8 -28 -6 -22" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity="0.5" />
      </g>
    </Svg>
  );
};

export const FEATURE_ICONS: Record<FeatureIcon, React.FC<P>> = {
  hotel: HotelIcon,
  breakfast: BreakfastIcon,
  flight: FlightIcon,
  car: CarIcon,
  vip: VipIcon,
  sim: SimIcon,
  tours: ToursIcon,
};

/** Top-view airliner for the flight across the city cards. */
export const PlaneTop: React.FC<{size: number; id: string}> = ({size, id}) => (
  <svg width={size} height={size} viewBox="-100 -100 200 200" style={{overflow: 'visible'}}>
    <Defs id={id} />
    {/* wings */}
    <path d="M6 -8 L-22 -92 L-6 -94 L44 -8 Z" fill={u(id, 'gold')} />
    <path d="M6 8 L-22 92 L-6 94 L44 8 Z" fill={u(id, 'goldV')} />
    <path d="M-62 -4 L-82 -36 L-72 -37 L-48 -4 Z M-62 4 L-82 36 L-72 37 L-48 4 Z" fill={u(id, 'gold')} />
    {/* engines */}
    <rect x="4" y="-46" width="24" height="10" rx="5" fill={u(id, 'ink')} />
    <rect x="4" y="36" width="24" height="10" rx="5" fill={u(id, 'ink')} />
    {/* fuselage */}
    <path d="M-84 -10 L60 -10 C84 -10 96 -4 98 0 C96 4 84 10 60 10 L-84 10 C-92 10 -92 -10 -84 -10 Z" fill={u(id, 'pearl')} />
    <path d="M-80 -9 L60 -9 C78 -9 88 -6 92 -3 L-80 -3 Z" fill="#fff" opacity="0.8" />
    <path d="M76 -6 C86 -5 92 -2 94 0 L76 0 Z" fill={u(id, 'ink')} />
  </svg>
);

export const PlaneShadow: React.FC<{size: number}> = ({size}) => (
  <svg width={size} height={size} viewBox="-100 -100 200 200" style={{overflow: 'visible'}}>
    <path
      d="M6 -8 L-22 -92 L-6 -94 L44 -8 Z M6 8 L-22 92 L-6 94 L44 8 Z M-62 -4 L-82 -36 L-72 -37 L-48 -4 Z M-62 4 L-82 36 L-72 37 L-48 4 Z M-84 -10 L60 -10 C84 -10 96 -4 98 0 C96 4 84 10 60 10 L-84 10 C-92 10 -92 -10 -84 -10 Z"
      fill="#1C1C1E"
    />
  </svg>
);

// ── small line glyphs (contact rows, labels) ──
const line = (color: string, w = 2.2) => ({
  fill: 'none',
  stroke: color,
  strokeWidth: w,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

export const Glyph: React.FC<{name: 'whatsapp' | 'globe' | 'mail' | 'instagram' | 'pin' | 'arrow'; size: number; color: string}> = ({name, size, color}) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    {name === 'whatsapp' && (
      <>
        <path {...line(color)} d="M3.5 20.5l1.3-4.2A8.5 8.5 0 1 1 8 19.6z" />
        <path {...line(color, 1.9)} d="M9 8.6c0 3 2.6 6 6 6.4l1.1-1.5-2-1-1 .8c-1-.4-2.3-1.6-2.7-2.7l.8-1-1-2z" />
      </>
    )}
    {name === 'globe' && (
      <>
        <circle {...line(color)} cx="12" cy="12" r="9" />
        <path {...line(color)} d="M3 12h18M12 3c2.6 2.6 3.6 5.6 3.6 9s-1 6.4-3.6 9c-2.6-2.6-3.6-5.6-3.6-9S9.4 5.6 12 3z" />
      </>
    )}
    {name === 'mail' && (
      <>
        <rect {...line(color)} x="3" y="5.5" width="18" height="13" rx="2.5" />
        <path {...line(color)} d="M4 7l8 6 8-6" />
      </>
    )}
    {name === 'instagram' && (
      <>
        <rect {...line(color)} x="3.5" y="3.5" width="17" height="17" rx="5" />
        <circle {...line(color)} cx="12" cy="12" r="4" />
        <circle cx="17.2" cy="6.8" r="1.2" fill={color} />
      </>
    )}
    {name === 'pin' && (
      <>
        <path fill={color} d="M12 22s-7-6.6-7-12a7 7 0 0 1 14 0c0 5.4-7 12-7 12z" />
        <circle cx="12" cy="10" r="2.6" fill="rgba(0,0,0,0.35)" />
      </>
    )}
    {name === 'arrow' && <path {...line(color, 2.6)} d="M19 12H5m6-6l-6 6 6 6" />}
  </svg>
);

/** Four-point sparkle used for glints and the price spray. */
export const Sparkle: React.FC<{size: number; color?: string; style?: React.CSSProperties}> = ({size, color = '#E8D9B5', style}) => (
  <svg width={size} height={size} viewBox="-10 -10 20 20" style={style}>
    <path d="M0 -10 C1 -2 2 -1 10 0 C2 1 1 2 0 10 C-1 2 -2 1 -10 0 C-2 -1 -1 -2 0 -10 Z" fill={color} />
  </svg>
);
