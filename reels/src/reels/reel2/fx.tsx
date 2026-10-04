import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import vo from '../../../../content/reel2-vo.json';
import {ease, tw} from '../../lib/gs';
import {theme} from '../../theme';

// ── Timing (everything is keyed to the voice-over) ────────────────────────────────
export const FPS = 30;
export const sec = (s: number) => Math.round(s * FPS);
type Word = {w: string; t: string; s: number; e: number};
export const WORDS = vo.words as Word[];

/** Frame at which the nth occurrence (0-based) of a spoken word starts. */
export const at = (word: string, nth = 0) => {
  let k = 0;
  for (const w of WORDS) {
    if (w.w === word) {
      if (k === nth) return sec(w.s);
      k++;
    }
  }
  throw new Error(`word not found: ${word}#${nth}`);
};

export const C = {
  ...theme.colors,
  red: '#E8402F',
  ink: '#07070A',
  cream: '#FFF4DC',
};
export const ANTON = "Anton, 'Montserrat', sans-serif";
export const MONT = theme.fonts.latin;
export const GOLD_TEXT: React.CSSProperties = {
  backgroundImage: 'linear-gradient(170deg, #FFF1C1 0%, #F2D27A 28%, #C9971C 55%, #8F6A10 78%, #E9C66A 100%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
  WebkitTextFillColor: 'transparent',
};

// ── Motion presets (all return style objects) ───────────────────────────────────────
/** Slam: big → settle with overshoot, blur and RGB split that decay. */
export const slam = (f: number, start: number, from = 1.6, dur = 12): React.CSSProperties => {
  const p = tw(f, start, dur, 'back.out(2.2)');
  const o = tw(f, start, 4, 'none');
  const k = Math.max(0, 1 - (f - start) / 10);
  const d = f >= start ? 9 * k : 0;
  return {
    opacity: o,
    transform: `scale(${from - (from - 1) * p})`,
    filter: `blur(${(1 - Math.min(1, p)) * 10}px)`,
    textShadow: d > 0.3 ? `${d}px 0 rgba(255,40,80,0.75), ${-d}px 0 rgba(0,220,255,0.75)` : undefined,
  };
};

/** Rise from a mask (wrap the element in <Mask>). */
export const rise = (f: number, start: number, dur = 14, dist = 110): React.CSSProperties => {
  const p = tw(f, start, dur, 'expo.out');
  return {transform: `translateY(${(1 - p) * dist}%) rotate(${(1 - p) * 4}deg)`, opacity: Math.min(1, p * 3)};
};

export const fadeUp = (f: number, start: number, dur = 16, dist = 40): React.CSSProperties => {
  const p = tw(f, start, dur, 'expo.out');
  return {transform: `translateY(${(1 - p) * dist}px)`, opacity: p, filter: p < 1 ? `blur(${(1 - p) * 8}px)` : undefined};
};

/** Exit: scale + blur + fade. */
export const exit = (f: number, start: number, dur = 10, scaleTo = 1.25): React.CSSProperties => {
  const e = tw(f, start, dur, 'power3.in');
  if (e <= 0) return {};
  return {opacity: 1 - e, transform: `scale(${1 + (scaleTo - 1) * e})`, filter: `blur(${e * 14}px)`};
};

export const Mask: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <div style={{overflow: 'hidden', paddingBottom: '0.06em', ...style}}>{children}</div>
);

export const Center: React.FC<{top: number; children: React.ReactNode; style?: React.CSSProperties}> = ({top, children, style}) => (
  <div style={{position: 'absolute', left: 0, right: 0, top, display: 'flex', flexDirection: 'column', alignItems: 'center', ...style}}>{children}</div>
);

export const Big: React.FC<{
  size: number;
  children: React.ReactNode;
  gold?: boolean;
  color?: string;
  stroke?: string;
  spacing?: number;
  style?: React.CSSProperties;
}> = ({size, children, gold, color = C.white, stroke, spacing = 0, style}) => (
  <div
    style={{
      fontFamily: ANTON,
      fontSize: size,
      lineHeight: 0.98,
      letterSpacing: spacing,
      textTransform: 'uppercase',
      color: stroke ? 'transparent' : color,
      WebkitTextStroke: stroke ? `2px ${stroke}` : undefined,
      whiteSpace: 'nowrap',
      ...(gold ? GOLD_TEXT : {}),
      ...style,
    }}
  >
    {children}
  </div>
);

