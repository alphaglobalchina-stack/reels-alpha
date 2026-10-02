import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {theme} from '../theme';
import {rand} from '../lib/anim';

const PARTICLES = Array.from({length: 46}, (_, i) => ({
  x: rand(i + 1) * 1080,
  y: rand(i + 50) * 1920,
  r: 1.5 + rand(i + 99) * 3.5,
  speed: 0.25 + rand(i + 7) * 0.7,
  phase: rand(i + 13) * 6.28,
  drift: 10 + rand(i + 31) * 30,
}));

/** Cinematic dark gold backdrop — always moving (light bloom, light streaks, dust). */
export const Backdrop: React.FC<{tint?: number}> = ({tint = 1}) => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const g = theme.colors.gold;
  return (
    <AbsoluteFill style={{background: theme.colors.black, overflow: 'hidden'}}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(900px 900px at ${50 + Math.sin(t * 0.5) * 18}% ${34 + Math.cos(t * 0.4) * 8}%, ${g}${Math.round(46 * tint).toString(16).padStart(2, '0')}, transparent 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(1100px 1100px at ${50 - Math.cos(t * 0.35) * 25}% ${86 + Math.sin(t * 0.45) * 6}%, ${theme.colors.goldDark}33, transparent 70%)`,
        }}
      />
      {/* slow diagonal light streaks */}
      {[0, 1].map((i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: -400,
            width: 2000,
            height: 260 - i * 120,
            top: 300 + i * 700 + Math.sin(t * 0.3 + i * 2) * 120,
            transform: 'rotate(-24deg)',
            background: `linear-gradient(90deg, transparent, ${theme.colors.goldLight}${i ? '0d' : '12'}, transparent)`,
            filter: 'blur(30px)',
          }}
        />
      ))}
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        {PARTICLES.map((p, i) => {
          const y = (((p.y - frame * p.speed) % 1960) + 1960) % 1960 - 20;
          const x = p.x + Math.sin(t * 0.8 + p.phase) * p.drift;
          const tw = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(t * 2 + p.phase));
          return <circle key={i} cx={x} cy={y} r={p.r} fill={theme.colors.goldLight} opacity={tw * 0.55} />;
        })}
      </svg>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, transparent 45%, rgba(0,0,0,0.75) 100%)'}} />
    </AbsoluteFill>
  );
};
