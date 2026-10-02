import React, {useId} from 'react';
import {getLength, getPointAtLength, getTangentAtLength} from '@remotion/paths';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {theme} from '../theme';
import {easeInOut, prog} from '../lib/anim';

/**
 * Builds a tapered "brush" ribbon polygon along a centre-line path, between
 * `from` and `to` (0..1). The head of a partially drawn ribbon is tapered too,
 * so drawing it on looks like a pen stroke.
 */
export const ribbonPath = (d: string, from: number, to: number, maxW: number, samples = 56, bias = 0.5) => {
  if (to - from < 0.002) return '';
  const len = getLength(d);
  const left: string[] = [];
  const right: string[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = from + ((to - from) * i) / samples;
    const pos = Math.min(len, Math.max(0, t * len));
    const p = getPointAtLength(d, pos)!;
    const tg = getTangentAtLength(d, pos)!;
    // width profile: swells quickly then tapers (bias moves the thickest point)
    const base = Math.pow(Math.sin(Math.PI * Math.pow(t, Math.log(bias) / Math.log(0.5))), 0.85);
    const head = Math.min(1, Math.max(0, (to - t) / 0.1 + (to >= 0.999 ? 1 : 0)));
    const w = (maxW / 2) * base * Math.pow(head, 0.7);
    const nx = -tg.y, ny = tg.x;
    left.push(`${(p.x + nx * w).toFixed(1)} ${(p.y + ny * w).toFixed(1)}`);
    right.push(`${(p.x - nx * w).toFixed(1)} ${(p.y - ny * w).toFixed(1)}`);
  }
  return `M${left.join(' L')} L${right.reverse().join(' L')}Z`;
};

export const GoldDefs: React.FC<{id: string}> = ({id}) => (
  <defs>
    <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor={theme.colors.goldDark} />
      <stop offset="0.35" stopColor={theme.colors.gold} />
      <stop offset="0.55" stopColor={theme.colors.goldLight} />
      <stop offset="0.8" stopColor={theme.colors.gold} />
      <stop offset="1" stopColor={theme.colors.goldDark} />
    </linearGradient>
  </defs>
);

export const useSafeId = (prefix: string) => prefix + useId().replace(/[^a-zA-Z0-9]/g, '');

/** Gold ribbon that draws itself on along `d`. Use anywhere (logo, underline, accents). */
export const Swoosh: React.FC<{
  d: string;
  progress: number;
  width?: number;
  from?: number;
  glow?: boolean;
  bias?: number;
  viewBox?: string;
  style?: React.CSSProperties;
  svgSize?: {w: number; h: number};
}> = ({d, progress, width = 30, from = 0, glow = true, bias = 0.5, viewBox, svgSize, style}) => {
  const id = useSafeId('sw');
  const path = ribbonPath(d, from, progress, width, 56, bias);
  return (
    <svg viewBox={viewBox} width={svgSize?.w} height={svgSize?.h} style={{overflow: 'visible', ...style}}>
      <GoldDefs id={id} />
      {path && (
        <path
          d={path}
          fill={`url(#${id})`}
          style={glow ? {filter: `drop-shadow(0 0 10px ${theme.colors.gold}88)`} : undefined}
        />
      )}
    </svg>
  );
};

/** A slim swoosh used as a headline underline. Draws right → left (RTL reading direction). */
export const SwooshUnderline: React.FC<{start: number; width?: number; thickness?: number; dur?: number}> = ({
  start,
  width = 640,
  thickness = 22,
  dur = 22,
}) => {
  const frame = useCurrentFrame();
  const p = prog(frame, start, dur, easeInOut);
  const h = 70;
  const d = `M${width} ${h * 0.62} C ${width * 0.7} ${h * 0.95}, ${width * 0.3} ${h * 0.05}, 0 ${h * 0.5}`;
  return <Swoosh d={d} progress={p} width={thickness} bias={0.6} svgSize={{w: width, h}} viewBox={`0 0 ${width} ${h}`} />;
};

/**
 * Scene-to-scene transition: a gold swoosh sweeps right → left, trailing a black curtain.
 * The cut happens exactly in the middle of this component's Sequence, while the curtain is full.
 */
export const SwooshWipe: React.FC<{duration: number}> = ({duration}) => {
  const frame = useCurrentFrame();
  const id = useSafeId('wp');
  const p = easeInOut(Math.min(1, Math.max(0, frame / duration)));
  const off = 2140 - p * 4280;
  const xl = -760, xr = 1840;
  const left = `M${xl} -120 C ${xl + 300} 480, ${xl - 260} 1300, ${xl + 80} 2040`;
  const right = `M${xr} -120 C ${xr + 300} 480, ${xr - 260} 1300, ${xr + 80} 2040`;
  return (
    <AbsoluteFill style={{overflow: 'hidden', pointerEvents: 'none'}}>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <GoldDefs id={id} />
        <g transform={`translate(${off} 0)`}>
          <path
            d={`${left} L ${xr + 80} 2040 C ${xr - 260} 1300, ${xr + 300} 480, ${xr} -120 Z`}
            fill={theme.colors.deep}
          />
          {/* leading edge: thick gold ribbon + glow */}
          <path d={left} stroke={theme.colors.gold} strokeOpacity={0.28} strokeWidth={120} fill="none" style={{filter: 'blur(26px)'}} />
          <path d={left} stroke={`url(#${id})`} strokeWidth={34} strokeLinecap="round" fill="none" />
          <path d={left} transform="translate(46 0)" stroke={theme.colors.goldDark} strokeWidth={10} strokeLinecap="round" fill="none" />
          {/* trailing edge */}
          <path d={right} stroke={`url(#${id})`} strokeWidth={18} strokeLinecap="round" fill="none" />
        </g>
      </svg>
    </AbsoluteFill>
  );
};
