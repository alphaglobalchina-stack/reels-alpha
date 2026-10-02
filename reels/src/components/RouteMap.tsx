import React from 'react';
import {getLength, getPointAtLength, getTangentAtLength} from '@remotion/paths';
import {useCurrentFrame} from 'remotion';
import {theme} from '../theme';
import {easeInOut, easeOut, prog, smoothPath} from '../lib/anim';
import {
  ARABIA, CHINA, GUANGZHOU, GULF, HAINAN, INDIA, INDOCHINA, SEA_ROUTE, dotsPath, outlinePath, project,
} from '../lib/geo';
import {icons, IconNode} from './LineIcon';
import {ArabicText} from './ArabicText';
import {GoldDefs, useSafeId} from './Swoosh';

const W = 960;
const LON0 = 40, LON1 = 136, LAT1 = 55, LAT0 = -3;
const SX = W / (LON1 - LON0);
const SY = SX * 1.08;
const H = (LAT1 - LAT0) * SY;
const proj = project(LON0, LAT1, SX, SY);

// Geometry never changes between frames, so compute once.
const DOT_STEP = 1.15;
const chinaDots = dotsPath(CHINA, proj, DOT_STEP);
const hainanDots = dotsPath(HAINAN, proj, 0.9);
const indiaDots = dotsPath(INDIA, proj, DOT_STEP, [CHINA]);
const arabiaDots = dotsPath(ARABIA, proj, DOT_STEP);
const indoDots = dotsPath(INDOCHINA, proj, DOT_STEP, [CHINA]);
const chinaOutline = outlinePath(CHINA, proj);
const arabiaOutline = outlinePath(ARABIA, proj);
const [gx, gy] = proj(GUANGZHOU);
const [ux, uy] = proj(GULF);
const AIR = `M${gx} ${gy} Q ${(gx + ux) / 2 - 20} ${Math.min(gy, uy) - 250} ${ux} ${uy}`;
const SEA = smoothPath(SEA_ROUTE.map(proj), 0.5);
const AIR_LEN = getLength(AIR);
const SEA_LEN = getLength(SEA);

const Pin: React.FC<{x: number; y: number; t: number; label?: string; labelSide?: 'left' | 'right' | 'below'; pulse?: boolean}> = ({x, y, t, label, labelSide = 'below', pulse = true}) => {
  const appear = prog(t, 0, 14, easeOut);
  if (t < 0) return null;
  const pins = icons.pin;
  const cycle = (t % 48) / 48;
  return (
    <g transform={`translate(${x} ${y})`} opacity={appear}>
      {pulse && [0, 0.5].map((o) => {
        const c = (cycle + o) % 1;
        return <circle key={o} r={8 + c * 46} fill="none" stroke={theme.colors.gold} strokeWidth={3} opacity={(1 - c) * 0.9} />;
      })}
      <circle r={9} fill={theme.colors.gold} />
      <circle r={4} fill={theme.colors.black} />
      <g transform={`translate(-22 ${-72 + (1 - appear) * -24}) scale(1.85)`}>
        {pins.map(([tag, a], i) => React.createElement(tag, {key: i, ...a, fill: i === 0 ? theme.colors.gold : 'none', stroke: theme.colors.goldLight, strokeWidth: 1.3, strokeLinecap: 'round' as const}))}
      </g>
      {label && (
        <foreignObject x={labelSide === 'right' ? 26 : labelSide === 'below' ? -70 : -166} y={labelSide === 'below' ? 22 : -20} width={140} height={50} style={{overflow: 'visible'}}>
          <ArabicText size={34} weight={700} align={labelSide === 'right' ? 'right' : labelSide === 'below' ? 'center' : 'left'} style={{whiteSpace: 'nowrap'}}>
            {label}
          </ArabicText>
        </foreignObject>
      )}
    </g>
  );
};

