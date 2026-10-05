import React from 'react';
import {IconDef} from './Icon3D';

// Shared materials (porcelain / champagne gold / graphite) for the clay-3D icon faces.
const Mats: React.FC<{id: string}> = ({id}) => (
  <defs>
    <linearGradient id={`${id}-por`} x1="0.1" y1="0" x2="0.9" y2="1">
      <stop offset="0" stopColor="#FFFFFF" />
      <stop offset="0.55" stopColor="#F6F3EE" />
      <stop offset="1" stopColor="#DCD5C9" />
    </linearGradient>
    <linearGradient id={`${id}-cha`} x1="0.1" y1="0" x2="0.9" y2="1">
      <stop offset="0" stopColor="#FBF3DF" />
      <stop offset="0.45" stopColor="#E8D3A2" />
      <stop offset="1" stopColor="#B8975A" />
    </linearGradient>
    <linearGradient id={`${id}-gra`} x1="0" y1="0" x2="0.8" y2="1">
      <stop offset="0" stopColor="#55555B" />
      <stop offset="1" stopColor="#1C1C1E" />
    </linearGradient>
    <radialGradient id={`${id}-hl`} cx="0.3" cy="0.25" r="0.6">
      <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.95} />
      <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
    </radialGradient>
  </defs>
);

