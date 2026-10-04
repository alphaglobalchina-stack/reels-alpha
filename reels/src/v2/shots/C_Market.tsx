import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {C, FONT} from '../../film/brand';
import {back, Cam, clamp, CX, CY, ease, F, H, lerp, project, ramp, V3, W} from '../../film/lib';
import {Ar, La, Plane} from '../../film/ui';
import {Warp} from '../engine';
import {at} from '../t2';
import {B} from './B_Globe';

/**
 * Shot C — Canton Fair exterior in real depth layers (far / mid / near people), the camera
 * travels between them; "السوق" arrives as a 3-D word filled with the hall, and the camera
 * flies through the letters (text portal) into a corridor of depth layers.
 * Shot D — corridor rush (fast → slow → fast) with fly-by labels; a visitor crossing the
 * lens hides the cut into the supplier network.
 */
const T_WORK = at('نعمل');
const T_INSIDE = at('داخل');
const T_SOUQ = at('السوق');
const T_SELF = at('نفسه');
const T_SEARCH = at('نبحث');
const T_SUPS = at('الموردين');

export const C_START = B.end - 0.25;
export const PORTAL = {a: T_SOUQ - 0.12, land: T_SOUQ + 0.18, go: T_SELF + 0.02, full: T_SELF + 0.36};
export const D_END = T_SUPS - 0.06; // occluder fully covers the frame here
export const OCC = {a: D_END - 0.24, b: D_END + 0.2};

// Souq glyph anchor (inside the thick baseline stroke) — calibrated from a render (see SouqCalib)
export const SOUQ = {x: 540, y: 1010, size: 270, cx: 533, cy: 947, ax: 579, ay: 983};

const L = 'film/layers/';
type Layer = {src: string; z: number};

/** Size + place a plane so every layer covers the same screen rect from a reference camera. */
const cover = (cam0: Cam, z: number, aspect: number, over = 1.3) => {
  const d0 = z - cam0.pos[2];
  const sw = aspect < W / H ? W * over : H * over * aspect;
  const sh = sw / aspect;
  return {w: (sw * d0) / F, h: (sh * d0) / F, p: [cam0.pos[0], cam0.pos[1], z] as V3};
};

const Layered: React.FC<{cam: Cam; cam0: Cam; layers: Layer[]; aspect: number; dofFocus?: number; grade?: string; dx?: number}> = ({cam, cam0, layers, aspect, dofFocus, grade, dx = 0}) => (
  <AbsoluteFill style={{isolation: 'isolate'}}>
    {layers.map((l, i) => {
      const c = cover(cam0, l.z, aspect);
      return (
        <Plane key={i} cam={cam} p={[c.p[0] + dx * (l.z / 2000), c.p[1], c.p[2]]} w={c.w} h={c.h} focus={dofFocus} dof={7} near={40}>
          <Img src={staticFile(L + l.src)} style={{width: c.w, height: c.h, display: 'block', filter: grade ?? 'saturate(0.85) contrast(1.07) brightness(0.88) sepia(0.08)'}} />
        </Plane>
      );
    })}
  </AbsoluteFill>
);

// ── exterior ──────────────────────────────────────────────────────────────────
const extCam = (t: number): Cam => {
  // continuous push + lateral truck (real parallax between the layers); fast out of the haze
  const a = ramp(t, C_START, PORTAL.go, (x) => 1 - Math.pow(1 - x, 1.35));
  const b = ramp(t, PORTAL.go, PORTAL.full, (x) => x * x);
  return {pos: [lerp(-300, 220, a), lerp(60, -50, a), lerp(-800, 420, a) + 520 * b], roll: lerp(0.07, -0.025, a)};
};
const EXT0: Cam = {pos: [0, 0, 0]};
const EXT: Layer[] = [
  {src: 'exterior_far.webp', z: 2800},
  {src: 'exterior_mid.webp', z: 2000},
  {src: 'exterior_near.webp', z: 1250},
];

// ── hall corridor ───────────────────────────────────────────────────────────────
const hallCam = (t: number): Cam => {
  // speed ramp: fast → slow (on "نبحث") → fast into the occluder
  const k1 = ramp(t, PORTAL.go, T_SEARCH - 0.02, (x) => 1 - Math.pow(1 - x, 2.4));
  const k2 = ramp(t, T_SEARCH - 0.02, OCC.a, ease.linear);
  const k3 = ramp(t, OCC.a, OCC.b, (x) => x * x);
  const z = -700 + 820 * k1 + 160 * k2 + 900 * k3;
  return {pos: [lerp(80, -40, k1 + k2 * 0.5), lerp(20, -10, k1), z], roll: lerp(-0.06, 0.015, k1) + 0.05 * k3, yaw: 0.04 * k3};
};
const HALL0: Cam = {pos: [0, 0, 0]};
const HALL: Layer[] = [
  {src: 'hall_far.webp', z: 2600},
  {src: 'hall_mid.webp', z: 1850},
  {src: 'hall_near.webp', z: 1150},
];
const FLY: [string, V3][] = [
  ['Suppliers', [-330, -470, 600]],
  ['Factories', [360, -250, 820]],
  ['Products', [-380, 260, 1000]],
  ['China', [340, 470, 1250]],
];

