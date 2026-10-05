import React from 'react';
import {COLORS} from '../data';

/**
 * Light frosted-glass surfaces that the stations stand on.
 * Everything is plain SVG gradients (no CSS blur filters): the long soft shadows are radial
 * gradients, the glass is a white fill with a soft champagne tint, a bright top-edge highlight
 * and a faint sheen. Coordinates are in the parent's coordinate system (world or station-local).
 */

export type GlassShadow = {
  /** centre offset from the glass centre */
  dx?: number;
  dy?: number;
  rx: number;
  ry: number;
  opacity?: number;
};

const SHADOW_RGB = COLORS.shadowRgb;

const shadowStops = (id: string, o: number) => (
  <radialGradient id={id}>
    <stop offset="0" stopColor={`rgb(${SHADOW_RGB})`} stopOpacity={o} />
    <stop offset="0.35" stopColor={`rgb(${SHADOW_RGB})`} stopOpacity={o * 0.62} />
    <stop offset="0.7" stopColor={`rgb(${SHADOW_RGB})`} stopOpacity={o * 0.2} />
    <stop offset="1" stopColor={`rgb(${SHADOW_RGB})`} stopOpacity={0} />
  </radialGradient>
);

/** Soft diffused shadows only (radial gradients). Handy under objects that have no glass. */
export const SoftShadows: React.FC<{id: string; cx: number; cy: number; shadows: GlassShadow[]; style?: React.CSSProperties}> = ({id, cx, cy, shadows, style}) => {
  const xs = shadows.flatMap((s) => [cx + (s.dx ?? 0) - s.rx, cx + (s.dx ?? 0) + s.rx]);
  const ys = shadows.flatMap((s) => [cy + (s.dy ?? 0) - s.ry, cy + (s.dy ?? 0) + s.ry]);
  const x0 = Math.floor(Math.min(...xs));
  const y0 = Math.floor(Math.min(...ys));
  const w = Math.ceil(Math.max(...xs)) - x0;
  const h = Math.ceil(Math.max(...ys)) - y0;
  return (
    <svg width={w} height={h} viewBox={`${x0} ${y0} ${w} ${h}`} style={{position: 'absolute', left: x0, top: y0, overflow: 'visible', pointerEvents: 'none', ...style}}>
      <defs>{shadows.map((s, i) => shadowStops(`${id}-sh${i}`, s.opacity ?? 0.1))}</defs>
      {shadows.map((s, i) => (
        <ellipse key={i} cx={cx + (s.dx ?? 0)} cy={cy + (s.dy ?? 0)} rx={s.rx} ry={s.ry} fill={`url(#${id}-sh${i})`} />
      ))}
    </svg>
  );
};

/**
 * A glass plinth seen in perspective: an elliptical top surface (rx, ry) with a thin glass
 * edge (thickness) under it, a bright top-edge highlight, a soft champagne tint, a faint sheen
 * and long soft shadows. `glow` (0…1) lights the glass up in champagne (e.g. when a stamp lands).
 * `reflection` is drawn on the top surface, clipped to it (e.g. a mirrored object).
 */
