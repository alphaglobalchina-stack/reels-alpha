import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {theme} from '../theme';
import {easeInOut, easeOut, pop, prog} from '../lib/anim';
import {GoldDefs, ribbonPath, useSafeId} from './Swoosh';

/** Centre-line of the logo swoosh (logo space 240 × 280). Reusable motif. */
export const LOGO_SWOOSH = 'M-6 270 C 66 226, 150 198, 212 166 C 262 140, 254 64, 190 38 C 168 28, 140 30, 122 38';

const A_LEFT = 'M112 4 L120 8 C 128 70, 150 112, 184 138 C 122 150, 62 190, 10 266 C 42 190, 82 100, 112 4 Z';
const A_RIGHT = 'M148 266 L196 266 C 204 218, 214 176, 232 142 C 206 152, 182 156, 162 156 C 160 196, 154 232, 148 266 Z';

/**
 * The ALPHA mark, vector-built: the swoosh draws on, then the "A" assembles from two
 * angled shapes. `t` is the local frame since the mark started animating.
 */
export const LogoMark: React.FC<{t: number; size?: number}> = ({t, size = 280}) => {
  const {fps} = useVideoConfig();
  const id = useSafeId('lm');
  const swoosh = prog(t, 0, 26, easeInOut);
  const a1 = pop(t, fps, 14, 15, 90);
  const a2 = pop(t, fps, 20, 15, 90);
  const settle = prog(t, 14, 22, easeOut);
  const glint = prog(t, 38, 26, easeInOut);
  return (
    <svg viewBox="-20 -10 270 300" width={size * (270 / 300)} height={size} style={{overflow: 'visible'}}>
      <GoldDefs id={id} />
      <g
        style={{opacity: settle, transform: `translate(${(1 - a1) * -70}px, ${(1 - a1) * -50}px) rotate(${(1 - a1) * -14}deg)`, transformOrigin: '110px 140px'}}
      >
        <path d={A_LEFT} fill={theme.colors.logoDark} />
      </g>
      <g
        style={{opacity: prog(t, 20, 18, easeOut), transform: `translate(${(1 - a2) * 60}px, ${(1 - a2) * 70}px) rotate(${(1 - a2) * 12}deg)`, transformOrigin: '190px 210px'}}
      >
        <path d={A_RIGHT} fill={`url(#${id})`} />
      </g>
      <path d={ribbonPath(LOGO_SWOOSH, 0, swoosh, 30, 56, 0.55)} fill={`url(#${id})`} style={{filter: `drop-shadow(0 0 8px ${theme.colors.gold}88)`}} />
      {/* glint sweeping over the whole mark */}
      <rect
        x={-60 + glint * 330}
        y={-20}
        width={26}
        height={320}
        fill={theme.colors.white}
        opacity={0.5 * Math.sin(Math.PI * glint)}
        transform="skewX(-20)"
        style={{mixBlendMode: 'overlay', filter: 'blur(6px)'}}
      />
    </svg>
  );
};

/** ALPHA wordmark: letters rise out of a mask, then a shimmer sweeps across. */
export const Wordmark: React.FC<{t: number; size?: number; shimmerAt?: number; letterDelay?: number}> = ({
  t,
  size = 150,
  shimmerAt = 26,
  letterDelay = 4,
}) => {
  const word = 'ALPHA';
  const sweep = prog(t, shimmerAt, 24, easeInOut);
  const layer = (color: string, mask?: string) => (
    <div
      style={{
        display: 'flex',
        direction: 'ltr',
        gap: size * 0.1,
        fontFamily: theme.fonts.latin,
        fontSize: size,
        fontWeight: 500,
        lineHeight: 1,
        color,
        WebkitMaskImage: mask,
        maskImage: mask,
        position: mask ? 'absolute' : 'relative',
        inset: mask ? 0 : undefined,
      }}
    >
      {word.split('').map((ch, i) => {
        const p = prog(t, i * letterDelay, 16, easeOut);
        return (
          <span key={i} style={{display: 'inline-block', overflow: 'hidden', paddingBottom: size * 0.04}}>
            <span style={{display: 'inline-block', transform: `translateY(${(1 - p) * 110}%)`, opacity: Math.min(1, p * 2.2)}}>{ch}</span>
          </span>
        );
      })}
    </div>
  );
  const c = sweep * 140 - 20;
  const mask = `linear-gradient(100deg, transparent ${c - 14}%, #000 ${c}%, transparent ${c + 14}%)`;
  return (
    <div style={{position: 'relative', display: 'inline-block'}}>
      {layer(theme.colors.gold)}
      {sweep > 0 && sweep < 1 && layer('#FFF6D6', mask)}
    </div>
  );
};

/** Full static lockup (mark + wordmark) for the CTA card, with an optional entrance. */
export const LogoLockup: React.FC<{t: number; size?: number}> = ({t, size = 1}) => {
  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 * size}}>
      <LogoMark t={t} size={230 * size} />
      <Wordmark t={t - 10} size={104 * size} shimmerAt={24} letterDelay={3} />
    </div>
  );
};

export {useCurrentFrame};
