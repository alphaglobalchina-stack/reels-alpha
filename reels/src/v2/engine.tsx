import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {clamp, CX, CY, H, noise1, ramp, rnd, W} from '../film/lib';
import {CanvasLayer, glowSprite, GOLD_RGBA, WHITE_RGBA} from '../film/ui';
import {FPS} from './t2';

/** Global time in seconds (fractional inside motion-blur sub-samples). */
export const useT = () => useCurrentFrame() / FPS;

// ── impacts: drive shake, chromatic split and flashes from one list ─────────────────
export type Hit = {t: number; shake: number; rgb: number; flash?: number};

const decay = (t: number, at: number, dur: number) => (t >= at && t < at + dur ? Math.pow(1 - (t - at) / dur, 2) : 0);

export const hitState = (t: number, hits: Hit[]) => {
  let sx = 0, sy = 0, rot = 0, rgb = 0, flash = 0;
  for (const h of hits) {
    const k = decay(t, h.t, 0.38);
    if (k > 0) {
      sx += noise1(t * 46, h.t * 7) * 16 * h.shake * k;
      sy += noise1(t * 46, h.t * 7 + 3) * 16 * h.shake * k;
      rot += noise1(t * 30, h.t * 5 + 9) * 0.5 * h.shake * k;
    }
    rgb = Math.max(rgb, decay(t, h.t, 0.24) * h.rgb);
    if (h.flash) flash = Math.max(flash, (t >= h.t - 0.04 && t < h.t ? (t - h.t + 0.04) / 0.04 : decay(t, h.t, 0.3)) * h.flash);
  }
  return {sx, sy, rot, rgb, flash};
};

/** Motion blur only where the camera is fast (keeps render time sane). */
export const Blur: React.FC<{samples: number; children: React.ReactNode}> = ({samples, children}) =>
  samples > 1 ? (
    <CameraMotionBlur samples={samples} shutterAngle={200}>
      {children}
    </CameraMotionBlur>
  ) : (
    <AbsoluteFill>{children}</AbsoluteFill>
  );

/** SVG filter defs: chromatic split + directional (whip) blur. */
export const FilterDefs: React.FC<{rgb: number; whipX: number; whipY: number}> = ({rgb, whipX, whipY}) => (
  <svg width={0} height={0} style={{position: 'absolute'}}>
    <defs>
      <filter id="rgbsplit" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
        <feOffset in="r" dx={rgb} dy={0} result="ro" />
        <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
        <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
        <feOffset in="b" dx={-rgb} dy={0} result="bo" />
        <feBlend in="ro" in2="g" mode="screen" result="rg" />
        <feBlend in="rg" in2="bo" mode="screen" />
      </filter>
      <filter id="whip" x="-5%" y="-5%" width="110%" height="110%">
        <feGaussianBlur stdDeviation={`${whipX} ${whipY}`} />
      </filter>
    </defs>
  </svg>
);

