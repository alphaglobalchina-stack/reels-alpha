import React from 'react';
import {theme} from '../theme';
import {easeInOut, prog} from '../lib/anim';
import {LineIcon, icons} from './LineIcon';

export type ValueIconName = 'factory' | 'handshake' | 'shipPlane';
const G = theme.colors.gold;
const GL = theme.colors.goldLight;

/** Factory with looping smoke + a magnifier scanning side to side. t = frames since the icon started. */
const FactoryIcon: React.FC<{t: number; draw: number; size: number}> = ({t, draw, size}) => {
  const fade = prog(t, 20, 15);
  const sx = Math.sin(t / 14) * 2.2;
  return (
    <LineIcon name="factory" progress={draw} size={size} strokeWidth={1.1} viewBox="-6 -12 36 36">
      {[0, 1, 2].map((i) => {
        const ph = (t * 0.022 + i / 3) % 1;
        return (
          <circle
            key={i}
            cx={6 + Math.sin(ph * 7 + i * 2) * 1.3 + ph * 2}
            cy={2.2 - ph * 12}
            r={0.7 + ph * 2.3}
            fill={`${G}22`}
            stroke={GL}
            strokeWidth={0.5}
            opacity={(1 - ph) * 0.9 * fade}
          />
        );
      })}
      <g transform={`translate(${14 + sx} ${11}) scale(0.55)`} opacity={fade}>
        <circle cx={11} cy={11} r={9} fill={theme.colors.black} stroke="none" opacity={0.85} />
        {icons.search.map(([tag, a], i) => React.createElement(tag, {key: i, ...a, stroke: GL, strokeWidth: 2.2}))}
      </g>
    </LineIcon>
  );
};

/** Handshake with a gold price tag that spins (rotateY look via scaleX). */
const HandshakeIcon: React.FC<{t: number; draw: number; size: number}> = ({t, draw, size}) => {
  const fade = prog(t, 22, 14);
  const spin = Math.cos(t / 7);
  return (
    <LineIcon name="handshake" progress={draw} size={size} strokeWidth={1.1} viewBox="-4 -6 32 32">
      <g transform={`translate(24 -2) scale(${spin} 1) translate(-12 -12) scale(0.75)`} opacity={fade}>
        <circle cx={12} cy={12} r={11} fill={theme.colors.black} stroke="none" opacity={0.9} />
        {icons.tag.map(([tag, a], i) => React.createElement(tag, {key: i, ...a, stroke: GL, strokeWidth: 2, fill: i === 0 ? `${G}33` : 'none'}))}
      </g>
    </LineIcon>
  );
};

/** Ship riding waves while a plane crosses above it with a dotted trail. */
const ShipPlaneIcon: React.FC<{t: number; draw: number; size: number}> = ({t, draw, size}) => {
  const fade = prog(t, 18, 14);
  const planeP = ((t * 0.012 + 0.1) % 1);
  const px = 24 - planeP * 26; // right → left
  const py = 3 + planeP * 4;
  const bob = Math.sin(t / 9) * 0.7;
  const wave = (o: number) => {
    let d = `M-6 ${o}`;
    for (let x = -6; x <= 30; x += 3) d += ` Q ${x + 0.75} ${o + Math.sin((x + t * 0.5) / 2) * 1.2 - 1.2}, ${x + 1.5} ${o}`;
    return d;
  };
  return (
    <svg viewBox="-6 -4 36 30" width={size} height={size} fill="none" stroke={G} strokeLinecap="round" strokeLinejoin="round" style={{overflow: 'visible', filter: `drop-shadow(0 0 ${size * 0.05}px ${G}88)`}}>
      <g transform={`translate(0 ${bob + 4})`}>
        <g transform="translate(0 4) scale(1)">
          {icons.ship.map(([tag, a], i) =>
            React.createElement(tag, {key: i, ...a, strokeWidth: 1.1, pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - Math.min(1, Math.max(0, (draw - i * 0.1) / 0.6))}),
          )}
        </g>
      </g>
      <path d={wave(21)} strokeWidth={0.8} stroke={GL} opacity={fade * 0.9} />
      <path d={wave(24)} strokeWidth={0.6} stroke={G} opacity={fade * 0.6} />
      {/* plane + dotted trail */}
      <g opacity={fade}>
        <path d={`M${px + 3} ${py - 1} L${27} ${py - 3.5}`} strokeDasharray="0.1 1.6" strokeWidth={0.7} stroke={GL} opacity={0.8} />
        <g transform={`translate(${px} ${py}) scale(0.5) rotate(-90) translate(-12 -12)`}>
          {icons.plane.map(([tag, a], i) => React.createElement(tag, {key: i, ...a, stroke: GL, strokeWidth: 1.6}))}
        </g>
      </g>
    </svg>
  );
};

export const ValueIcon: React.FC<{name: ValueIconName; t: number; size?: number}> = ({name, t, size = 190}) => {
  const draw = prog(t, 0, 34, easeInOut);
  if (name === 'factory') return <FactoryIcon t={t} draw={draw} size={size} />;
  if (name === 'handshake') return <HandshakeIcon t={t} draw={draw} size={size} />;
  return <ShipPlaneIcon t={t} draw={draw} size={size} />;
};