export const GlassPlinth: React.FC<{
  id: string;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  thickness?: number;
  shadows?: GlassShadow[];
  sheen?: number;
  glow?: number;
  opacity?: number;
  reflection?: React.ReactNode;
  style?: React.CSSProperties;
}> = ({id, cx, cy, rx, ry, thickness = 8, shadows = [], sheen = 1, glow = 0, opacity = 1, reflection, style}) => {
  const th = thickness;
  const xs = [cx - rx - 6, cx + rx + 6, ...shadows.flatMap((s) => [cx + (s.dx ?? 0) - s.rx, cx + (s.dx ?? 0) + s.rx])];
  const ys = [cy - ry - 6, cy + ry + th + 6, ...shadows.flatMap((s) => [cy + (s.dy ?? 0) - s.ry, cy + (s.dy ?? 0) + s.ry])];
  const x0 = Math.floor(Math.min(...xs));
  const y0 = Math.floor(Math.min(...ys));
  const w = Math.ceil(Math.max(...xs)) - x0;
  const h = Math.ceil(Math.max(...ys)) - y0;
  // outline of the glass edge band: lower half of the top ellipse pushed down by `th`
  const band = `M${cx - rx} ${cy} A${rx} ${ry} 0 0 0 ${cx + rx} ${cy} L${cx + rx} ${cy + th} A${rx} ${ry} 0 0 1 ${cx - rx} ${cy + th} Z`;
  const frontRim = `M${cx - rx} ${cy + th} A${rx} ${ry} 0 0 0 ${cx + rx} ${cy + th}`;
  const backRim = `M${cx - rx} ${cy} A${rx} ${ry} 0 0 1 ${cx + rx} ${cy}`;
  return (
    <svg
      width={w}
      height={h}
      viewBox={`${x0} ${y0} ${w} ${h}`}
      style={{position: 'absolute', left: x0, top: y0, overflow: 'visible', opacity, pointerEvents: 'none', ...style}}
    >
      <defs>
        {shadows.map((s, i) => shadowStops(`${id}-sh${i}`, s.opacity ?? 0.1))}
        <linearGradient id={`${id}-band`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#E4DED3" />
          <stop offset="0.22" stopColor="#F6F2EA" />
          <stop offset="0.5" stopColor="#FFFFFF" />
          <stop offset="0.78" stopColor="#F3EEE4" />
          <stop offset="1" stopColor="#DDD5C7" />
        </linearGradient>
        <radialGradient id={`${id}-top`} cx="0.5" cy="0.38" r="0.62">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.78} />
          <stop offset="0.6" stopColor="#FFFFFF" stopOpacity={0.5} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0.3} />
        </radialGradient>
        <radialGradient id={`${id}-tint`} cx="0.5" cy="0.62" r="0.6">
          <stop offset="0" stopColor={COLORS.champagne} stopOpacity={0.1 + 0.4 * glow} />
          <stop offset="0.7" stopColor={COLORS.champagne} stopOpacity={0.22 + 0.25 * glow} />
          <stop offset="1" stopColor={COLORS.champagneDeep} stopOpacity={0.3} />
        </radialGradient>
        <linearGradient id={`${id}-edge`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={COLORS.white} stopOpacity={0.25} />
          <stop offset="0.3" stopColor={COLORS.white} stopOpacity={1} />
          <stop offset="0.7" stopColor={COLORS.white} stopOpacity={1} />
          <stop offset="1" stopColor={COLORS.white} stopOpacity={0.25} />
        </linearGradient>
        <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="1" y2="0.35">
          <stop offset="0.18" stopColor="#FFFFFF" stopOpacity={0} />
          <stop offset="0.3" stopColor="#FFFFFF" stopOpacity={0.75 * sheen} />
          <stop offset="0.38" stopColor="#FFFFFF" stopOpacity={0} />
          <stop offset="0.5" stopColor="#FFFFFF" stopOpacity={0} />
          <stop offset="0.56" stopColor="#FFFFFF" stopOpacity={0.4 * sheen} />
          <stop offset="0.6" stopColor="#FFFFFF" stopOpacity={0} />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry} />
        </clipPath>
      </defs>
      {/* long soft diffused shadows */}
      {shadows.map((s, i) => (
        <ellipse key={i} cx={cx + (s.dx ?? 0)} cy={cy + (s.dy ?? 0)} rx={s.rx} ry={s.ry} fill={`url(#${id}-sh${i})`} />
      ))}
      {/* glass edge (thickness) */}
      {th > 0 && (
        <>
          <path d={band} fill={`url(#${id}-band)`} />
          <path d={band} fill={COLORS.champagne} opacity={0.18 + 0.3 * glow} />
          <path d={frontRim} fill="none" stroke={COLORS.champagneDeep} strokeOpacity={0.35} strokeWidth={1.2} />
        </>
      )}
      {/* top surface: white frost + champagne tint */}
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={COLORS.glassFill} />
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#${id}-top)`} />
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={COLORS.glassTint} />
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#${id}-tint)`} />
      {/* reflection + faint sheen on the surface */}
      <g clipPath={`url(#${id}-clip)`}>
        {reflection}
        {sheen > 0 && <rect x={cx - rx} y={cy - ry} width={rx * 2} height={ry * 2} fill={`url(#${id}-sheen)`} />}
      </g>
      {/* fine rim: champagne hairline all round, bright glassEdge highlight on the far (top) edge */}
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke={COLORS.champagneDeep} strokeOpacity={0.28} strokeWidth={1.2} />
      <path d={backRim} fill="none" stroke={`url(#${id}-edge)`} strokeWidth={3} strokeLinecap="round" />
      <path d={backRim} fill="none" stroke={COLORS.glassEdge} strokeWidth={1.2} strokeLinecap="round" />
      {th > 0 && <path d={frontRim} fill="none" stroke={COLORS.glassEdge} strokeOpacity={0.9} strokeWidth={1.4} transform={`translate(0 ${-th + 1.5})`} />}
    </svg>
  );
};

