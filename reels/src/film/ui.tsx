import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {C, FONT, goldText} from './brand';
import {Cam, H, W, back, clamp, project, ramp, V3, nearFade} from './lib';

// ── photos ──────────────────────────────────────────────────────────────────
type PhotoProps = {
  src: string;
  w: number;
  h: number;
  /** object-position, e.g. '50% 40%' */
  pos?: string;
  /** extra zoom inside the frame (Ken-Burns without moving the frame) */
  zoom?: number;
  grade?: string;
  style?: React.CSSProperties;
  radius?: number;
};
/** Cover-cropped photo with the film's grade (slightly desaturated, warm, deeper blacks). */
export const Photo: React.FC<PhotoProps> = ({src, w, h, pos = '50% 50%', zoom = 1, grade, style, radius = 0}) => (
  <div style={{width: w, height: h, overflow: 'hidden', position: 'relative', borderRadius: radius, ...style}}>
    <Img
      src={staticFile(src)}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        objectPosition: pos,
        transform: `scale(${zoom})`,
        transformOrigin: pos,
        filter: grade ?? 'saturate(0.82) contrast(1.06) brightness(0.92) sepia(0.08)',
      }}
    />
  </div>
);

// ── projected billboard plane ───────────────────────────────────────────────
type PlaneProps = {
  cam: Cam;
  p: V3;
  w: number;
  h: number;
  rotY?: number; // deg, local tilt
  rotX?: number;
  rotZ?: number;
  opacity?: number;
  /** focus distance for depth-of-field blur (world units); omit = no blur */
  focus?: number;
  dof?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
  near?: number;
};
export const Plane: React.FC<PlaneProps> = ({cam, p, w, h, rotY = 0, rotX = 0, rotZ = 0, opacity = 1, focus, dof = 10, children, style, near = 60}) => {
  const pr = project(cam, p);
  if (pr.d <= near * 0.5) return null;
  const o = opacity * nearFade(pr.d, near, near * 3.5);
  if (o <= 0.003) return null;
  const blur = focus === undefined ? 0 : Math.min(14, (dof * Math.abs(pr.d - focus)) / Math.max(pr.d, 1));
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: w,
        height: h,
        transform: `translate(${pr.x - w / 2}px, ${pr.y - h / 2}px) scale(${pr.s}) perspective(1600px) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg)`,
        transformOrigin: '50% 50%',
        opacity: o,
        zIndex: Math.round(100000 - pr.d),
        filter: blur > 0.4 ? `blur(${blur.toFixed(1)}px)` : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// ── canvas layer ────────────────────────────────────────────────────────────
export const CanvasLayer: React.FC<{draw: (ctx: CanvasRenderingContext2D) => void; style?: React.CSSProperties; scale?: number}> = ({draw, style, scale = 1}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    draw(ctx);
  });
  return <canvas ref={ref} width={W * scale} height={H * scale} style={{position: 'absolute', inset: 0, width: W, height: H, ...style}} />;
};

const sprites = new Map<string, HTMLCanvasElement>();
/** Pre-rendered soft glow sprite (radial falloff) for additive particles. */
export const glowSprite = (color: string, core = 0.18) => {
  const key = color + core;
  const hit = sprites.get(key);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, '#ffffff');
  gr.addColorStop(core, color);
  gr.addColorStop(0.45, color.replace(/[\d.]+\)$/, '0.22)'));
  gr.addColorStop(1, color.replace(/[\d.]+\)$/, '0)'));
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  sprites.set(key, c);
  return c;
};
export const GOLD_RGBA = 'rgba(226,182,80,1)';
export const WHITE_RGBA = 'rgba(255,244,220,1)';
export const RED_RGBA = 'rgba(232,64,47,1)';

