import React from 'react';
import {Img, staticFile} from 'remotion';
import {getLength, getPointAtLength, getTangentAtLength} from '@remotion/paths';
import {Cam, dofBlur} from './camera';
import {BOARD_BOTTOM, C, CITIES, FOCUS, FeatureIcon, GAP, H, IMG, Rect, T, W} from './data';
import {FEATURE_ICONS, PlaneShadow, PlaneTop, Sparkle} from './icons';
import {Card, IconChip, clamp01, easeInOut, prog, rand} from './ui';

// ───────────────────────────── decorative side columns ─────────────────────────────
// They make the board read as one huge wall (seen at the frame edges and in the final
// zoom-out). No text in them, so nothing competes with the main column.
type Flank = {rect: Rect; kind: 'photo' | 'tone' | 'chip' | 'mark' | 'lines'; img?: string; pos?: string; icon?: FeatureIcon};
const PHOTOS = [IMG.kl, IMG.langkawi, IMG.selangor];
const ICONS: FeatureIcon[] = ['hotel', 'flight', 'breakfast', 'car', 'sim', 'tours'];

export const FLANKS: Flank[] = (() => {
  const out: Flank[] = [];
  const cols = [-792, -396, 1032, 1428];
  const kinds: Flank['kind'][] = ['photo', 'tone', 'chip', 'photo', 'lines', 'mark', 'photo', 'chip', 'tone'];
  cols.forEach((x, ci) => {
    let y = -380 + [120, 0, 60, 180][ci];
    let n = ci * 3;
    while (y < BOARD_BOTTOM + 300) {
      const h = [300, 380, 460, 540, 620][Math.floor(rand(ci * 97 + n * 13) * 5)];
      const kind = kinds[(n + ci * 2) % kinds.length];
      out.push({
        rect: {x, y, w: 364, h},
        kind,
        img: PHOTOS[(n + ci) % 3],
        pos: `${Math.round(20 + rand(n * 7 + ci) * 60)}% ${Math.round(25 + rand(n * 11 + ci) * 50)}%`,
        icon: ICONS[(n * 5 + ci) % ICONS.length],
      });
      y += h + GAP;
      n++;
    }
  });
  return out;
})();

