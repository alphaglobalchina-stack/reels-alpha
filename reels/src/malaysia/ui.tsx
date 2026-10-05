import React from 'react';
import {Easing, interpolate} from 'remotion';
import {C, RADIUS, Rect} from './data';

export const FONT = "Cairo, 'Noto Sans Arabic', Tahoma, sans-serif";

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
export const prog = (f: number, start: number, dur: number, ease = easeOut) =>
  interpolate(f, [start, start + dur], [0, 1], {easing: ease, extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
/** Deterministic pseudo-random in [0,1). */
export const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export const SHADOW = '0 40px 80px -36px rgba(28,28,30,0.22), 0 14px 30px -18px rgba(28,28,30,0.12), 0 1px 2px rgba(28,28,30,0.05)';

/** A bento card. Board coordinates; optional DOF blur (board px). */
export const Card: React.FC<{
  rect: Rect;
  children?: React.ReactNode;
  bg?: string;
  dark?: boolean;
  blur?: number;
  radius?: number;
  style?: React.CSSProperties;
  sheen?: boolean;
}> = ({rect, children, bg, dark, blur = 0, radius = RADIUS, style, sheen = true}) => (
  <div
    style={{
      position: 'absolute',
      left: rect.x,
      top: rect.y,
      width: rect.w,
      height: rect.h,
      borderRadius: radius,
      background: bg ?? (dark ? `linear-gradient(160deg, #2A2A2D 0%, ${C.ink} 55%, #121214 100%)` : `linear-gradient(165deg, #FFFFFF 0%, ${C.card} 60%, #F6F4F0 100%)`),
      boxShadow: dark ? `${SHADOW}, inset 0 1px 0 rgba(255,255,255,0.08)` : `${SHADOW}, inset 0 1px 0 rgba(255,255,255,1)`,
      border: dark ? '1px solid rgba(255,255,255,0.06)' : `1px solid ${C.hair}`,
      filter: blur > 0.15 ? `blur(${blur.toFixed(2)}px)` : undefined,
      overflow: 'hidden',
      ...style,
    }}
  >
    {sheen && (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: dark
            ? 'radial-gradient(120% 70% at 85% -10%, rgba(232,217,181,0.20) 0%, rgba(232,217,181,0) 60%)'
            : 'radial-gradient(90% 60% at 100% 0%, rgba(232,217,181,0.22) 0%, rgba(232,217,181,0) 60%)',
          pointerEvents: 'none',
        }}
      />
    )}
    {children}
  </div>
);

/** Arabic text: RTL, never letter-spaced, never split into letters. */
export const Ar: React.FC<{
  children: React.ReactNode;
  size: number;
  weight?: number;
  color?: string;
  align?: 'right' | 'center' | 'left';
  lh?: number;
  style?: React.CSSProperties;
}> = ({children, size, weight = 700, color = C.ink, align = 'right', lh = 1.25, style}) => (
  <div
    dir="rtl"
    lang="ar"
    style={{
      fontFamily: FONT,
      fontSize: size,
      fontWeight: weight,
      color,
      textAlign: align,
      lineHeight: lh,
      letterSpacing: 0,
      direction: 'rtl',
      unicodeBidi: 'isolate',
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    {children}
  </div>
);

/** Latin runs (numbers, URLs, emails) isolated LTR so the bidi algorithm never flips "+". */
export const Ltr: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <span dir="ltr" style={{direction: 'ltr', unicodeBidi: 'isolate', display: 'inline-block', ...style}}>
    {children}
  </span>
);

/** Slot-machine digit: rolls from 0 up to `target` (+ extra full turns). No layout shift. */
export const SlotDigit: React.FC<{v: number; size: number; color: string; weight?: number; lh?: number}> = ({v, size, color, weight = 800, lh = 1.08}) => {
  const n = Math.ceil(v) + 1;
  const h = size * lh;
  return (
    <span
      style={{
        display: 'inline-block',
        height: h,
        overflow: 'hidden',
        position: 'relative',
        verticalAlign: 'top',
        WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, #000 16%, #000 84%, transparent 100%)',
        maskImage: 'linear-gradient(180deg, transparent 0%, #000 16%, #000 84%, transparent 100%)',
      }}
    >
      <span style={{display: 'block', transform: `translateY(${(-v * h).toFixed(2)}px)`}}>
        {Array.from({length: n + 1}, (_, i) => (
          <span key={i} style={{display: 'block', height: h, lineHeight: `${h}px`, fontFamily: FONT, fontSize: size, fontWeight: weight, color, textAlign: 'center', fontVariantNumeric: 'tabular-nums'}}>
            {i % 10}
          </span>
        ))}
      </span>
    </span>
  );
};

/** Glossy 3D tile carrying an icon. `spin` = rotateY degrees, `glint` = 0..1 light sweep. */
export const IconChip: React.FC<{
  size: number;
  spin?: number;
  glint?: number;
  dark?: boolean;
  lift?: number;
  children: React.ReactNode;
}> = ({size, spin = 0, glint = -1, dark, lift = 0, children}) => {
  const depth = 7;
  const face = dark
    ? 'linear-gradient(150deg, #3A3A3E 0%, #26262A 60%, #1A1A1C 100%)'
    : 'linear-gradient(150deg, #FFFFFF 0%, #F7F5F1 55%, #E9E5DE 100%)';
  const edge = dark ? '#0F0F10' : '#D8D2C8';
  return (
    <div style={{width: size, height: size, perspective: 900, position: 'relative'}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transformStyle: 'preserve-3d',
          transform: `translateY(${-lift}px) rotateY(${spin}deg)`,
        }}
      >
        {Array.from({length: depth}, (_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: size * 0.28,
              background: edge,
              transform: `translateZ(${-(i + 1) * 2}px)`,
            }}
          />
        ))}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: size * 0.28,
            background: face,
            boxShadow: dark ? 'inset 0 1px 0 rgba(255,255,255,0.12)' : 'inset 0 2px 0 #fff, inset 0 -3px 8px rgba(28,28,30,0.05)',
            overflow: 'hidden',
          }}
        >
          {glint >= 0 && glint <= 1 && (
            <div
              style={{
                position: 'absolute',
                top: '-50%',
                bottom: '-50%',
                width: '40%',
                left: `${-60 + glint * 180}%`,
                transform: 'rotate(20deg)',
                background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,250,235,0.85) 50%, rgba(255,255,255,0) 100%)',
              }}
            />
          )}
        </div>
        <div
          style={{
            position: 'absolute',
            inset: size * 0.04,
            transform: 'translateZ(22px)',
            backfaceVisibility: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {children}
        </div>
      </div>
      {/* contact shadow on the card */}
      <div
        style={{
          position: 'absolute',
          left: '8%',
          right: '8%',
          bottom: -size * 0.1,
          height: size * 0.16,
          borderRadius: '50%',
          background: 'radial-gradient(closest-side, rgba(28,28,30,0.22), rgba(28,28,30,0))',
          zIndex: -1,
        }}
      />
    </div>
  );
};
