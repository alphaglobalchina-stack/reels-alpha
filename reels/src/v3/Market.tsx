import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {C} from '../film/brand';
import {back, Cam, clamp, ease, F, H, keysV, lerp, nearFade, project, ramp, V3, W} from '../film/lib';
import {Extruded, Micro} from './kit';
import {EXT, V} from './plan';

/**
 * Shot 4 — Canton Fair as spatial architecture:
 *   BACKGROUND building (far) · MIDGROUND "السوق" (3-D type) · crowd (mid) · FOREGROUND visitors (near)
 * All four are depth-sorted siblings, so the crowd genuinely passes in front of the word.
 * Fast arrival → controlled slow truck → short hold → the camera pushes through the
 * crowd and the word (photo depth dive) into the hall.
 */
const L = 'film/layers/';
export const cover = (cam0: Cam, z: number, aspect: number, over = 1.3) => {
  const d0 = z - cam0.pos[2];
  const sw = aspect < W / H ? W * over : H * over * aspect;
  const sh = sw / aspect;
  return {w: (sw * d0) / F, h: (sh * d0) / F, p: [cam0.pos[0], cam0.pos[1], z] as V3};
};

export const extCam = (t: number): Cam => {
  const pos = keysV(t, [
    [EXT.start, [300, 90, -1150]],
    [EXT.slow, [-40, 10, -170]],
    [EXT.hold[0], [-190, -10, 160]],
    [EXT.hold[1], [-200, -8, 115]],
    [EXT.push[1], [-60, -30, 2560]],
  ], (x) => x);
  // per-segment easing: fast-out arrival, linear truck, soft hold, accelerating push
  const seg = (a: number, b: number, e: (x: number) => number) => e(clamp((t - a) / (b - a)));
  let p = pos;
  if (t < EXT.slow) {
    const k = seg(EXT.start, EXT.slow, (x) => 1 - Math.pow(1 - x, 2.6));
    p = [lerp(300, -40, k), lerp(90, 10, k), lerp(-1150, -170, k)];
  } else if (t >= EXT.push[0]) {
    const k = seg(EXT.push[0], EXT.push[1], (x) => x * x * x);
    p = [lerp(-200, -60, k), lerp(-8, -30, k), lerp(115, 2560, k)];
  }
  return {pos: p, roll: lerp(0.06, -0.015, ramp(t, EXT.start, EXT.slow + 0.3, ease.out)) + 0.04 * ramp(t, EXT.push[0], EXT.push[1], ease.in)};
};
const EXT0: Cam = {pos: [0, 0, 0]};
const LAYERS: {src: string; z: number}[] = [
  {src: 'exterior_far.webp', z: 2800},
  {src: 'exterior_mid.webp', z: 1950},
  {src: 'exterior_near.webp', z: 1350},
];
const WORD: V3 = [0, 330, 2280];

export const ShotExterior: React.FC<{t: number}> = ({t}) => {
  const cam = extCam(t);
  const rise = ramp(t, V.souq - 0.1, V.souq + 0.22, (x) => back(x, 1.35));
  const push = ramp(t, EXT.push[0], EXT.push[1], ease.in);
  const wp = project(cam, [WORD[0], WORD[1] + (1 - rise) * 520, WORD[2]]);
  const grade = 'saturate(0.68) contrast(1.08) brightness(0.84) sepia(0.05) hue-rotate(-6deg)';
  const labels: [string, V3, number][] = [
    ['Canton Fair', [-330, -560, 1500], V.work + 0.25],
    ['Guangzhou', [300, -420, 1750], V.work + 0.5],
  ];
  return (
    <AbsoluteFill style={{background: C.ink, overflow: 'hidden', isolation: 'isolate'}}>
      {LAYERS.map((l, i) => {
        const c = cover(EXT0, l.z, 1);
        const pr = project(cam, c.p);
        if (pr.d < 30) return null;
        const o = nearFade(pr.d, 40, 260);
        const blur = i === 0 ? 0 : Math.min(14, push * (3 - i) * 6);
        return (
          <div key={l.src} style={{position: 'absolute', left: 0, top: 0, width: c.w, height: c.h, transform: `translate(${pr.x - c.w / 2}px, ${pr.y - c.h / 2}px) scale(${pr.s})`, transformOrigin: '50% 50%', zIndex: Math.round(100000 - pr.d), opacity: o}}>
            <Img src={staticFile(L + l.src)} style={{width: c.w, height: c.h, display: 'block', filter: `${grade}${blur > 0.5 ? ` blur(${(blur / pr.s).toFixed(1)}px)` : ''}`}} />
          </div>
        );
      })}
      {/* the word lives between the building and the crowd */}
      {t > V.souq - 0.12 && wp.d > 40 && (
        <div style={{position: 'absolute', left: wp.x, top: wp.y, transform: `translate(-50%,-50%) scale(${wp.s * 1.05})`, zIndex: Math.round(100000 - wp.d), opacity: clamp(rise * 1.6) * nearFade(wp.d, 40, 300)}}>
          <div style={{filter: 'drop-shadow(0 30px 40px rgba(0,0,0,0.55))'}}>
            <Extruded text="السوق" size={390} rotY={lerp(-28, -10, ramp(t, V.souq, EXT.push[0], ease.soft))} rotX={6} depth={0.16} slices={14} sheen={ramp(t, V.souq + 0.1, V.souq + 1.0, ease.inOut)} />
          </div>
          <div style={{display: 'flex', justifyContent: 'center', marginTop: 4, opacity: ramp(t, V.souq + 0.2, V.souq + 0.45)}}>
            <Micro text="Inside the market" size={20} />
          </div>
        </div>
      )}
      {labels.map(([s, p, t0]) => {
        const pr = project(cam, p);
        const o = ramp(t, t0, t0 + 0.25) * (1 - ramp(t, EXT.hold[0], EXT.hold[0] + 0.2)) * nearFade(pr.d, 40, 300);
        if (o <= 0 || pr.d < 40) return null;
        return (
          <div key={s} style={{position: 'absolute', left: pr.x, top: pr.y, transform: `translate(-50%,-50%) scale(${clamp(pr.s * 1.4, 0.6, 1.6)})`, zIndex: 200000, opacity: o}}>
            <Micro text={s} />
          </div>
        );
      })}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(10,14,24,0.5) 0%, rgba(10,14,24,0) 32%, rgba(10,14,24,0.06) 60%, rgba(8,9,12,0.6) 100%)', zIndex: 300000}} />
    </AbsoluteFill>
  );
};
