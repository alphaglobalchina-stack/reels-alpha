import React from 'react';
import {COLORS, EVENTS, FONTS, LAYOUT, TEXT} from '../data';
import {CameraState} from '../lib/camera';
import {clamp, easeOutCubic, rand, smoothstep} from '../lib/math';
import {DigitColumn} from '../components/Odometer';
import {WindowSvg} from '../layers/WindowSvg';
import {Station} from './Station';

const P = LAYOUT.price;
const R = P.d / 2;
const NUM = 196; // Sora size of 5,950

// slot-machine style: every column lands at the same moment, faster columns spin extra turns
const COLUMNS = [
  {target: 5, turns: 0},
  {target: 9, turns: 1},
  {target: 5, turns: 2},
  {target: 0, turns: 3},
];

const digitStyle: React.CSSProperties = {
  backgroundImage: 'linear-gradient(180deg, #FFF6DF 0%, #EBD6A6 55%, #CDAE70 100%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
};

// coins burst from behind the rim of the disc and fall away — they never cross the number
const coins = Array.from({length: 40}, (_, i) => {
  const a = Math.PI + 0.12 + rand(i + 3) * (Math.PI - 0.24); // upper half of the rim
  const sp = 4 + rand(i + 17) * 6;
  return {
    t0: EVENTS.coins.from + rand(i + 7) * (EVENTS.coins.to - EVENTS.coins.from - 30),
    x: P.x + Math.cos(a) * (R - 40),
    y: P.y + Math.sin(a) * (R - 40),
    vx: Math.cos(a) * sp,
    vy: Math.sin(a) * sp - 3,
    r: 9 + rand(i + 23) * 9,
    spin: 0.18 + rand(i + 29) * 0.3,
    ph: rand(i + 31) * 6.28,
  };
});

const Coins: React.FC<{frame: number}> = ({frame}) => (
  <WindowSvg win={{x: P.x - 700, y: P.y - 900, w: 1400, h: 1500}}>
    <defs>
      <linearGradient id="coin-face" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#FFF4D6" />
        <stop offset="0.5" stopColor="#E3C78E" />
        <stop offset="1" stopColor="#B8975A" />
      </linearGradient>
    </defs>
    {coins.map((c, i) => {
      const t = frame - c.t0;
      if (t < 0 || t > 44) return null;
      const x = c.x + c.vx * t;
      const y = c.y + c.vy * t + 0.3 * t * t;
      const o = clamp(t / 4) * (1 - smoothstep(26, 44, t));
      const sx = Math.abs(Math.cos(c.ph + t * c.spin));
      return (
        <g key={i} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(c.ph * 40 + t * 3).toFixed(1)})`} opacity={o}>
          <ellipse rx={c.r * Math.max(0.12, sx)} ry={c.r} fill="url(#coin-face)" stroke="#B8975A" strokeWidth={1} />
          <ellipse rx={c.r * Math.max(0.12, sx) * 0.62} ry={c.r * 0.62} fill="none" stroke="#FFF6DF" strokeWidth={1.2} opacity={0.8} />
        </g>
      );
    })}
  </WindowSvg>
);

/** Station 5 — the only dark element: a large graphite disc with the price counting up. */
export const PriceStation: React.FC<{frame: number; cam: CameraState}> = ({frame, cam}) => {
  const c = EVENTS.priceCount;
  const k = easeOutCubic(clamp((frame - c.from) / (c.to - c.from)));
  const shine = clamp((frame - EVENTS.priceShine) / 22);
  const landed = smoothstep(c.to - 4, c.to + 6, frame);
  const breathe = 1 + 0.008 * Math.sin(frame / 18);
  return (
    <Station cam={cam} top={P.y - R - 700} bottom={P.y + R + 200} focus={{x: P.x, y: P.y}}>
      <Coins frame={frame} />
      <div
        style={{
          position: 'absolute',
          left: P.x - R,
          top: P.y - R,
          width: P.d,
          height: P.d,
          borderRadius: '50%',
          transform: `scale(${breathe})`,
          background: 'radial-gradient(circle at 38% 28%, #34343A 0%, #232326 45%, #1C1C1E 70%, #141416 100%)',
          boxShadow: `0 50px 90px rgba(28,28,30,0.28), 0 12px 24px rgba(28,28,30,0.16), 0 0 0 ${3 + 6 * landed}px rgba(232,217,181,${0.25 + 0.35 * landed}), 0 0 ${60 + 70 * landed}px rgba(232,217,181,${0.35 + 0.3 * landed})`,
          overflow: 'hidden',
        }}
      >
        {/* fine champagne rings */}
        <svg width={P.d} height={P.d} style={{position: 'absolute', inset: 0}}>
          <circle cx={R} cy={R} r={R - 30} fill="none" stroke={COLORS.champagne} strokeOpacity={0.35} strokeWidth={1.5} />
          <circle cx={R} cy={R} r={R - 42} fill="none" stroke={COLORS.champagne} strokeOpacity={0.18} strokeWidth={1} strokeDasharray="2 10" />
        </svg>
        {/* number */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: R - NUM * 0.72,
            display: 'flex',
            justifyContent: 'center',
            direction: 'ltr',
          }}
        >
          <DigitColumn value={COLUMNS[0].target * k} size={NUM} width={NUM * 0.66} style={{}} digitStyle={digitStyle} />
          <span style={{fontFamily: FONTS.latin, fontWeight: 700, fontSize: NUM, lineHeight: `${NUM * 1.12}px`, width: NUM * 0.3, textAlign: 'center', ...digitStyle}}>,</span>
          {COLUMNS.slice(1).map((col, i) => (
            <DigitColumn key={i} value={(col.target + col.turns * 10) * k} size={NUM} width={NUM * 0.66} digitStyle={digitStyle} />
          ))}
        </div>
        {/* currency */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: R + NUM * 0.52,
            textAlign: 'center',
            direction: 'rtl',
            fontFamily: FONTS.arabic,
            fontWeight: 500,
            fontSize: 66,
            color: COLORS.champagne,
            lineHeight: 1.2,
          }}
        >
          {TEXT.price.currency}
        </div>
        <svg width={P.d} height={40} style={{position: 'absolute', left: 0, top: R - NUM * 0.72 - 64}}>
          <line x1={R - 120} y1={20} x2={R - 22} y2={20} stroke={COLORS.champagne} strokeOpacity={0.6} strokeWidth={2} />
          <line x1={R + 22} y1={20} x2={R + 120} y2={20} stroke={COLORS.champagne} strokeOpacity={0.6} strokeWidth={2} />
          <rect x={R - 8} y={12} width={16} height={16} transform={`rotate(45 ${R} 20)`} fill={COLORS.champagne} />
        </svg>
        {/* light sweep */}
        {shine > 0 && shine < 1 && (
          <div
            style={{
              position: 'absolute',
              top: -P.d * 0.25,
              left: -P.d * 0.6 + shine * P.d * 1.7,
              width: P.d * 0.32,
              height: P.d * 1.5,
              transform: 'rotate(22deg)',
              background: 'linear-gradient(90deg, rgba(255,246,223,0) 0%, rgba(255,246,223,0.20) 40%, rgba(255,250,236,0.42) 50%, rgba(255,246,223,0.20) 60%, rgba(255,246,223,0) 100%)',
              mixBlendMode: 'screen',
            }}
          />
        )}
      </div>
    </Station>
  );
};
