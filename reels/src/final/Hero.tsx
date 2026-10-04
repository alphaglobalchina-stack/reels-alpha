import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, FONT} from '../film/brand';
import {back, Cam, clamp, CX, ease, lerp, noise1, project, ramp, rnd, V3, W} from '../film/lib';
import {CanvasLayer} from '../film/ui';
import {goldLine, Micro} from './kit';
import {BRAND, HERO} from './plan';
import {Item, Stage, wordItem} from './stage';

/**
 * Hero line — reduced to type, light and negative space. A small "مُوَرِّد" floats in the
 * dark; the camera passes it. Then "امتلك · شريكًا · داخل الصين" are built over the beats,
 * "داخل الصين" filling the frame. Slow confident push, one gold sweep. Finally every line of
 * the journey converges into the frame that will hold the ALPHA logo.
 */
const SUP: V3 = [-120, -60, 1300];
const PLAQUE = {x: 540, y: 640, w: 940, h: 330};

export const heroCam = (t: number): Cam => {
  const pass = ramp(t, HERO.sup + 0.25, HERO.own, (x) => x * x);
  const push = ramp(t, HERO.own, BRAND, ease.inOut);
  return {pos: [lerp(60, -40, pass) + noise1(t * 30, 2) * 4 * shake(t), lerp(30, 0, pass), lerp(-200, 1500, pass) + 220 * push], roll: 0.012 * Math.sin(t * 0.7)};
};
const shake = (t: number) => (t > HERO.partner && t < HERO.partner + 0.4 ? Math.pow(1 - (t - HERO.partner) / 0.4, 2) : 0);

export const ShotHero: React.FC<{t: number}> = ({t}) => {
  const cam = heroCam(t);
  const conv = ramp(t, HERO.converge[0], HERO.converge[1], ease.in);
  const sup = ramp(t, HERO.sup - 0.08, HERO.sup + 0.4, (x) => back(x, 1.2));
  const own = ramp(t, HERO.own - 0.05, HERO.own + 0.35, ease.out);
  const par = ramp(t, HERO.partner - 0.04, HERO.partner + 0.36, (x) => back(x, 1.15));
  const ins = ramp(t, HERO.inside - 0.05, HERO.inside + 0.4, (x) => back(x, 1.2));
  const chi = ramp(t, HERO.china - 0.05, HERO.china + 0.4, (x) => back(x, 1.2));
  const zBase = 1500 + 1400; // hero type lives beyond the passed word
  const items: Item[] = [];
  if (sup > 0) items.push(wordItem('sup', 'مُوَرِّد', SUP, 110, {rotY: -18, rotX: 4, opacity: clamp(sup * 1.5) * 0.85}));
  const out = 1 - conv;
  if (own > 0) items.push(wordItem('own', 'امتلك', [0, -560, zBase], 130, {opacity: own * out}));
  if (par > 0) items.push(wordItem('par', 'شريكًا', [0, -230 + (1 - par) * 60, zBase], 290, {face: 'gold', rotX: lerp(16, 3, par), opacity: clamp(par * 1.5) * out, sheen: ramp(t, HERO.partner + 0.1, HERO.partner + 1.4, ease.inOut), scale: lerp(1.4, 1, par)}));
  if (ins > 0) items.push(wordItem('ins', 'داخل', [218, 170 + (1 - ins) * 80, zBase], 172, {rotY: -8, opacity: clamp(ins * 1.5) * out, scale: lerp(1.3, 1, ins)}));
  if (chi > 0) items.push(wordItem('chi', 'الصين', [-232, 170 + (1 - chi) * 80, zBase], 172, {rotY: 8, face: 'gold', opacity: clamp(chi * 1.5) * out, scale: lerp(1.3, 1, chi), sheen: ramp(t, HERO.china + 0.1, HERO.china + 1.2)}));
  return (
    <Stage cam={cam} items={items} bg={`radial-gradient(ellipse 70% 45% at 50% 46%, rgba(201,151,28,${0.09 * par}) 0%, ${C.ink} 70%)`}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1300, display: 'flex', justifyContent: 'center', zIndex: 300000, opacity: ramp(t, HERO.china + 0.2, HERO.china + 0.5) * out}}>
        <Micro text="Your trade partner in China" color="rgba(240,211,138,0.92)" size={20} />
      </div>
      {/* convergence: every route / node / path of the film collapses into the logo frame */}
      {conv > 0 && (
        <div style={{position: 'absolute', inset: 0, zIndex: 400000}}>
          <CanvasLayer
            draw={(ctx) => {
              const per = (u: number) => {
                const L = 2 * (PLAQUE.w + PLAQUE.h);
                let d = u * L;
                const x0 = PLAQUE.x - PLAQUE.w / 2, y0 = PLAQUE.y - PLAQUE.h / 2;
                if (d < PLAQUE.w) return {x: x0 + d, y: y0};
                d -= PLAQUE.w;
                if (d < PLAQUE.h) return {x: x0 + PLAQUE.w, y: y0 + d};
                d -= PLAQUE.h;
                if (d < PLAQUE.w) return {x: x0 + PLAQUE.w - d, y: y0 + PLAQUE.h};
                d -= PLAQUE.w;
                return {x: x0, y: y0 + PLAQUE.h - d};
              };
              for (let i = 0; i < 46; i++) {
                const a = rnd(i * 2.7) * Math.PI * 2;
                const r0 = 900 + rnd(i * 5.1) * 900;
                const start = {x: CX + Math.cos(a) * r0, y: PLAQUE.y + Math.sin(a) * r0 * 1.3};
                const end = per(rnd(i * 3.3));
                const p = clamp(conv * (1.1 + rnd(i) * 0.3) - rnd(i * 3) * 0.1);
                const mid = {x: lerp(start.x, end.x, 0.5) + Math.sin(i) * 160 * (1 - p), y: lerp(start.y, end.y, 0.5) + Math.cos(i) * 160 * (1 - p)};
                goldLine(ctx, [start, mid, end], p, 0.5 + 0.5 * conv, 1.6, true);
              }
              // the frame itself draws as the lines arrive
              const fp = ramp(t, BRAND - 0.18, BRAND);
              if (fp > 0) {
                const pts = Array.from({length: 41}, (_, k) => per(k / 40));
                goldLine(ctx, pts, fp, 1, 2.4, false);
              }
            }}
          />
        </div>
      )}
    </Stage>
  );
};
export {project};
