import React from 'react';
import {COLORS, EVENTS, THREAD} from '../data';
import {CameraState, threadCurve, threadHead} from '../lib/camera';
import {viewWindow, Win, WindowSvg} from './WindowSvg';
import {clamp, smoothstep} from '../lib/math';

const L = threadCurve.length;
const GAP = L * 2;

/** Arc length of the glowing head at a frame (THREAD.head in data.ts starts it above the Reels UI band). */
export const headAt = (frame: number) => threadHead(frame);

/** [a, b] sub-range of the thread as a dash. */
export const dashRange = (a: number, b: number) => ({
  strokeDasharray: `${Math.max(0.01, b - a)} ${GAP}`,
  strokeDashoffset: -a,
});

const common = {d: threadCurve.d, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};

/** Glow under the line: wide champagne halo (~44 px, 0.35) + warm glow (~18 px, 0.7). */
const ThreadGlow: React.FC<{a: number; b: number; halo?: boolean}> = ({a, b, halo = true}) => {
  const r = dashRange(a, b);
  return (
    <>
      {halo && <path {...common} stroke={COLORS.champagne} strokeOpacity={0.35} strokeWidth={44} {...r} />}
      <path {...common} stroke={COLORS.threadGlow} strokeOpacity={0.7} strokeWidth={18} {...r} />
    </>
  );
};

/** The line itself: ~6 px warm gold core + ~2 px bright filament. */
const ThreadCore: React.FC<{a: number; b: number}> = ({a, b}) => {
  const r = dashRange(a, b);
  return (
    <>
      <path {...common} stroke={COLORS.threadCore} strokeWidth={6} {...r} />
      <path {...common} stroke="#FFF8E8" strokeOpacity={0.95} strokeWidth={2} {...r} />
    </>
  );
};

/** [a, b] clamped to [from, to]; null when empty (an empty dash still draws a round-capped dot). */
const seg = (a: number, b: number, from: number, to: number) => {
  const x = Math.max(a, from);
  const y = Math.min(b, to);
  return y - x > 0.5 ? dashRange(x, y) : null;
};

// comet bloom under the core: overlapping stretches, each a little whiter → a smooth ramp to the head
const BLOOM: [number, number, number][] = [
  [950, 40, 0.13],
  [720, 36, 0.14],
  [520, 32, 0.15],
  [360, 28, 0.17],
  [230, 24, 0.2],
  [120, 20, 0.24],
];

/** Bright comet near the head: white bloom under the line, white-hot filament on top. */
const CometBloom: React.FC<{head: number; from?: number; to?: number}> = ({head, from = -Infinity, to = Infinity}) => (
  <>
    {BLOOM.map(([len, w, o]) => {
      const r = seg(head - len, head, from, to);
      return r ? <path key={len} {...common} stroke={COLORS.white} strokeOpacity={o} strokeWidth={w} {...r} /> : null;
    })}
  </>
);
const CometHot: React.FC<{head: number; from?: number; to?: number}> = ({head, from = -Infinity, to = Infinity}) => {
  const r1 = seg(head - 260, head, from, to);
  const r2 = seg(head - 110, head, from, to);
  return (
    <>
      {r1 && <path {...common} stroke={COLORS.white} strokeOpacity={0.75} strokeWidth={3} {...r1} />}
      {r2 && <path {...common} stroke={COLORS.white} strokeOpacity={0.95} strokeWidth={4.2} {...r2} />}
    </>
  );
};

const HeadGlow: React.FC<{id: string}> = ({id}) => (
  <radialGradient id={id}>
    <stop offset="0" stopColor={COLORS.white} stopOpacity={1} />
    <stop offset="0.12" stopColor="#FFFDF6" stopOpacity={0.96} />
    <stop offset="0.3" stopColor="#FFF4DC" stopOpacity={0.72} />
    <stop offset="0.55" stopColor={COLORS.champagneLight} stopOpacity={0.4} />
    <stop offset="0.8" stopColor={COLORS.champagne} stopOpacity={0.12} />
    <stop offset="1" stopColor={COLORS.champagne} stopOpacity={0} />
  </radialGradient>
);

/** The light point at the head (glow r ≈ 90, white core, slowly turning 4-point star). */
const LightPoint: React.FC<{x: number; y: number; frame: number; glowId: string; scale?: number}> = ({x, y, frame, glowId, scale = 1}) => {
  const pulse = 0.88 + 0.12 * Math.sin(frame / 4.2);
  return (
    <>
      <circle cx={x} cy={y} r={92 * pulse * scale} fill={`url(#${glowId})`} />
      <circle cx={x} cy={y} r={12 * scale} fill={COLORS.white} />
      <g transform={`translate(${x} ${y}) rotate(${frame * 2}) scale(${scale})`} opacity={0.95}>
        <path d="M0 -34 L2.6 -2.6 L34 0 L2.6 2.6 L0 34 L-2.6 2.6 L-34 0 L-2.6 -2.6 Z" fill={COLORS.white} />
      </g>
    </>
  );
};