const Mover: React.FC<{d: string; len: number; p: number; node: IconNode; size: number; rotate?: boolean; offsetAngle?: number}> = ({d, len, p, node, size, rotate, offsetAngle = 0}) => {
  if (p <= 0 || p > 1.0001) return null;
  const at = Math.min(len, p * len);
  const pt = getPointAtLength(d, at)!;
  const tg = getTangentAtLength(d, at)!;
  const ang = rotate ? (Math.atan2(tg.y, tg.x) * 180) / Math.PI + offsetAngle : 0;
  const bob = rotate ? 0 : Math.sin(p * 60) * 2.5;
  return (
    <g transform={`translate(${pt.x} ${pt.y + bob}) rotate(${ang}) scale(${size / 24}) translate(-12 -12)`}>
      <circle cx={12} cy={12} r={14} fill={theme.colors.black} opacity={0.85} />
      {node.map(([tag, a], i) => React.createElement(tag, {key: i, ...a, fill: 'none', stroke: theme.colors.goldLight, strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const}))}
    </g>
  );
};

/**
 * Minimal dotted map: China → Arabian Gulf. A gold arc (with plane) and a dashed sea
 * route (with ship) draw on; pins pulse on arrival. `t` = local frame.
 */
export const RouteMap: React.FC<{t?: number; labels?: {origin?: string; destination?: string}}> = ({t: tProp, labels}) => {
  const frame = useCurrentFrame();
  const t = tProp ?? frame;
  const id = useSafeId('rm');
  const sweep = prog(t, 0, 44, easeInOut); // dots reveal sweeps right → left
  const clipX = W * (1 - sweep);
  const air = prog(t, 40, 52, easeInOut);
  const sea = prog(t, 52, 62, easeInOut);
  const breathe = 0.55 + 0.15 * Math.sin(t / 9);
  const outline = prog(t, 4, 40, easeInOut);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{overflow: 'visible'}}>
      <GoldDefs id={id} />
      <defs>
        <clipPath id={`${id}c`}>
          <rect x={clipX} y={-100} width={W - clipX + 200} height={H + 200} />
        </clipPath>
        <mask id={`${id}m`}>
          <path d={SEA} stroke="#fff" strokeWidth={14} fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - sea} />
        </mask>
      </defs>
      <g clipPath={`url(#${id}c)`}>
        <g stroke={theme.colors.gold} strokeLinecap="round" fill="none">
          <path d={chinaDots + hainanDots} strokeWidth={4.2} opacity={breathe + 0.3} />
          <path d={indiaDots + indoDots} strokeWidth={3} opacity={0.3} />
          <path d={arabiaDots} strokeWidth={3.6} opacity={0.5} />
        </g>
        <path d={chinaOutline} stroke={theme.colors.goldLight} strokeWidth={2.2} strokeDasharray="1 9" strokeLinecap="round" fill="none" opacity={0.85 * outline} />
        <path d={arabiaOutline} stroke={theme.colors.gold} strokeWidth={2} strokeDasharray="1 9" strokeLinecap="round" fill="none" opacity={0.5 * outline} />
      </g>
      {/* sweeping glow edge */}
      {sweep < 1 && <rect x={clipX - 14} y={-20} width={28} height={H + 40} fill={theme.colors.goldLight} opacity={0.18} style={{filter: 'blur(14px)'}} />}

      {/* air arc */}
      <path d={AIR} stroke={`url(#${id})`} strokeWidth={5} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - air} style={{filter: `drop-shadow(0 0 8px ${theme.colors.gold}aa)`}} />
      {/* sea route */}
      <path d={SEA} stroke={theme.colors.goldLight} strokeWidth={4.5} strokeDasharray="14 12" strokeLinecap="round" fill="none" mask={`url(#${id}m)`} opacity={0.9} />

      <Pin x={gx} y={gy} t={t - 30} label={labels?.origin} labelSide="right" />
      <Mover d={AIR} len={AIR_LEN} p={air} node={icons.plane} size={58} rotate offsetAngle={45} />
      <Mover d={SEA} len={SEA_LEN} p={sea} node={icons.ship} size={52} />
      <Pin x={ux} y={uy} t={t - 94} label={labels?.destination} labelSide="below" />
    </svg>
  );
};

export const routeMapHeight = H;
