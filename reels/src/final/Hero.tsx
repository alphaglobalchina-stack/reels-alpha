import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, FONT} from '../film/brand';
import {back, Cam, clamp, CX, ease, lerp, noise1, project, ramp, rnd, V3, W} from '../film/lib';
import {CanvasLayer} from '../film/ui';
import {goldLine, Micro} from './kit';
import {BRAND, HERO, SHIP} from './plan';
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
  return {pos: [lerp(60, -40, pass) + noise1(t * 30, 2) * 4 * shake(t), lerp(30, 0, pass), lerp(-200, 1240, pass) + 220 * push + 260 * ramp(t, SHIP.end - 0.1, HERO.sup + 0.25)], roll: 0.012 * Math.sin(t * 0.7)};
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
      {/* the breath: the ship's wake line contracts into one gold point that searches the dark,
          then travels to "مُوَرِّد"; a slow drift through depth keeps the vacuum alive */}
      {t < HERO.own && (
        <div style={{position: 'absolute', inset: 0, zIndex: 140000}}>
          <CanvasLayer
            draw={(ctx) => {
              ctx.globalCompositeOperation = 'lighter';
              const fld = ramp(t, SHIP.end - 0.1, HERO.dont + 0.3) * (1 - ramp(t, HERO.sup + 0.3, HERO.own));
              for (let i = 0; i < 140; i++) {
                const q = project(cam, [(rnd(i * 1.7) - 0.5) * 3000, (rnd(i * 3.9) - 0.5) * 4200, 300 + rnd(i * 5.3) * 5200]);
                if (q.d < 60) continue;
                ctx.fillStyle = `rgba(246,238,222,${0.3 * fld * (0.45 + 0.55 * Math.sin(t * 2.4 + i * 1.3))})`;
                ctx.beginPath();
                ctx.arc(q.x, q.y, Math.max(1, 2.4 * q.s), 0, Math.PI * 2);
                ctx.fill();
              }
              ctx.globalCompositeOperation = 'source-over';
              const c = ramp(t, SHIP.end - 0.05, HERO.dont + 0.15, ease.inOut);
              const go = ramp(t, HERO.sup - 0.32, HERO.sup + 0.02, ease.inOut);
              const sp = project(cam, SUP);
              const px = lerp(CX, sp.x, go), py = lerp(960, sp.y + 70, go);
              const fade = 1 - ramp(t, HERO.sup, HERO.sup + 0.3);
              if (c < 1) goldLine(ctx, [{x: CX, y: lerp(1960, 960, c)}, {x: CX, y: 960}], 1, 1 - c * 0.3, 2.6, false);
              if (fade <= 0) return;
              const g = ctx.createRadialGradient(px, py, 0, px, py, 46);
              g.addColorStop(0, `rgba(255,232,170,${0.9 * fade})`);
              g.addColorStop(0.2, `rgba(240,211,138,${0.45 * fade})`);
              g.addColorStop(1, 'rgba(240,211,138,0)');
              ctx.fillStyle = g;
              ctx.fillRect(px - 50, py - 50, 100, 100);
              for (let k = 0; k < 2; k++) {
                const ph = ((t - HERO.dont) * 1.4 + k * 0.5) % 1;
                if (t < HERO.dont || go > 0.5) continue;
                ctx.strokeStyle = `rgba(240,211,138,${0.45 * (1 - ph) * fade})`;
                ctx.lineWidth = 1.4;
                ctx.beginPath();
                ctx.arc(px, py, 10 + ph * 110, 0, Math.PI * 2);
                ctx.stroke();
              }
            }}
          />
        </div>
      )}
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
