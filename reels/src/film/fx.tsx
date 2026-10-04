import React from 'react';
import {AbsoluteFill, staticFile} from 'remotion';
import {CanvasLayer, glowSprite, GOLD_RGBA, WHITE_RGBA} from './ui';
import {clamp, H, noise1, ramp, rnd, W} from './lib';

/** Animated film grain (4 deterministic tiles, offset per frame). */
export const Grain: React.FC<{frame: number; opacity?: number}> = ({frame, opacity = 0.075}) => {
  const i = frame % 4;
  const ox = Math.floor(rnd(frame * 1.3) * 512);
  const oy = Math.floor(rnd(frame * 2.7 + 9) * 512);
  return (
    <AbsoluteFill
      style={{
        backgroundImage: `url(${staticFile(`film/grain${i}.png`)})`,
        backgroundPosition: `${ox}px ${oy}px`,
        backgroundSize: '512px 512px',
        mixBlendMode: 'overlay',
        opacity,
        pointerEvents: 'none',
      }}
    />
  );
};

export const Vignette: React.FC<{strength?: number}> = ({strength = 0.62}) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse 78% 62% at 50% 48%, rgba(0,0,0,0) 55%, rgba(0,0,0,${strength * 0.55}) 82%, rgba(0,0,0,${strength}) 100%)`,
      pointerEvents: 'none',
    }}
  />
);

/** Warm light leak sweeping across on key transitions. */
export const LightLeak: React.FC<{t: number; at: number; dur?: number; x0?: number; x1?: number; y?: number; strength?: number}> = ({t, at, dur = 0.9, x0 = -20, x1 = 120, y = 40, strength = 0.55}) => {
  if (t < at || t > at + dur) return null;
  const p = (t - at) / dur;
  const a = Math.sin(Math.PI * p) * strength;
  const x = x0 + (x1 - x0) * p;
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 55% 42% at ${x}% ${y}%, rgba(255,190,90,${a}) 0%, rgba(255,140,40,${a * 0.45}) 35%, rgba(0,0,0,0) 70%)`,
        mixBlendMode: 'screen',
        pointerEvents: 'none',
      }}
    />
  );
};

/** Short exposure flash (impact). */
export const Flash: React.FC<{t: number; at: number; dur?: number; color?: string; peak?: number}> = ({t, at, dur = 0.35, color = '255,236,196', peak = 0.7}) => {
  if (t < at - 0.06 || t > at + dur) return null;
  const a = t < at ? ramp(t, at - 0.06, at) * peak : (1 - ramp(t, at, at + dur, (x) => 1 - (1 - x) * (1 - x))) * peak;
  return <AbsoluteFill style={{background: `rgba(${color},${a})`, mixBlendMode: 'screen', pointerEvents: 'none'}} />;
};

/** Ambient gold dust drifting in depth across the whole film. */
export const Dust: React.FC<{t: number; amount?: number; drift?: number}> = ({t, amount = 1, drift = 1}) => (
  <CanvasLayer
    draw={(ctx) => {
      if (amount <= 0.01) return;
      ctx.globalCompositeOperation = 'lighter';
      const gs = glowSprite(GOLD_RGBA, 0.12);
      const ws = glowSprite(WHITE_RGBA, 0.2);
      for (let i = 0; i < 110; i++) {
        const depth = 0.25 + rnd(i * 3.1) * 0.75; // 0.25 far … 1 near
        const sp = 8 + depth * 26;
        const x = ((rnd(i * 7.7) * W + t * sp * drift * (rnd(i) > 0.5 ? 1 : -0.6) + noise1(t * 0.3 + i, i) * 40) % (W + 80) + W + 80) % (W + 80) - 40;
        const y = ((rnd(i * 1.9) * H - t * sp * 0.9 * drift + noise1(t * 0.25 + i * 2, i + 3) * 50) % (H + 80) + H + 80) % (H + 80) - 40;
        const tw = 0.55 + 0.45 * Math.sin(t * (1 + rnd(i) * 2) + i);
        const r = (2 + depth * 9) * (i % 9 === 0 ? 2.2 : 1);
        ctx.globalAlpha = clamp(amount * tw * (0.18 + depth * 0.45));
        ctx.drawImage(i % 5 === 0 ? ws : gs, x - r, y - r, r * 2, r * 2);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }}
  />
);

/** Chromatic split for impact moments: renders children 3× with channel offsets, decaying. */
export const RGBSplit: React.FC<{t: number; at: number; dur?: number; px?: number; children: React.ReactNode}> = ({t, at, dur = 0.4, px = 10, children}) => {
  const k = t >= at && t < at + dur ? Math.pow(1 - (t - at) / dur, 2) * px : 0;
  if (k < 0.3) return <>{children}</>;
  return (
    <div style={{position: 'relative'}}>
      <div style={{position: 'absolute', inset: 0, transform: `translateX(${-k}px)`, opacity: 0.55, filter: 'sepia(1) saturate(6) hue-rotate(-30deg)', mixBlendMode: 'screen'}}>{children}</div>
      <div style={{position: 'absolute', inset: 0, transform: `translateX(${k}px)`, opacity: 0.55, filter: 'sepia(1) saturate(4) hue-rotate(160deg)', mixBlendMode: 'screen'}}>{children}</div>
      <div style={{position: 'relative'}}>{children}</div>
    </div>
  );
};