/**
 * One subtle frosted-glass panel (rounded rectangle) — behind the booking contact rows.
 * Brightens what is behind it (higher text contrast), bright top edge, soft long shadow.
 */
export const GlassPanel: React.FC<{
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  r?: number;
  opacity?: number;
  style?: React.CSSProperties;
}> = ({id, x, y, w, h, r = 40, opacity = 1, style}) => {
  const pad = 140;
  const x0 = x - pad;
  const y0 = y - 40;
  const W = w + pad * 2;
  const H = h + 40 + 80;
  return (
    <svg width={W} height={H} viewBox={`${x0} ${y0} ${W} ${H}`} style={{position: 'absolute', left: x0, top: y0, overflow: 'visible', opacity, pointerEvents: 'none', ...style}}>
      <defs>
        {shadowStops(`${id}-sh0`, 0.1)}
        {shadowStops(`${id}-sh1`, 0.07)}
        <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0.25" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.78} />
          <stop offset="0.55" stopColor="#FFFFFF" stopOpacity={0.6} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0.5} />
        </linearGradient>
        <radialGradient id={`${id}-tint`} cx="0.82" cy="0.1" r="0.9">
          <stop offset="0" stopColor={COLORS.champagne} stopOpacity={0.3} />
          <stop offset="1" stopColor={COLORS.champagne} stopOpacity={0.06} />
        </radialGradient>
        <linearGradient id={`${id}-edge`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLORS.white} stopOpacity={1} />
          <stop offset="0.12" stopColor={COLORS.white} stopOpacity={0.55} />
          <stop offset="1" stopColor={COLORS.champagneDeep} stopOpacity={0.3} />
        </linearGradient>
        <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="1" y2="0.6">
          <stop offset="0.05" stopColor="#FFFFFF" stopOpacity={0} />
          <stop offset="0.16" stopColor="#FFFFFF" stopOpacity={0.35} />
          <stop offset="0.26" stopColor="#FFFFFF" stopOpacity={0} />
        </linearGradient>
      </defs>
      {/* long soft shadow (radial gradients, offset down) */}
      <ellipse cx={x + w / 2 + 40} cy={y + h - 6} rx={w * 0.62} ry={70} fill={`url(#${id}-sh0)`} />
      <ellipse cx={x + w / 2} cy={y + h * 0.62} rx={w * 0.6} ry={h * 0.62} fill={`url(#${id}-sh1)`} />
      {/* frosted glass */}
      <rect x={x} y={y} width={w} height={h} rx={r} fill={COLORS.glassFill} />
      <rect x={x} y={y} width={w} height={h} rx={r} fill={`url(#${id}-fill)`} />
      <rect x={x} y={y} width={w} height={h} rx={r} fill={`url(#${id}-tint)`} />
      <rect x={x} y={y} width={w} height={h} rx={r} fill={`url(#${id}-sheen)`} />
      {/* edges: bright top edge highlight, fine champagne hairline */}
      <rect x={x + 1} y={y + 1} width={w - 2} height={h - 2} rx={r - 1} fill="none" stroke={`url(#${id}-edge)`} strokeWidth={2} />
      <path d={`M${x + r} ${y + 1.5} L${x + w - r} ${y + 1.5}`} stroke={COLORS.glassEdge} strokeWidth={2.4} strokeLinecap="round" />
    </svg>
  );
};