export const Label: React.FC<{children: React.ReactNode; size?: number; color?: string; spacing?: number; style?: React.CSSProperties}> = ({
  children,
  size = 30,
  color = C.goldLight,
  spacing = 8,
  style,
}) => (
  <div style={{fontFamily: MONT, fontWeight: 800, fontSize: size, letterSpacing: spacing, color, textTransform: 'uppercase', whiteSpace: 'nowrap', ...style}}>{children}</div>
);

/** Per-letter stagger (Latin only). */
export const Letters: React.FC<{text: string; f: number; start: number; stagger?: number; size: number; gold?: boolean; color?: string; spacing?: number}> = ({
  text,
  f,
  start,
  stagger = 1.4,
  size,
  gold,
  color,
  spacing = 0,
}) => (
  <div style={{display: 'flex'}}>
    {text.split('').map((ch, i) => {
      const p = tw(f, start + i * stagger, 14, 'back.out(1.8)');
      return (
        <Mask key={i}>
          <div style={{transform: `translateY(${(1 - p) * 105}%)`, opacity: Math.min(1, p * 3)}}>
            <Big size={size} gold={gold} color={color} spacing={spacing}>
              {ch === ' ' ? ' ' : ch}
            </Big>
          </div>
        </Mask>
      );
    })}
  </div>
);

// ── Photography ────────────────────────────────────────────────────────────────────
export const Photo: React.FC<{
  src: string;
  f: number;
  from: number;
  dur: number;
  zoom?: [number, number];
  pan?: [number, number, number, number];
  grade?: number;
  style?: React.CSSProperties;
  imgStyle?: React.CSSProperties;
}> = ({src, f, from, dur, zoom = [1.12, 1.0], pan = [0, 0, 0, 0], grade = 0.82, style, imgStyle}) => {
  const p = ease('sine.inOut')(Math.min(1, Math.max(0, (f - from) / dur)));
  const s = zoom[0] + (zoom[1] - zoom[0]) * p;
  const x = pan[0] + (pan[2] - pan[0]) * p;
  const y = pan[1] + (pan[3] - pan[1]) * p;
  return (
    <AbsoluteFill style={{overflow: 'hidden', ...style}}>
      <Img
        src={staticFile(src)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `translate(${x}px, ${y}px) scale(${s})`,
          filter: `brightness(${grade}) contrast(1.08) saturate(1.12)`,
          ...imgStyle,
        }}
      />
    </AbsoluteFill>
  );
};

/** Darkening gradients so type always reads on top of photos. */
export const Shade: React.FC<{top?: number; bottom?: number; all?: number}> = ({top = 0.55, bottom = 0.7, all = 0.15}) => (
  <AbsoluteFill
    style={{
      background: `linear-gradient(to bottom, rgba(5,5,8,${top}) 0%, rgba(5,5,8,${all}) 38%, rgba(5,5,8,${all}) 58%, rgba(5,5,8,${bottom}) 100%)`,
    }}
  />
);

// ── Finishing FX ───────────────────────────────────────────────────────────────────
export const Grain: React.FC<{f: number; opacity?: number}> = ({f, opacity = 0.07}) => (
  <AbsoluteFill style={{opacity, mixBlendMode: 'overlay', pointerEvents: 'none'}}>
    <svg width={540} height={960} style={{transform: 'scale(2)', transformOrigin: '0 0'}}>
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={f % 23} stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width={540} height={960} filter="url(#grain)" />
    </svg>
  </AbsoluteFill>
);

/** Warm anamorphic light leak; `power` 0..1. */
export const Leak: React.FC<{f: number; power: number; hue?: 'warm' | 'red'}> = ({f, power, hue = 'warm'}) => {
  if (power <= 0.01) return null;
  const x = 30 + Math.sin(f / 13) * 30;
  const y = 30 + Math.cos(f / 17) * 20;
  const c1 = hue === 'warm' ? '255,170,60' : '232,64,47';
  return (
    <AbsoluteFill style={{mixBlendMode: 'screen', pointerEvents: 'none', opacity: power}}>
      <AbsoluteFill style={{background: `radial-gradient(900px 1300px at ${x}% ${y}%, rgba(${c1},0.85), rgba(${c1},0.2) 40%, transparent 70%)`}} />
      <AbsoluteFill style={{background: `radial-gradient(600px 800px at ${100 - x}% ${100 - y}%, rgba(255,230,180,0.6), transparent 70%)`}} />
      <div style={{position: 'absolute', left: -200, right: -200, top: `${y + 10}%`, height: 6, background: 'linear-gradient(90deg, transparent, rgba(255,220,160,0.9), transparent)', filter: 'blur(3px)'}} />
    </AbsoluteFill>
  );
};