// ── typography ──────────────────────────────────────────────────────────────
type ArProps = {size: number; weight?: number; color?: string; gold?: boolean; shimmer?: number; style?: React.CSSProperties; children: React.ReactNode; lh?: number};
/** Arabic text: RTL, no letter-spacing, never broken mid-word. */
export const Ar: React.FC<ArProps> = ({size, weight = 800, color = C.white, gold, shimmer = 0, style, children, lh = 1.25}) => (
  <div
    dir="rtl"
    style={{
      fontFamily: FONT.ar,
      fontSize: size,
      fontWeight: weight,
      lineHeight: lh,
      letterSpacing: 0,
      whiteSpace: 'nowrap',
      textAlign: 'center',
      color,
      ...(gold ? goldText(shimmer) : {}),
      ...style,
    }}
  >
    {children}
  </div>
);

/** Small tracked Latin label. */
export const La: React.FC<{size?: number; weight?: number; color?: string; track?: number; style?: React.CSSProperties; children: React.ReactNode; gold?: boolean}> = ({
  size = 22,
  weight = 600,
  color = C.goldLight,
  track = 0.32,
  style,
  children,
  gold,
}) => (
  <div
    style={{
      fontFamily: FONT.la,
      fontSize: size,
      fontWeight: weight,
      letterSpacing: `${track}em`,
      color,
      whiteSpace: 'nowrap',
      textTransform: 'uppercase',
      ...(gold ? goldText(0.4) : {}),
      ...style,
    }}
  >
    {children}
  </div>
);

/** Reveal wrapper: blur-to-sharp, rise, slight overshoot on scale. Returns null before start. */
export const Reveal: React.FC<{t: number; at: number; dur?: number; out?: number; outDur?: number; rise?: number; blur?: number; from?: number; children: React.ReactNode; style?: React.CSSProperties; overshoot?: number}> = ({
  t,
  at,
  dur = 0.55,
  out,
  outDur = 0.35,
  rise = 26,
  blur = 14,
  from = 0.92,
  overshoot = 1.4,
  children,
  style,
}) => {
  if (t < at) return null;
  const p = ramp(t, at, at + dur, (x) => back(x, overshoot));
  const pf = ramp(t, at, at + dur * 0.75);
  const o = out !== undefined ? 1 - ramp(t, out, out + outDur, (x) => x * x) : 1;
  if (o <= 0) return null;
  const bl = (1 - pf) * blur + (out !== undefined ? ramp(t, out, out + outDur) * blur * 0.6 : 0);
  return (
    <div
      style={{
        opacity: clamp(pf * 1.3) * o,
        transform: `translateY(${(1 - p) * rise}px) scale(${from + (1 - from) * p})`,
        filter: bl > 0.3 ? `blur(${bl.toFixed(1)}px)` : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** Centered absolute block at a y position. */
export const At: React.FC<{y: number; x?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({y, x = W / 2, children, style}) => (
  <div style={{position: 'absolute', left: x, top: y, transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', ...style}}>{children}</div>
);

/** Thin gold rule that draws from the centre. */
export const Rule: React.FC<{t: number; at: number; w?: number; dur?: number; color?: string; thick?: number}> = ({t, at, w = 220, dur = 0.6, color = C.gold, thick = 2}) => {
  const p = ramp(t, at, at + dur);
  return <div style={{width: w * p, height: thick, background: `linear-gradient(90deg, transparent, ${color}, transparent)`, opacity: p}} />;
};

/** Glass card surface. */
export const glass = (alpha = 0.42, border = 'rgba(233,207,143,0.42)'): React.CSSProperties => ({
  background: `linear-gradient(160deg, rgba(30,32,38,${alpha + 0.12}) 0%, rgba(12,13,16,${alpha + 0.2}) 100%)`,
  border: `1.5px solid ${border}`,
  borderRadius: 26,
  boxShadow: '0 30px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08)',
});

/** Dark gradient for legibility over photos. */
export const Shade: React.FC<{top?: number; bottom?: number; mid?: number}> = ({top = 0.55, bottom = 0.75, mid = 0.15}) => (
  <AbsoluteFill
    style={{
      background: `linear-gradient(180deg, rgba(7,8,10,${top}) 0%, rgba(7,8,10,${mid}) 38%, rgba(7,8,10,${mid}) 58%, rgba(7,8,10,${bottom}) 100%)`,
    }}
  />
);