// ── light: warp streaks, anamorphic flare, sparks ────────────────────────────────────
/** Radial warp streaks rushing past the lens (push-throughs). */
export const Warp: React.FC<{t: number; k: number; cx?: number; cy?: number; seed?: number; color?: string}> = ({t, k, cx = CX, cy = CY, seed = 1, color = '255,224,160'}) => (
  <CanvasLayer
    draw={(ctx) => {
      if (k <= 0.01) return;
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';
      for (let i = 0; i < 140; i++) {
        const a = rnd(i * 3.3 + seed) * Math.PI * 2;
        const ph = (rnd(i * 7.1 + seed) + t * (0.9 + rnd(i) * 1.6) * (0.6 + k)) % 1;
        const r0 = 40 + Math.pow(ph, 2.2) * 1400;
        const len = (30 + 520 * Math.pow(ph, 2)) * k;
        const al = clamp(k * (0.15 + 0.6 * ph) * (0.4 + 0.6 * rnd(i * 5)));
        ctx.strokeStyle = `rgba(${color},${al})`;
        ctx.lineWidth = 1 + 3 * ph * rnd(i * 9);
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
        ctx.lineTo(cx + Math.cos(a) * (r0 + len), cy + Math.sin(a) * (r0 + len));
        ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';
    }}
  />
);

/** Horizontal anamorphic flare at an impact point. */
export const Anamorphic: React.FC<{t: number; at: number; y: number; x?: number; dur?: number; strength?: number}> = ({t, at, y, x = CX, dur = 0.7, strength = 1}) => {
  const k = decay(t, at, dur);
  if (k <= 0) return null;
  const w = 1300 * (0.5 + 0.5 * ramp(t, at, at + 0.12));
  return (
    <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'screen'}}>
      <div style={{position: 'absolute', left: x - w, top: y - 4, width: w * 2, height: 8, background: `linear-gradient(90deg, rgba(255,200,120,0), rgba(255,240,210,${0.95 * k * strength}), rgba(255,200,120,0))`, filter: 'blur(2px)'}} />
      <div style={{position: 'absolute', left: x - w * 0.6, top: y - 40, width: w * 1.2, height: 80, background: `radial-gradient(ellipse 50% 50% at 50% 50%, rgba(255,210,140,${0.35 * k * strength}), rgba(0,0,0,0))`}} />
      <div style={{position: 'absolute', left: x - 120, top: y - 120, width: 240, height: 240, background: `radial-gradient(circle, rgba(255,255,255,${0.8 * k * strength}) 0%, rgba(255,220,150,${0.3 * k * strength}) 30%, rgba(0,0,0,0) 70%)`}} />
    </AbsoluteFill>
  );
};

/** Particle burst (selected transitions only). */
export const Burst: React.FC<{t: number; at: number; x: number; y: number; n?: number; power?: number}> = ({t, at, x, y, n = 70, power = 1}) => {
  const k = t - at;
  if (k < 0 || k > 1.6) return null;
  return (
    <CanvasLayer
      draw={(ctx) => {
        ctx.globalCompositeOperation = 'lighter';
        const gs = glowSprite(GOLD_RGBA, 0.18), ws = glowSprite(WHITE_RGBA, 0.25);
        for (let i = 0; i < n; i++) {
          const a = rnd(i * 2.9 + at) * Math.PI * 2;
          const sp = (500 + rnd(i * 4.7) * 1300) * power;
          const d = sp * (1 - Math.exp(-k * 3.2)) / 3.2 * 3;
          const px = x + Math.cos(a) * d, py = y + Math.sin(a) * d + k * k * 120;
          const al = clamp(1.1 - k / 1.3) * (0.5 + 0.5 * rnd(i));
          const r = (3 + rnd(i * 7) * 8) * (1 - k * 0.4);
          ctx.globalAlpha = al;
          ctx.drawImage(i % 4 ? gs : ws, px - r, py - r, r * 2, r * 2);
          // streak tail
          ctx.strokeStyle = `rgba(255,220,150,${al * 0.5})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px - Math.cos(a) * 40 * Math.exp(-k * 2), py - Math.sin(a) * 40 * Math.exp(-k * 2));
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
      }}
    />
  );
};

/** Soft haze / cloud pass-through used for vertical dives. */
export const Haze: React.FC<{t: number; k: number; seed?: number}> = ({t, k, seed = 3}) => (
  <CanvasLayer
    draw={(ctx) => {
      if (k <= 0.01) return;
      for (let i = 0; i < 26; i++) {
        const ph = (rnd(i * 1.7 + seed) + t * 0.9) % 1;
        const s = 0.3 + ph * 2.4;
        const x = CX + (rnd(i * 3.1 + seed) - 0.5) * W * 1.4 * s;
        const y = CY + (rnd(i * 5.3 + seed) - 0.5) * H * 0.9 * s;
        const r = 260 * s;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        const al = k * 0.35 * Math.sin(Math.PI * ph);
        g.addColorStop(0, `rgba(236,226,206,${al})`);
        g.addColorStop(1, 'rgba(236,226,206,0)');
        ctx.fillStyle = g;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      }
    }}
  />
);

export const WipeFlash: React.FC<{k: number; color?: string}> = ({k, color = '255,236,200'}) => (k > 0.002 ? <AbsoluteFill style={{background: `rgba(${color},${k})`, mixBlendMode: 'screen', pointerEvents: 'none'}} /> : null);