export const Flash: React.FC<{v: number; color?: string}> = ({v, color = '255,244,220'}) =>
  v > 0.01 ? <AbsoluteFill style={{background: `rgba(${color},${v})`, pointerEvents: 'none'}} /> : null;

export const Vignette: React.FC = () => (
  <AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 70% at 50% 50%, transparent 55%, rgba(0,0,0,0.6) 100%)', pointerEvents: 'none'}} />
);

// ── Arabic subtitles ───────────────────────────────────────────────────────────────
type Sub = {s: number; e: number; en: string; ar: string};
const SUBS = vo.subtitles as Sub[];

/**
 * Arabic subtitles, karaoke style: the translated words appear one by one in step with
 * the English voice (spread across the phrase's spoken span by word length); the word
 * being "spoken" glows gold, a gold line under the card tracks the phrase's progress.
 * Arabic words are never split, so letter joining stays intact.
 */
export const Subtitles: React.FC<{f: number}> = ({f}) => {
  const cur = SUBS.find((s) => f >= sec(s.s) - 3 && f < sec(s.e) + 4);
  if (!cur) return null;
  const a = sec(cur.s) - 3;
  const b = sec(cur.e) + 4;
  const inP = tw(f, a, 10, 'back.out(1.5)');
  const outP = tw(f, b - 6, 6, 'power2.in');

  const spoken = WORDS.filter((w) => w.s >= cur.s - 0.05 && w.s < cur.e);
  const t0 = sec(spoken.length ? spoken[0].s : cur.s);
  const t1 = sec(spoken.length ? spoken[spoken.length - 1].e : cur.e);
  const words = cur.ar.split(' ').filter(Boolean);
  const total = words.reduce((n, w) => n + w.length + 1, 0);
  let acc = 0;
  const starts = words.map((w) => {
    const t = t0 + ((t1 - t0) * acc) / total;
    acc += w.length + 1;
    return t;
  });
  let current = -1;
  starts.forEach((t, i) => {
    if (f >= t - 2) current = i;
  });
  const done = f > t1 + 2;
  const progress = Math.min(1, Math.max(0, (f - t0) / Math.max(1, t1 - t0)));

  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 1452, display: 'flex', justifyContent: 'center', pointerEvents: 'none'}}>
      <div
        style={{
          position: 'relative',
          maxWidth: 940,
          padding: '12px 34px 18px',
          borderRadius: 24,
          background: 'linear-gradient(180deg, rgba(24,19,10,0.82), rgba(8,7,10,0.9))',
          border: '1.5px solid rgba(242,210,122,0.38)',
          boxShadow: '0 22px 60px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 34px rgba(201,151,28,0.18)',
          opacity: Math.min(1, inP * 1.4) * (1 - outP),
          transform: `translateY(${(1 - inP) * 26 - outP * 14}px) scale(${0.92 + 0.08 * Math.min(1, inP)})`,
          filter: inP < 0.95 || outP > 0 ? `blur(${(1 - Math.min(1, inP)) * 8 + outP * 6}px)` : undefined,
        }}
      >
        <div dir="rtl" style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0 14px', direction: 'rtl'}}>
          {words.map((w, i) => {
            const p = tw(f, starts[i] - 2, 8, 'expo.out');
            const live = i === current && !done;
            return (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  fontFamily: theme.fonts.arabic,
                  fontWeight: 800,
                  fontSize: cur.ar.length > 40 ? 38 : 42,
                  lineHeight: 1.55,
                  color: '#FFFFFF',
                  opacity: 0.28 + 0.72 * p,
                  transform: `translateY(${(1 - p) * 10}px) scale(${live ? 1.06 : 1})`,
                  textShadow: live ? undefined : '0 2px 10px rgba(0,0,0,0.6)',
                  filter: live ? 'drop-shadow(0 0 12px rgba(242,210,122,0.55))' : undefined,
                  ...(live ? GOLD_TEXT : {}),
                }}
              >
                {w}
              </span>
            );
          })}
        </div>
        {/* phrase progress, running right → left like the reading direction */}
        <div style={{position: 'absolute', left: 26, right: 26, bottom: 9, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.1)', overflow: 'hidden'}}>
          <div style={{position: 'absolute', right: 0, top: 0, bottom: 0, width: `${progress * 100}%`, background: 'linear-gradient(270deg, #FFF1C1, #F2D27A 40%, #C9971C)', boxShadow: '0 0 10px #F2D27A'}} />
        </div>
      </div>
    </div>
  );
};
