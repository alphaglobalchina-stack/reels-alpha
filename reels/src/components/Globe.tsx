import React from 'react';
import {geoContains, geoDistance, geoGraticule10, geoInterpolate, geoOrthographic, geoPath} from 'd3-geo';
import {feature} from 'topojson-client';
import type {Topology} from 'topojson-specification';
import landTopo from 'world-atlas/land-110m.json';
import {theme} from '../theme';

type LL = [number, number];

let LAND_DOTS: LL[] | null = null;

/** Evenly spaced dots on land (computed once per tab). */
const landDots = (): LL[] => {
  if (LAND_DOTS) return LAND_DOTS;
  const topo = landTopo as unknown as Topology;
  const land = feature(topo, topo.objects.land);
  const out: LL[] = [];
  const step = 2.35;
  for (let lat = -58; lat <= 80; lat += step) {
    const n = Math.max(1, Math.round((360 * Math.cos((lat * Math.PI) / 180)) / step));
    for (let i = 0; i < n; i++) {
      const lon = -180 + ((i + (Math.round(lat / step) % 2 ? 0.5 : 0)) * 360) / n;
      if (geoContains(land, [lon, lat])) out.push([lon, lat]);
    }
  }
  LAND_DOTS = out;
  return out;
};

export type Arc = {from: LL; p: number};

/**
 * Dotted orthographic globe. `rotate` is the d3 rotation ([-lon, -lat] of the centre),
 * `reveal` grows the dots out from the centre, `arcs` are trade routes into `target`.
 */
export const Globe: React.FC<{
  cx: number;
  cy: number;
  r: number;
  rotate: LL;
  reveal: number;
  ring: number;
  arcs: Arc[];
  target: LL;
  targetPulse: number;
  frame: number;
}> = ({cx, cy, r, rotate, reveal, ring, arcs, target, targetPulse, frame}) => {
  const proj = geoOrthographic().scale(r).translate([cx, cy]).rotate([rotate[0], rotate[1], 0]).clipAngle(90);
  const centre: LL = [-rotate[0], -rotate[1]];
  const dots = landDots();

  // three brightness bands by facing angle → depth without lighting maths
  const bands = ['', '', ''];
  const revealR = reveal * r * 1.08;
  for (const d of dots) {
    const dist = geoDistance(d, centre);
    if (dist > Math.PI / 2) continue;
    const p = proj(d);
    if (!p) continue;
    if (Math.hypot(p[0] - cx, p[1] - cy) > revealR) continue;
    const b = dist < 0.75 ? 0 : dist < 1.2 ? 1 : 2;
    bands[b] += `M${p[0].toFixed(1)} ${p[1].toFixed(1)}h0`;
  }

  const grat = geoPath(proj)(geoGraticule10()) ?? '';

  const lifted = (pt: LL, h: number): [number, number] | null => {
    const p = proj(pt);
    if (!p) return null;
    return [cx + (p[0] - cx) * (1 + h), cy + (p[1] - cy) * (1 + h)];
  };

  const gold = theme.colors.gold;
  const red = '#E8402F';
  const tp = lifted(target, 0);

  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      <defs>
        <radialGradient id="atmo" cx="50%" cy="50%" r="50%">
          <stop offset="0.82" stopColor={gold} stopOpacity="0" />
          <stop offset="0.92" stopColor={gold} stopOpacity="0.18" />
          <stop offset="1" stopColor={gold} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="body" cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor="#2a2110" stopOpacity="0.9" />
          <stop offset="0.7" stopColor="#120f08" stopOpacity="0.85" />
          <stop offset="1" stopColor="#050505" stopOpacity="0.9" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r * 1.16 * ring} fill="url(#atmo)" />
      <circle cx={cx} cy={cy} r={r * ring} fill="url(#body)" />
      <path d={grat} fill="none" stroke={gold} strokeOpacity={0.1 * reveal} strokeWidth={1.2} />
      <path d={bands[2]} stroke={gold} strokeOpacity={0.35} strokeWidth={r * 0.0105} strokeLinecap="round" />
      <path d={bands[1]} stroke={theme.colors.goldLight} strokeOpacity={0.62} strokeWidth={r * 0.0125} strokeLinecap="round" />
      <path d={bands[0]} stroke={theme.colors.goldLight} strokeOpacity={0.95} strokeWidth={r * 0.0135} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={r * ring} fill="none" stroke={gold} strokeWidth={2.5} strokeOpacity={0.85} />

      {arcs.map((a, i) => {
        if (a.p <= 0) return null;
        const interp = geoInterpolate(a.from, target);
        const span = geoDistance(a.from, target);
        const N = 44;
        const upto = Math.max(1, Math.round(a.p * N));
        let d = '';
        let pen = false;
        let head: [number, number] | null = null;
        for (let k = 0; k <= upto; k++) {
          const t = k / N;
          const pt = interp(t) as LL;
          const h = Math.sin(Math.PI * t) * (0.06 + span * 0.12);
          const vis = geoDistance(pt, centre) < Math.PI / 2 + h * 0.9;
          const s = lifted(pt, h);
          if (!vis || !s) {
            pen = false;
            continue;
          }
          d += `${pen ? 'L' : 'M'}${s[0].toFixed(1)} ${s[1].toFixed(1)}`;
          pen = true;
          head = s;
        }
        const src = geoDistance(a.from, centre) < Math.PI / 2 ? lifted(a.from, 0) : null;
        return (
          <g key={i}>
            <path d={d} fill="none" stroke={gold} strokeWidth={3.2} strokeLinecap="round" style={{filter: `drop-shadow(0 0 6px ${gold})`}} />
            {src && <circle cx={src[0]} cy={src[1]} r={6} fill={red} />}
            {head && a.p < 1 && <circle cx={head[0]} cy={head[1]} r={7} fill="#FFF3C8" style={{filter: `drop-shadow(0 0 10px ${theme.colors.goldLight})`}} />}
          </g>
        );
      })}

      {tp && geoDistance(target, centre) < Math.PI / 2 && targetPulse > 0 && (
        <g>
          {[0, 1, 2].map((k) => {
            const ph = ((frame + k * 9) % 27) / 27;
            return <circle key={k} cx={tp[0]} cy={tp[1]} r={10 + ph * 46} fill="none" stroke={red} strokeWidth={3} opacity={(1 - ph) * targetPulse} />;
          })}
          <circle cx={tp[0]} cy={tp[1]} r={11 * targetPulse} fill={red} style={{filter: `drop-shadow(0 0 12px ${red})`}} />
        </g>
      )}
    </svg>
  );
};