export const FlankCard: React.FC<{fl: Flank; blur: number; i: number}> = ({fl, blur, i}) => {
  const {rect, kind} = fl;
  if (kind === 'photo') {
    return (
      <Card rect={rect} blur={blur} sheen={false} bg="#1A1A1C">
        <Img src={staticFile(fl.img!)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: fl.pos}} />
      </Card>
    );
  }
  if (kind === 'chip') {
    const Icon = FEATURE_ICONS[fl.icon!];
    return (
      <Card rect={rect} blur={blur}>
        <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <IconChip size={170}>
            <Icon id={`fl${i}`} size={130} />
          </IconChip>
        </div>
      </Card>
    );
  }
  if (kind === 'mark') {
    return (
      <Card rect={rect} blur={blur} bg={`linear-gradient(165deg, #F3F1ED, ${C.warm})`}>
        <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <Img src={staticFile(IMG.mark)} style={{width: 150, height: 175, opacity: 0.9}} />
        </div>
      </Card>
    );
  }
  if (kind === 'lines') {
    return (
      <Card
        rect={rect}
        blur={blur}
        bg={`repeating-linear-gradient(135deg, rgba(232,217,181,0.0) 0px, rgba(232,217,181,0.0) 26px, rgba(232,217,181,0.35) 26px, rgba(232,217,181,0.35) 28px), linear-gradient(165deg, #FFFFFF, #F4F2EE)`}
      />
    );
  }
  return (
    <Card rect={rect} blur={blur} bg={`radial-gradient(80% 60% at 70% 30%, rgba(232,217,181,0.55), rgba(232,217,181,0) 70%), linear-gradient(165deg, #F5F3EF, ${C.warm})`}>
      <div style={{position: 'absolute', left: '50%', top: '50%', width: 150, height: 150, marginLeft: -75, marginTop: -75, borderRadius: '50%', border: `2px solid rgba(201,174,120,0.45)`}} />
      <div style={{position: 'absolute', left: '50%', top: '50%', width: 90, height: 90, marginLeft: -45, marginTop: -45, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #FFFFFF, #E8D9B5)'}} />
    </Card>
  );
};

// ───────────────────────────── mid-layer floaters ─────────────────────────────
// Small cut-out tiles that hover between cards (slightly closer to the camera than the board).
type Floater = {x: number; y: number; kind: 'photo' | 'chip' | 'orb'; size: number; img?: string; icon?: FeatureIcon; rot: number};
export const FLOATERS: Floater[] = [
  {x: -40, y: 1140, kind: 'photo', size: 170, img: IMG.langkawi, rot: -8},
  {x: 1030, y: 1700, kind: 'orb', size: 90, rot: 0},
  {x: -36, y: 2390, kind: 'chip', size: 130, icon: 'flight', rot: 8},
  {x: 1040, y: 2990, kind: 'photo', size: 160, img: IMG.selangor, rot: 7},
  {x: -30, y: 3520, kind: 'orb', size: 70, rot: 0},
  {x: 1030, y: 4040, kind: 'chip', size: 120, icon: 'sim', rot: -9},
  {x: -40, y: 4790, kind: 'photo', size: 150, img: IMG.kl, rot: 6},
  {x: 1040, y: 5560, kind: 'orb', size: 80, rot: 0},
];

export const FloaterView: React.FC<{fl: Floater; f: number; cam: Cam; i: number; fade: number}> = ({fl, f, cam, i, fade}) => {
  const k = 0.16; // parallax: moves 16% faster than the board
  const x = fl.x + (fl.x - cam.cx) * k;
  const y = fl.y + (fl.y - cam.cy) * k + Math.sin(f / 22 + i * 1.7) * 12;
  const rot = fl.rot + Math.sin(f / 30 + i) * 3;
  const sz = fl.size * (1 + k);
  const blur = Math.min(4, dofBlur(cam, {x: x - sz / 2, y: y - sz / 2, w: sz, h: sz}, 0.6));
  const common: React.CSSProperties = {position: 'absolute', left: x - sz / 2, top: y - sz / 2, width: sz, height: fl.kind === 'photo' ? sz * 1.25 : sz, transform: `rotate(${rot}deg)`, filter: `blur(${blur.toFixed(2)}px)`, opacity: fade};
  if (fl.kind === 'photo') {
    return (
      <div style={{...common, borderRadius: 28, overflow: 'hidden', border: '6px solid #FFFFFF', boxShadow: '0 30px 50px -20px rgba(28,28,30,0.35)'}}>
        <Img src={staticFile(fl.img!)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </div>
    );
  }
  if (fl.kind === 'chip') {
    const Icon = FEATURE_ICONS[fl.icon!];
    return (
      <div style={{...common, filter: `${common.filter} drop-shadow(0 24px 24px rgba(28,28,30,0.18))`}}>
        <IconChip size={sz}>
          <Icon id={`mf${i}`} size={sz * 0.76} />
        </IconChip>
      </div>
    );
  }
  return (
    <div style={{...common, borderRadius: '50%', background: 'radial-gradient(circle at 32% 28%, #FFFFFF 0%, #F3E9D2 45%, #D5BE8E 100%)', boxShadow: '0 26px 40px -16px rgba(150,120,60,0.35), 0 0 40px rgba(232,217,181,0.5)'}} />
  );
};

// ───────────────────────────── plane over the cities ─────────────────────────────
const top = CITIES[0].rect.y;
export const PLANE_PATH = `M 1320 ${top - 160} C 980 ${top - 20}, 820 ${top + 360}, 560 ${top + 600} S 260 ${top + 1050}, -360 ${top + 1250}`;
const PLANE_LEN = getLength(PLANE_PATH);

export const Plane: React.FC<{f: number}> = ({f}) => {
  const [a, b] = T.plane;
  if (f < a - 1 || f > b + 1) return null;
  const t = prog(f, a, b - a, easeInOut);
  const L = PLANE_LEN * t;
  const p = getPointAtLength(PLANE_PATH, L)!;
  const tg = getTangentAtLength(PLANE_PATH, L)!;
  const ang = (Math.atan2(tg.y, tg.x) * 180) / Math.PI;
  const alt = Math.sin(Math.PI * t); // altitude: closer to camera mid-flight
  const sc = 0.9 + 0.35 * alt;
  const size = 230 * sc;
  const bank = Math.sin(t * Math.PI * 2) * 18;
  const dots = Array.from({length: 26}, (_, i) => {
    const l = L - 40 - i * 34;
    if (l < 0) return null;
    const q = getPointAtLength(PLANE_PATH, l)!;
    return <circle key={i} cx={q.x} cy={q.y} r={5 - i * 0.12} fill="#FFFFFF" opacity={0.85 * (1 - i / 26)} />;
  });
  return (
    <>
      <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1} height={1}>
        {dots}
      </svg>
      {/* ground shadow: offset grows with altitude */}
      <div style={{position: 'absolute', left: p.x + 30 + 70 * alt - size / 2, top: p.y + 50 + 110 * alt - size / 2, transform: `rotate(${ang}deg) scale(${0.9 - 0.15 * alt})`, opacity: 0.22 - 0.08 * alt, filter: `blur(${6 + 8 * alt}px)`}}>
        <PlaneShadow size={size} />
      </div>
      <div style={{position: 'absolute', left: p.x - size / 2, top: p.y - size / 2, transform: `rotate(${ang}deg) rotateX(${bank}deg)`, filter: 'drop-shadow(0 10px 14px rgba(28,28,30,0.25))'}}>
        <PlaneTop size={size} id="plane" />
      </div>
    </>
  );
};

// ───────────────────────────── background layer (slow) ─────────────────────────────
export const Background: React.FC<{cam: Cam}> = ({cam}) => {
  const k = 0.22;
  const ox = -cam.cx * cam.z * k;
  const oy = -cam.cy * cam.z * k;
  const glows = [
    {x: 200, y: 300, r: 900},
    {x: 900, y: 1500, r: 800},
    {x: 100, y: 2600, r: 1000},
    {x: 950, y: 3500, r: 900},
  ];
  const span = 4200;
  return (
    <div style={{position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${C.pearl} 0%, #F4F2EE 100%)`, overflow: 'hidden'}}>
      {glows.map((g, i) => {
        const y = ((((g.y + oy) % span) + span) % span) - 900;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: g.x - g.r / 2 + ox * 0.3,
              top: y - g.r / 2,
              width: g.r,
              height: g.r,
              borderRadius: '50%',
              background: `radial-gradient(closest-side, rgba(232,217,181,${i % 2 ? 0.28 : 0.2}), rgba(232,217,181,0))`,
            }}
          />
        );
      })}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(rgba(28,28,30,0.07) 1.4px, transparent 1.6px)',
          backgroundSize: '46px 46px',
          backgroundPosition: `${ox}px ${oy}px`,
          opacity: 0.55,
        }}
      />
    </div>
  );
};