/** The whole thread, drawn up to its head, sitting under the stations. */
export const ThreadLine: React.FC<{frame: number; cam: CameraState}> = ({frame, cam}) => {
  const head = headAt(frame);
  const p = threadCurve.pointAt(head);
  return (
    <WindowSvg win={viewWindow(cam.x, cam.y, cam.zoom)}>
      <defs>
        <HeadGlow id="th-glow" />
      </defs>
      <ThreadGlow a={0} b={head} />
      <CometBloom head={head} />
      <ThreadCore a={0} b={head} />
      <CometHot head={head} />
      <LightPoint x={p.x} y={p.y} frame={frame} glowId="th-glow" />
    </WindowSvg>
  );
};

/** Same thread drawn on top of an object (used for the part that comes out of the ticket eyelet). */
export const ThreadFront: React.FC<{frame: number; from: number; to: number; win: Win}> = ({frame, from, to, win}) => {
  const head = headAt(frame);
  const b = Math.min(to, head);
  if (b <= from) return null;
  const hp = threadCurve.pointAt(head);
  return (
    <WindowSvg win={win}>
      <defs>
        <HeadGlow id="th-front-glow" />
      </defs>
      {/* the wide halo starts a little after the eyelet so it does not wash over the grommet */}
      <ThreadGlow a={from} b={b} halo={false} />
      {b - from > 16 && <path {...common} stroke={COLORS.champagne} strokeOpacity={0.3} strokeWidth={30} {...dashRange(from + 14, b)} />}
      <CometBloom head={head} from={from} to={b} />
      <ThreadCore a={from} b={b} />
      <CometHot head={head} from={from} to={b} />
      {head <= to && <LightPoint x={hp.x} y={hp.y} frame={frame} glowId="th-front-glow" scale={0.8} />}
    </WindowSvg>
  );
};

/** Small porcelain airliner riding the head of the thread across the passport stamps. */
export const PlaneRider: React.FC<{frame: number}> = ({frame}) => {
  const [a, b] = EVENTS.planeVisible;
  if (frame < a - 2 || frame > b + 2) return null;
  const vis = smoothstep(a, a + 10, frame) * (1 - smoothstep(b - 10, b, frame));
  const head = headAt(frame);
  const p = threadCurve.pointAt(head - 6);
  const ang = (threadCurve.angleAt(head) * 180) / Math.PI + 90; // plane drawn nose-up
  const ang2 = (threadCurve.angleAt(head + 40) * 180) / Math.PI + 90;
  const turn = clamp(((((ang2 - ang + 540) % 360) - 180) / 25), -1, 1);
  const bank = 1 - 0.28 * Math.abs(turn);
  const s = 0.85 + 0.55 * vis;
  return (
    <WindowSvg win={{x: Math.floor(p.x - 220), y: Math.floor(p.y - 220), w: 440, h: 440}}>
      <g transform={`translate(${p.x} ${p.y}) rotate(${ang}) scale(${s})`} opacity={vis}>
        {/* cast shadow on the page */}
        <g transform="translate(26 34) scale(0.96)" opacity={0.16}>
          <PlaneShape fill="#1C1C1E" />
        </g>
        <g transform={`scale(${bank} 1)`}>
          <PlaneShape />
        </g>
      </g>
    </WindowSvg>
  );
};

const PlaneShape: React.FC<{fill?: string}> = ({fill}) => (
  <g transform="translate(-60 -64)">
    <defs>
      <linearGradient id="pl-body" x1="0" x2="1">
        <stop offset="0" stopColor="#E6E1D8" />
        <stop offset="0.45" stopColor="#FFFFFF" />
        <stop offset="1" stopColor="#D9D3C8" />
      </linearGradient>
      <linearGradient id="pl-wing" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#FFFFFF" />
        <stop offset="1" stopColor="#E3DCCD" />
      </linearGradient>
    </defs>
    {/* wings */}
    <path d="M60 46 L4 78 L4 88 L60 70 L116 88 L116 78 Z" fill={fill ?? 'url(#pl-wing)'} />
    {/* tailplane */}
    <path d="M60 104 L36 120 L36 126 L60 118 L84 126 L84 120 Z" fill={fill ?? 'url(#pl-wing)'} />
    {/* engines */}
    {!fill && (
      <>
        <rect x="28" y="66" width="9" height="18" rx="4" fill={COLORS.champagneDeep} />
        <rect x="83" y="66" width="9" height="18" rx="4" fill={COLORS.champagneDeep} />
      </>
    )}
    {/* fuselage */}
    <path d="M60 2 C68 2 71 16 71 30 L71 112 C71 122 66 128 60 128 C54 128 49 122 49 112 L49 30 C49 16 52 2 60 2 Z" fill={fill ?? 'url(#pl-body)'} />
    {!fill && (
      <>
        <path d="M55 14 Q60 10 65 14 L64 20 Q60 18 56 20 Z" fill="#2B2B2E" />
        <rect x="58.6" y="30" width="2.8" height="80" rx="1.4" fill={COLORS.champagne} />
      </>
    )}
  </g>
);