const HallWorld: React.FC<{t: number}> = ({t}) => {
  const cam = hallCam(t);
  return (
    <AbsoluteFill style={{background: C.ink, overflow: 'hidden', isolation: 'isolate'}}>
      <Layered cam={cam} cam0={HALL0} layers={HALL} aspect={941 / 1672} />
      {/* side walls: booth imagery receding */}
      <Plane cam={cam} p={[-900, 0, 1300]} w={900} h={1500} rotY={72} near={40} focus={1200} dof={8}>
        <Img src={staticFile(L + 'booth_far.webp')} style={{width: 900, height: 1500, objectFit: 'cover', filter: 'brightness(0.6) saturate(0.8)'}} />
      </Plane>
      <Plane cam={cam} p={[900, 0, 1500]} w={900} h={1500} rotY={-72} near={40} focus={1200} dof={8}>
        <Img src={staticFile(L + 'exterior_far.webp')} style={{width: 900, height: 1500, objectFit: 'cover', objectPosition: '20% 50%', filter: 'brightness(0.55) saturate(0.8)'}} />
      </Plane>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(7,8,10,0.5) 0%, rgba(7,8,10,0) 30%, rgba(7,8,10,0) 65%, rgba(7,8,10,0.6) 100%)'}} />
      {FLY.map(([s, p], i) => {
        const pr = project(cam, p);
        if (pr.d < 30) return null;
        const o = clamp((pr.d - 30) / 200) * ramp(t, PORTAL.full - 0.1 + i * 0.03, PORTAL.full + 0.1 + i * 0.03);
        return (
          <div key={s} style={{position: 'absolute', left: pr.x, top: pr.y, transform: `translate(-50%,-50%) scale(${pr.s})`, opacity: o, zIndex: 200000}}>
            <La size={58} track={0.36} color={C.white} weight={800} style={{textShadow: '0 4px 24px rgba(0,0,0,0.8)'}}>
              {s}
            </La>
            <div style={{height: 3, background: `linear-gradient(90deg, ${C.gold}, transparent)`, marginTop: 6}} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const souqTransform = (t: number) => {
  const land = ramp(t, PORTAL.a, PORTAL.land, (x) => back(x, 1.5));
  const zoom = ramp(t, PORTAL.go, PORTAL.full, (x) => Math.pow(x, 3.2));
  const S = lerp(0.35, 1.18, land) * Math.exp(zoom * 4.1);
  // anchor travels from "word centred" to "anchor centred" as we dive in
  const ax = CX + (SOUQ.ax - SOUQ.cx) * S * (1 - zoom);
  const ay = CY - 80 + (SOUQ.ay - SOUQ.cy) * S * (1 - zoom) + 80 * zoom;
  const rot = lerp(-9, 0, land) + lerp(0, 4, zoom);
  return {S, land, zoom, str: `translate(${ax} ${ay}) rotate(${rot}) scale(${S}) translate(${-SOUQ.ax} ${-SOUQ.ay})`};
};

const SouqText: React.FC<Record<string, unknown>> = (props) => (
  <text x={SOUQ.x} y={SOUQ.y} fontFamily={FONT.ar} fontWeight={900} fontSize={SOUQ.size} textAnchor="middle" {...props}>
    السوق
  </text>
);

export const ShotC: React.FC<{t: number}> = ({t}) => {
  const cam = extCam(t);
  const st = souqTransform(t);
  const inPortal = t >= PORTAL.a;
  const full = t >= PORTAL.full;
  if (full) return <HallWorld t={t} />;
  return (
    <AbsoluteFill style={{background: C.ink, overflow: 'hidden', isolation: 'isolate'}}>
      <AbsoluteFill style={{isolation: 'isolate', filter: st.zoom > 0.02 ? `blur(${st.zoom * 6}px) brightness(${1 - st.zoom * 0.4})` : undefined}}>
        <Layered cam={cam} cam0={EXT0} layers={EXT} aspect={1} dx={-120} />
        <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(7,8,10,0.55) 0%, rgba(7,8,10,0) 30%, rgba(7,8,10,0.1) 60%, rgba(7,8,10,0.7) 100%)'}} />
      </AbsoluteFill>
      {/* "on the ground" labels flying past */}
      {[
        ['Canton Fair', -260, 380, T_WORK + 0.05],
        ['Guangzhou', 250, 520, T_WORK + 0.2],
      ].map(([s, x, y, t0]) => {
        const p = ramp(t, t0 as number, (t0 as number) + 1.1, ease.in);
        if (p <= 0 || p >= 1) return null;
        return (
          <div key={s as string} style={{position: 'absolute', left: CX + (x as number) * (1 + p * 1.6), top: (y as number) - p * 60, transform: `translate(-50%,-50%) scale(${0.7 + p * 1.8})`, opacity: Math.sin(Math.PI * p), filter: `blur(${p * p * 6}px)`}}>
            <La size={30} track={0.5} color={C.goldLight} weight={700}>
              {s as string}
            </La>
          </div>
        );
      })}
      {/* Arabic "inside" word riding the camera move */}
      {t > T_INSIDE - 0.05 && t < PORTAL.a + 0.1 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 560, display: 'flex', justifyContent: 'center', opacity: ramp(t, T_INSIDE - 0.05, T_INSIDE + 0.1) * (1 - ramp(t, PORTAL.a - 0.05, PORTAL.a + 0.1)), transform: `scale(${lerp(1.6, 1, ramp(t, T_INSIDE - 0.05, T_INSIDE + 0.25, (x) => back(x, 1.6)))})`}}>
          <Ar size={110} weight={800} color={C.white} style={{textShadow: '0 8px 30px rgba(0,0,0,0.8)'}}>
            من داخل
          </Ar>
        </div>
      )}
      {/* السوق — the word is a window into the hall; we fly through it */}
      {inPortal && (
        <>
          <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
            <defs>
              <clipPath id="souqClip" clipPathUnits="userSpaceOnUse">
                <SouqText transform={st.str} />
              </clipPath>
            </defs>
          </svg>
          <AbsoluteFill style={{clipPath: 'url(#souqClip)'}}>
            <HallWorld t={t} />
          </AbsoluteFill>
          <AbsoluteFill style={{background: 'radial-gradient(ellipse 55% 14% at 50% 47%, rgba(7,8,10,0.6) 0%, rgba(7,8,10,0) 100%)', opacity: st.land * (1 - st.zoom)}} />
          <svg width={W} height={H} style={{position: 'absolute', inset: 0, filter: 'drop-shadow(0 0 18px rgba(240,200,110,0.6))', opacity: 1 - ramp(t, PORTAL.go + 0.1, PORTAL.full - 0.05)}}>
            <defs>
              <linearGradient id="souqGold" x1="0" x2="1">
                <stop offset="0" stopColor="#8A6512" />
                <stop offset="0.45" stopColor="#F6E2A6" />
                <stop offset="1" stopColor="#B7871A" />
              </linearGradient>
            </defs>
            <SouqText transform={st.str} fill="none" stroke="url(#souqGold)" strokeWidth={6 / Math.max(1, st.S * 0.6)} />
          </svg>
          <div style={{position: 'absolute', left: 0, right: 0, top: CY + 230, display: 'flex', justifyContent: 'center', opacity: st.land * (1 - ramp(t, PORTAL.go, PORTAL.go + 0.15))}}>
            <La size={24} track={0.6} color={C.white}>
              Inside the market
            </La>
          </div>
        </>
      )}
      <Warp t={t} k={st.zoom * 1.3} seed={7} />
    </AbsoluteFill>
  );
};

/** A visitor crosses the lens (object occlusion) — hides the cut into the network. */
export const Occluder: React.FC<{t: number}> = ({t}) => {
  if (t < OCC.a || t > OCC.b) return null;
  const p = ramp(t, OCC.a, OCC.b, ease.inOut);
  const x = lerp(W + 700, -1500, p);
  const h = H * 2.3;
  return (
    <AbsoluteFill style={{pointerEvents: 'none', zIndex: 700000}}>
      <div style={{position: 'absolute', left: x, top: -H * 0.35, height: h, width: h, filter: 'url(#whip) brightness(0.25) saturate(0.5)'}}>
        <Img src={staticFile(L + 'booth_person.webp')} style={{height: h, width: h, objectFit: 'contain', objectPosition: '0% 50%'}} />
      </div>
      <div style={{position: 'absolute', left: x + h * 0.08, top: 0, width: h * 0.32, height: H, background: '#050506', filter: 'blur(30px)', opacity: clamp(1 - Math.abs(p - 0.5) * 2.6)}} />
    </AbsoluteFill>
  );
};

/** Calibration helper: the bare SVG word (white on black) to locate a thick-stroke anchor. */
export const SouqCalib: React.FC = () => (
  <AbsoluteFill style={{background: '#000'}}>
    <svg width={W} height={H}>
      <SouqText fill="#fff" />
    </svg>
  </AbsoluteFill>
);