// ───────────────────────────── foreground layer (fast, out of focus) ─────────────────────────────
const FG = [
  {lane: 40, y: 400, kind: 'chip' as const, icon: 'breakfast' as FeatureIcon, size: 150},
  {lane: 1040, y: 1250, kind: 'orb' as const, size: 110},
  {lane: 30, y: 2300, kind: 'spark' as const, size: 120},
  {lane: 1050, y: 3150, kind: 'chip' as const, icon: 'tours' as FeatureIcon, size: 140},
  {lane: 50, y: 4100, kind: 'orb' as const, size: 90},
  {lane: 1030, y: 4950, kind: 'spark' as const, size: 110},
  {lane: 40, y: 5750, kind: 'chip' as const, icon: 'hotel' as FeatureIcon, size: 140},
];

export const Foreground: React.FC<{f: number; cam: Cam; fade: number}> = ({f, cam, fade}) => {
  const k = 1.55;
  return (
    <div style={{position: 'absolute', inset: 0, pointerEvents: 'none', opacity: fade}}>
      {FG.map((g, i) => {
        const y = FOCUS.y + (g.y - cam.cy) * cam.z * k + Math.sin(f / 26 + i) * 14;
        if (y < -300 || y > H + 300) return null;
        const x = g.lane + Math.sin(f / 34 + i * 2) * 10;
        const sz = g.size;
        const style: React.CSSProperties = {position: 'absolute', left: x - sz / 2, top: y - sz / 2, filter: `blur(${5 + (i % 3) * 1.5}px)`, opacity: 0.85, transform: `rotate(${Math.sin(f / 40 + i) * 10}deg)`};
        if (g.kind === 'chip') {
          const Icon = FEATURE_ICONS[g.icon!];
          return (
            <div key={i} style={style}>
              <IconChip size={sz}>
                <Icon id={`fg${i}`} size={sz * 0.75} />
              </IconChip>
            </div>
          );
        }
        if (g.kind === 'spark') {
          return <Sparkle key={i} size={sz} color={C.champagne} style={style} />;
        }
        return <div key={i} style={{...style, width: sz, height: sz, borderRadius: '50%', background: 'radial-gradient(circle at 32% 28%, #FFFFFF 0%, #F3E9D2 45%, #D5BE8E 100%)'}} />;
      })}
      {/* light particles */}
      {Array.from({length: 34}, (_, i) => {
        const kk = 1.15 + rand(i + 5) * 0.5;
        const span = H + 200;
        const baseY = rand(i * 3 + 1) * 7000;
        const yy = ((((FOCUS.y + (baseY - cam.cy) * cam.z * kk - f * (0.6 + rand(i) * 0.8)) % span) + span) % span) - 100;
        const xx = rand(i * 7 + 2) * W + Math.sin(f / 40 + i) * 18;
        const sz = 4 + rand(i * 11) * 9;
        const tw = 0.5 + 0.5 * Math.sin(f / 9 + i * 3);
        return (
          <div
            key={`p${i}`}
            style={{
              position: 'absolute',
              left: xx,
              top: yy,
              width: sz,
              height: sz,
              borderRadius: '50%',
              background: i % 3 === 0 ? '#FFFFFF' : C.champagne,
              boxShadow: `0 0 ${sz * 2}px ${sz * 0.6}px rgba(232,217,181,0.45)`,
              opacity: (0.18 + 0.3 * tw) * clamp01(1),
              filter: sz > 9 ? 'blur(1.5px)' : undefined,
            }}
          />
        );
      })}
    </div>
  );
};
