import React from 'react';
import {COLORS, EVENTS} from '../data';
import {CameraState, threadCurve, threadHead} from '../lib/camera';
import {viewWindow, Win, WindowSvg} from './WindowSvg';
import {clamp, smoothstep} from '../lib/math';

const L = threadCurve.length;
const GAP = L * 2;

/** [a, b] sub-range of the thread as a dash. */
export const dashRange = (a: number, b: number) => ({
  strokeDasharray: `${Math.max(0.01, b - a)} ${GAP}`,
  strokeDashoffset: -a,
});

/** The whole thread, drawn up to its head, sitting under the stations. */
export const ThreadLine: React.FC<{frame: number; cam: CameraState}> = ({frame, cam}) => {
  const head = threadHead(frame);
  const p = threadCurve.pointAt(head);
  const pulse = 0.85 + 0.15 * Math.sin(frame / 4.2);
  const common = {d: threadCurve.d, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
  return (
    <WindowSvg win={viewWindow(cam.x, cam.y, cam.zoom)}>
      <defs>
        <radialGradient id="th-glow">
          <stop offset="0" stopColor={COLORS.white} stopOpacity={1} />
          <stop offset="0.18" stopColor={COLORS.champagneLight} stopOpacity={0.95} />
          <stop offset="0.5" stopColor={COLORS.champagne} stopOpacity={0.45} />
          <stop offset="1" stopColor={COLORS.champagne} stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* soft champagne glow */}
      <path {...common} stroke={COLORS.champagne} strokeOpacity={0.45} strokeWidth={26} {...dashRange(0, head)} />
      <path {...common} stroke={COLORS.champagne} strokeOpacity={0.75} strokeWidth={11} {...dashRange(0, head)} />
      {/* core + bright filament */}
      <path {...common} stroke={COLORS.champagneDeep} strokeWidth={3.4} {...dashRange(0, head)} />
      <path {...common} stroke="#FFF8E8" strokeOpacity={0.9} strokeWidth={1.2} {...dashRange(0, head)} />
      {/* comet tail near the head */}
      <path {...common} stroke={COLORS.champagneLight} strokeOpacity={0.35} strokeWidth={20} {...dashRange(head - 620, head)} />
      <path {...common} stroke={COLORS.white} strokeOpacity={0.45} strokeWidth={9} {...dashRange(head - 300, head)} />
      <path {...common} stroke={COLORS.white} strokeOpacity={0.8} strokeWidth={4} {...dashRange(head - 120, head)} />
      {/* light point */}
      <circle cx={p.x} cy={p.y} r={70 * pulse} fill="url(#th-glow)" opacity={0.85} />
      <circle cx={p.x} cy={p.y} r={9} fill={COLORS.white} />
      <g transform={`translate(${p.x} ${p.y}) rotate(${frame * 2})`} opacity={0.9}>
        <path d="M0 -26 L2 -2 L26 0 L2 2 L0 26 L-2 2 L-26 0 L-2 -2 Z" fill={COLORS.white} />
      </g>
    </WindowSvg>
  );
};

/** Same thread drawn on top of an object (used for the part that comes out of the ticket eyelet). */
export const ThreadFront: React.FC<{frame: number; from: number; to: number; win: Win}> = ({frame, from, to, win}) => {
  const head = threadHead(frame);
  const b = Math.min(to, head);
  if (b <= from) return null;
  const common = {d: threadCurve.d, fill: 'none', strokeLinecap: 'round' as const};
  return (
    <WindowSvg win={win}>
      <path {...common} stroke={COLORS.champagne} strokeOpacity={0.55} strokeWidth={14} {...dashRange(from, b)} />
      <path {...common} stroke={COLORS.champagneDeep} strokeWidth={3.4} {...dashRange(from, b)} />
      <path {...common} stroke="#FFF8E8" strokeOpacity={0.9} strokeWidth={1.2} {...dashRange(from, b)} />
      {head <= to && (
        <>
          <circle cx={threadCurve.pointAt(head).x} cy={threadCurve.pointAt(head).y} r={46} fill="url(#th-front-glow)" />
          <circle cx={threadCurve.pointAt(head).x} cy={threadCurve.pointAt(head).y} r={8} fill={COLORS.white} />
        </>
      )}
      <defs>
        <radialGradient id="th-front-glow">
          <stop offset="0" stopColor={COLORS.white} stopOpacity={1} />
          <stop offset="0.3" stopColor={COLORS.champagne} stopOpacity={0.7} />
          <stop offset="1" stopColor={COLORS.champagne} stopOpacity={0} />
        </radialGradient>
      </defs>
    </WindowSvg>
  );
};

/** Small porcelain airliner riding the head of the thread across the passport stamps. */
export const PlaneRider: React.FC<{frame: number}> = ({frame}) => {
  const [a, b] = EVENTS.planeVisible;
  if (frame < a - 2 || frame > b + 2) return null;
  const vis = smoothstep(a, a + 10, frame) * (1 - smoothstep(b - 10, b, frame));
  const head = threadHead(frame);
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