const star = (cx: number, cy: number, r: number) => {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(2)},${(cy + rr * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(' ');
};

// ───────── 1. hotel, 4 stars ─────────
const hotelStars = [
  [52, 34],
  [82, 22],
  [118, 22],
  [148, 34],
];
export const hotelIcon: IconDef = {
  body: (
    <g fill="currentColor">
      <rect x="46" y="62" width="108" height="122" rx="12" />
      <rect x="38" y="54" width="124" height="18" rx="8" />
      {hotelStars.map(([x, y], i) => (
        <polygon key={i} points={star(x, y, 13)} />
      ))}
    </g>
  ),
  face: (id) => (
    <g>
      <Mats id={id} />
      <rect x="46" y="62" width="108" height="122" rx="12" fill={`url(#${id}-por)`} />
      <rect x="38" y="54" width="124" height="18" rx="8" fill={`url(#${id}-cha)`} />
      {[0, 1, 2].map((r) =>
        [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={62 + c * 28} y={84 + r * 26} width="20" height="16" rx="4" fill={`url(#${id}-gra)`} />),
      )}
      {[0, 1, 2].map((r) => (
        <rect key={r} x="62" y={84 + r * 26} width="76" height="3" rx="1.5" fill="#FFFFFF" opacity={0.25} />
      ))}
      <path d="M86 184 L86 160 Q100 146 114 160 L114 184 Z" fill={`url(#${id}-cha)`} />
      <rect x="78" y="152" width="44" height="6" rx="3" fill={`url(#${id}-gra)`} />
      {hotelStars.map(([x, y], i) => (
        <polygon key={i} points={star(x, y, 13)} fill={`url(#${id}-cha)`} stroke="#B8975A" strokeWidth="0.8" />
      ))}
      <rect x="46" y="62" width="108" height="122" rx="12" fill={`url(#${id}-hl)`} opacity={0.6} />
    </g>
  ),
};

// ───────── 2. daily breakfast: cup, saucer, steam ─────────
export const breakfastIcon: IconDef = {
  body: (
    <g fill="currentColor" stroke="currentColor">
      <ellipse cx="96" cy="164" rx="82" ry="18" stroke="none" />
      <path d="M40 92 L152 92 L146 132 Q140 162 96 164 Q52 162 46 132 Z" stroke="none" />
      <path d="M150 104 Q182 104 176 128 Q170 146 142 144" fill="none" strokeWidth="13" />
    </g>
  ),
  face: (id) => (
    <g>
      <Mats id={id} />
      <ellipse cx="96" cy="164" rx="82" ry="18" fill={`url(#${id}-por)`} />
      <ellipse cx="96" cy="160" rx="56" ry="9" fill="#D9D2C5" opacity={0.7} />
      <path d="M150 104 Q182 104 176 128 Q170 146 142 144" fill="none" stroke={`url(#${id}-por)`} strokeWidth="13" strokeLinecap="round" />
      <path d="M40 92 L152 92 L146 132 Q140 162 96 164 Q52 162 46 132 Z" fill={`url(#${id}-por)`} />
      <ellipse cx="96" cy="92" rx="56" ry="11" fill={`url(#${id}-cha)`} />
      <ellipse cx="96" cy="93" rx="47" ry="7.5" fill="#5B4636" />
      <ellipse cx="86" cy="91.5" rx="16" ry="2.4" fill="#8A6B52" opacity={0.8} />
      <path d="M48 112 Q96 122 148 112" fill="none" stroke={`url(#${id}-cha)`} strokeWidth="5" />
      <path d="M50 100 Q54 140 76 154" fill="none" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" opacity={0.85} />
      {[72, 96, 120].map((x, i) => (
        <path
          key={i}
          d={`M${x} 76 C${x - 12} 62 ${x + 12} 52 ${x} 36 C${x - 10} 26 ${x + 6} 18 ${x} 10`}
          fill="none"
          stroke={`url(#${id}-cha)`}
          strokeWidth="6"
          strokeLinecap="round"
          opacity={0.9 - i * 0.1}
        />
      ))}
    </g>
  ),
};

// ───────── 3. domestic flight ─────────
const planeBody = (
  <g>
    <path d="M100 14 C110 14 113 32 113 46 L113 150 C113 166 107 178 100 178 C93 178 87 166 87 150 L87 46 C87 32 90 14 100 14 Z" />
    <path d="M100 74 L18 118 L18 134 L100 108 L182 134 L182 118 Z" />
    <path d="M100 150 L64 172 L64 182 L100 170 L136 182 L136 172 Z" />
  </g>
);
export const flightIcon: IconDef = {
  body: (
    <g fill="currentColor" transform="rotate(45 100 100)">
      {planeBody}
    </g>
  ),
  face: (id) => (
    <g>
      <Mats id={id} />
      <g transform="rotate(45 100 100)">
        <path d="M100 74 L18 118 L18 134 L100 108 L182 134 L182 118 Z" fill={`url(#${id}-por)`} />
        <path d="M100 74 L18 118 L18 124 L100 86 L182 124 L182 118 Z" fill="#FFFFFF" />
        <path d="M100 150 L64 172 L64 182 L100 170 L136 182 L136 172 Z" fill={`url(#${id}-por)`} />
        <rect x="46" y="106" width="14" height="28" rx="7" fill={`url(#${id}-cha)`} />
        <rect x="140" y="106" width="14" height="28" rx="7" fill={`url(#${id}-cha)`} />
        <path d="M100 14 C110 14 113 32 113 46 L113 150 C113 166 107 178 100 178 C93 178 87 166 87 150 L87 46 C87 32 90 14 100 14 Z" fill={`url(#${id}-por)`} />
        <path d="M93 32 Q100 24 107 32 L106 40 Q100 36 94 40 Z" fill={`url(#${id}-gra)`} />
        <rect x="98" y="52" width="4" height="100" rx="2" fill={`url(#${id}-cha)`} />
        <path d="M91 40 L91 150" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" opacity={0.9} />
      </g>
    </g>
  ),
};

// ───────── 4. private car & driver ─────────
const carPath =
  'M14 138 L16 118 Q18 106 34 102 L58 96 Q72 72 92 70 L132 70 Q150 72 164 94 L180 98 Q190 102 190 116 L190 138 Q190 146 182 146 L22 146 Q14 146 14 138 Z';
export const carIcon: IconDef = {
  body: (
    <g fill="currentColor">
      <path d={carPath} />
      <circle cx="56" cy="146" r="22" />
      <circle cx="152" cy="146" r="22" />
    </g>
  ),
  face: (id) => (
    <g>
      <Mats id={id} />
      <path d={carPath} fill={`url(#${id}-por)`} />
      <path d="M66 96 Q78 78 94 77 L108 77 L108 96 Z" fill={`url(#${id}-gra)`} />
      <path d="M116 77 L132 77 Q146 79 156 96 L116 96 Z" fill={`url(#${id}-gra)`} />
      <path d="M70 92 Q80 82 92 81" stroke="#FFFFFF" strokeWidth="3" fill="none" opacity={0.5} strokeLinecap="round" />
      <path d="M18 120 L188 120" stroke={`url(#${id}-cha)`} strokeWidth="4" />
      <rect x="16" y="106" width="16" height="9" rx="4" fill={`url(#${id}-cha)`} />
      <rect x="176" y="106" width="12" height="9" rx="4" fill="#C9B79A" />
      <rect x="100" y="104" width="14" height="4" rx="2" fill={`url(#${id}-gra)`} />
      {[56, 152].map((x) => (
        <g key={x}>
          <circle cx={x} cy="146" r="22" fill={`url(#${id}-gra)`} />
          <circle cx={x} cy="146" r="11" fill={`url(#${id}-cha)`} />
          <circle cx={x - 3} cy="143" r="4" fill="#FFFFFF" opacity={0.6} />
        </g>
      ))}
      <path d="M24 108 Q60 98 100 98" stroke="#FFFFFF" strokeWidth="4" fill="none" opacity={0.8} strokeLinecap="round" />
    </g>
  ),
};

// ───────── 5. VIP reception: gold card + crown ─────────
const crownPath = 'M58 74 L50 30 L78 50 L100 20 L122 50 L150 30 L142 74 Z';
export const vipIcon: IconDef = {
  body: (
    <g fill="currentColor">
      <rect x="18" y="80" width="164" height="100" rx="18" />
      <path d={crownPath} />
      <circle cx="50" cy="28" r="7" />
      <circle cx="100" cy="18" r="7" />
      <circle cx="150" cy="28" r="7" />
    </g>
  ),
  face: (id) => (
    <g>
      <Mats id={id} />
      <rect x="18" y="80" width="164" height="100" rx="18" fill={`url(#${id}-cha)`} />
      <rect x="26" y="88" width="148" height="84" rx="12" fill="none" stroke="#FFFFFF" strokeOpacity={0.55} strokeWidth="2" />
      <text
        x="100"
        y="146"
        textAnchor="middle"
        fontFamily="Sora"
        fontWeight={800}
        fontSize="50"
        fill="#1C1C1E"
        letterSpacing="2"
      >
        VIP
      </text>
      <path d={crownPath} fill={`url(#${id}-cha)`} stroke="#B8975A" strokeWidth="1" />
      <rect x="58" y="62" width="84" height="12" rx="3" fill={`url(#${id}-gra)`} />
      {[50, 100, 150].map((x, i) => (
        <circle key={x} cx={x} cy={i === 1 ? 18 : 28} r="7" fill={`url(#${id}-por)`} />
      ))}
      <path d="M30 96 Q60 86 100 88" stroke="#FFFFFF" strokeWidth="5" fill="none" opacity={0.75} strokeLinecap="round" />
    </g>
  ),
};

// ───────── 6. SIM card + internet ─────────
const simPath = 'M30 60 Q30 48 42 48 L104 48 L134 78 L134 176 Q134 188 122 188 L42 188 Q30 188 30 176 Z';
export const simIcon: IconDef = {
  body: (
    <g fill="currentColor" stroke="currentColor">
      <path d={simPath} stroke="none" />
      <circle cx="160" cy="76" r="9" stroke="none" />
      <path d="M140 56 A28 28 0 0 1 180 56" fill="none" strokeWidth="10" strokeLinecap="round" />
      <path d="M128 40 A46 46 0 0 1 192 40" fill="none" strokeWidth="10" strokeLinecap="round" />
    </g>
  ),
  face: (id) => (
    <g>
      <Mats id={id} />
      <path d={simPath} fill={`url(#${id}-por)`} />
      <rect x="48" y="100" width="68" height="62" rx="10" fill={`url(#${id}-cha)`} />
      <path d="M48 120 H74 M90 120 H116 M48 142 H74 M90 142 H116 M82 100 V162" stroke="#9C7E4C" strokeWidth="2.4" />
      <path d="M38 60 Q40 54 48 54 L80 54" stroke="#FFFFFF" strokeWidth="5" fill="none" strokeLinecap="round" opacity={0.9} />
      <circle cx="160" cy="76" r="9" fill={`url(#${id}-gra)`} />
      <path d="M140 56 A28 28 0 0 1 180 56" fill="none" stroke={`url(#${id}-gra)`} strokeWidth="10" strokeLinecap="round" />
      <path d="M128 40 A46 46 0 0 1 192 40" fill="none" stroke={`url(#${id}-cha)`} strokeWidth="10" strokeLinecap="round" />
    </g>
  ),
};

// ───────── 7. sightseeing tours: folded map + pin ─────────
const panels = [
  'M18 70 L70 52 L70 172 L18 190 Z',
  'M70 52 L130 70 L130 190 L70 172 Z',
  'M130 70 L182 52 L182 172 L130 190 Z',
];
const pinPath = 'M118 18 C140 18 154 34 154 54 C154 80 118 112 118 112 C118 112 82 80 82 54 C82 34 96 18 118 18 Z';
export const toursIcon: IconDef = {
  body: (
    <g fill="currentColor">
      {panels.map((d) => (
        <path key={d} d={d} />
      ))}
      <path d={pinPath} />
    </g>
  ),
  face: (id) => (
    <g>
      <Mats id={id} />
      <path d={panels[0]} fill={`url(#${id}-por)`} />
      <path d={panels[1]} fill="#E9E4DA" />
      <path d={panels[2]} fill={`url(#${id}-por)`} />
      <path d="M30 168 C56 150 64 128 92 132 C116 136 120 158 150 150 C164 146 170 128 174 118" fill="none" stroke={`url(#${id}-cha)`} strokeWidth="5" strokeDasharray="2 9" strokeLinecap="round" />
      <ellipse cx="118" cy="114" rx="16" ry="5" fill="#1C1C1E" opacity={0.18} />
      <path d={pinPath} fill={`url(#${id}-gra)`} />
      <circle cx="118" cy="52" r="15" fill={`url(#${id}-cha)`} />
      <path d="M98 40 Q104 28 116 26" stroke="#FFFFFF" strokeWidth="4" fill="none" strokeLinecap="round" opacity={0.5} />
    </g>
  ),
};

// ───────── two hearts (ticket ribbon) ─────────
const heart = 'M50 88 C20 66 6 48 6 32 C6 18 17 8 30 8 C39 8 46 13 50 20 C54 13 61 8 70 8 C83 8 94 18 94 32 C94 48 80 66 50 88 Z';
export const heartsIcon: IconDef = {
  body: (
    <g fill="currentColor">
      <g transform="translate(14 46) scale(1.15) rotate(-12 50 50)">
        <path d={heart} />
      </g>
      <g transform="translate(76 22) scale(1.05) rotate(10 50 50)">
        <path d={heart} />
      </g>
    </g>
  ),
  face: (id) => (
    <g>
      <Mats id={id} />
      <g transform="translate(76 22) scale(1.05) rotate(10 50 50)">
        <path d={heart} fill={`url(#${id}-por)`} />
        <path d="M18 30 Q20 16 32 15" stroke="#FFFFFF" strokeWidth="6" fill="none" strokeLinecap="round" />
      </g>
      <g transform="translate(14 46) scale(1.15) rotate(-12 50 50)">
        <path d={heart} fill={`url(#${id}-cha)`} />
        <path d="M18 30 Q20 16 32 15" stroke="#FFFFFF" strokeWidth="6" fill="none" strokeLinecap="round" opacity={0.85} />
      </g>
    </g>
  ),
};

export const FEATURE_ICONS: IconDef[] = [hotelIcon, breakfastIcon, flightIcon, carIcon, vipIcon, simIcon, toursIcon];
