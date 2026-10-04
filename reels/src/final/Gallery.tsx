import React from 'react';
import {Img, staticFile} from 'remotion';
import {C, FONT} from '../film/brand';
import {back, Cam, clamp, ease, lerp, project, ramp, rnd, V3} from '../film/lib';
import {CanvasLayer} from '../film/ui';
import {goldLine, Micro} from './kit';
import {GAL} from './plan';
import {ASPECT, GRADE, Item, Stage, wordItem} from './stage';

/**
 * Products / equipment / machinery / production lines — a spatial gallery the camera rushes
 * through (speed ramps that breathe on each spoken word), real imagery on angled walls and
 * floating planes. "خطوط إنتاج" fills the frame and the camera passes through it.
 * Then the gold route draws five clear steps in depth and heads for the globe.
 */
const KZ: [number, number][] = [
  [GAL.start, -700],
  [GAL.whether, 200],
  [GAL.products, 2300],
  [GAL.equip, 3800],
  [GAL.mach, 5300],
  [GAL.lines, 7000],
  [GAL.full + 0.1, 8200],
  [GAL.help, 9300],
  [GAL.sourcing, 9800],
  [GAL.steps - 0.1, 10150],
];
const NODES = [0, 1, 2, 3, 4].map((k): V3 => [Math.sin(k * 1.3) * 240, 160 - k * 50, 11300 + k * 950]);
const stepT = (k: number) => lerp(GAL.steps, GAL.studied + 0.15, k / 4);
const STEPS: [string, string][] = [
  ['Source', 'البحث'],
  ['Negotiate', 'التفاوض'],
  ['Produce', 'الإنتاج'],
  ['Inspect', 'الفحص'],
  ['Ship', 'الشحن'],
];

const camZ = (t: number) => {
  if (t < KZ[KZ.length - 1][0]) {
    for (let i = 0; i < KZ.length - 1; i++) {
      const [a, za] = KZ[i], [b, zb] = KZ[i + 1];
      if (t <= b) return lerp(za, zb, ease.inOut(clamp((t - a) / (b - a))));
    }
  }
  // steps: arrive at each node on its beat, then accelerate out toward the globe
  for (let k = 0; k < 5; k++) {
    const a = k === 0 ? KZ[KZ.length - 1][0] : stepT(k - 1), b = stepT(k);
    const za = k === 0 ? KZ[KZ.length - 1][1] : NODES[k - 1][2] - 900, zb = NODES[k][2] - 900;
    if (t <= b) return lerp(za, zb, ease.inOut(clamp((t - a) / (b - a))));
  }
  return NODES[4][2] - 900 + 2600 * Math.pow(clamp((t - stepT(4)) / (GAL.end + 0.3 - stepT(4))), 2.2);
};
export const galCam = (t: number): Cam => {
  const z = camZ(t);
  const route = ramp(t, GAL.help - 0.3, GAL.steps, ease.inOut);
  const k = clamp((t - GAL.steps) / (GAL.studied + 0.15 - GAL.steps)) * 4;
  const nx = route > 0 ? lerp(0, NODES[Math.min(4, Math.round(k))][0] * 0.6, route) : 0;
  return {pos: [Math.sin(z / 1400) * 120 * (1 - route) + nx, Math.cos(z / 1700) * 60 * (1 - route) - 40 * route, z], yaw: Math.sin(z / 2100) * 0.08 * (1 - route), roll: Math.sin(z / 1900) * 0.05 * (1 - route)};
};

// gallery planes
const SRC = ['hall_far', 'booth_far', 'hall_mid', 'booth_far', 'exterior_far', 'ware_far', 'booth_far', 'pack_far', 'cnc_far', 'factory_far', 'cnc_far', 'line_far', 'factory_far', 'cnc_far', 'line_far', 'pack_far', 'factory_far', 'line_far', 'pack_far', 'line_far'];
const PLANES = SRC.map((src, i) => {
  const name = src.replace(/_(far|mid|near)$/, '');
  const a = ASPECT[name];
  const z = 600 + i * 400;
  const wall = i % 3 !== 2;
  const side = i % 2 ? 1 : -1;
  const h = (a < 1 ? 1500 : 1050) * (wall ? 1 : 0.8);
  const w = h * a;
  return {src, w, h, p: [wall ? side * 560 : side * 420, wall ? (rnd(i) - 0.5) * 260 : (rnd(i * 3) > 0.5 ? -640 : 640), z] as V3, rotY: wall ? side * -66 : side * -22, pos: `${30 + rnd(i * 5) * 40}% 50%`};
});
const WORDS: {ar: string; en: string; t: number; p: V3; size: number}[] = [
  {ar: 'منتجات', en: 'Products', t: GAL.products, p: [0, -430, 3400], size: 150},
  {ar: 'معدات', en: 'Equipment', t: GAL.equip, p: [0, -430, 4900], size: 150},
  {ar: 'مكائن', en: 'Machinery', t: GAL.mach, p: [0, -430, 6400], size: 150},
  {ar: 'خطوط إنتاج', en: 'Production lines', t: GAL.lines, p: [0, -60, 8350], size: 250},
];

export const ShotGallery: React.FC<{t: number}> = ({t}) => {
  const cam = galCam(t);
  const open = ramp(t, GAL.full, GAL.help + 0.3, ease.inOut); // the gallery gives way to the route
  const items: Item[] = PLANES.map((pl, i) => ({
    key: `pl${i}`,
    p: pl.p,
    w: pl.w,
    h: pl.h,
    rotY: pl.rotY,
    opacity: 1 - open * (pl.p[2] > 7000 ? 0 : 1),
    render: () => (
      <div style={{width: pl.w, height: pl.h, borderRadius: 14, overflow: 'hidden', border: '1.5px solid rgba(246,238,222,0.22)', boxShadow: '0 30px 70px rgba(0,0,0,0.6)'}}>
        <Img src={staticFile(`film/layers/${pl.src}.webp`)} style={{width: pl.w, height: pl.h, objectFit: 'cover', objectPosition: pl.pos, filter: GRADE}} />
      </div>
    ),
  }));
  WORDS.forEach((w, i) => {
    const p = ramp(t, w.t - 0.12, w.t + 0.35, (x) => back(x, 1.3)) * (i < 3 ? 1 - ramp(t, WORDS[i + 1].t - 0.25, WORDS[i + 1].t - 0.05) : 1);
    if (p <= 0) return;
    items.push(wordItem(`w${i}`, w.ar, [w.p[0], w.p[1] + (1 - p) * 200, w.p[2]], w.size, {rotY: (i % 2 ? 1 : -1) * lerp(30, 12, p), rotX: 6, opacity: clamp(p * 1.4), sheen: ramp(t, w.t, w.t + 0.9), face: i === 3 ? 'ivory' : 'ivory'}));
    items.push({key: `we${i}`, p: [w.p[0], w.p[1] + w.size * 0.55 + 40, w.p[2]], w: 600, h: 40, opacity: clamp(p * 1.4) * clamp((w.p[2] - cam.pos[2] - 700) / 500), render: () => <div style={{display: 'flex', justifyContent: 'center'}}><Micro text={w.en} size={18} /></div>});
  });
  // steps on the route
  NODES.forEach((n, k) => {
    const on = ramp(t, stepT(k) - 0.1, stepT(k) + 0.15, (x) => back(x, 1.5));
    if (t < GAL.steps - 0.4) return;
    items.push({
      key: `st${k}`,
      p: [n[0], n[1] - 150, n[2]],
      w: 520,
      h: 150,
      opacity: ramp(t, GAL.steps - 0.4, GAL.steps) * (0.35 + 0.65 * on),
      render: () => (
        <div style={{width: 520, height: 150, display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `scale(${0.9 + 0.1 * on})`}}>
          <div style={{fontFamily: FONT.la, fontSize: 18, fontWeight: 800, letterSpacing: '0.4em', color: on > 0.5 ? C.goldLight : 'rgba(246,238,222,0.7)'}}>{`0${k + 1}  ${STEPS[k][0].toUpperCase()}`}</div>
          <div dir="rtl" style={{fontFamily: FONT.ar, fontSize: 54, fontWeight: 800, color: C.white, lineHeight: 1.3}}>{STEPS[k][1]}</div>
        </div>
      ),
    });
  });
  const src = ramp(t, GAL.sourcing - 0.1, GAL.sourcing + 0.4, (x) => back(x, 1.2));
  if (src > 0) items.push(wordItem('sourcing', 'التوريد من الصين', [0, -760 + (1 - src) * 200, 11000], 150, {rotX: 10, opacity: clamp(src * 1.4) * (1 - ramp(t, GAL.steps + 0.6, GAL.steps + 1.0)), sheen: ramp(t, GAL.sourcing, GAL.sourcing + 1)}));
  return (
    <Stage cam={cam} items={items} bg={`radial-gradient(ellipse 80% 55% at 50% 50%, #141a28 0%, ${C.ink} 78%)`}>
      <div style={{position: 'absolute', inset: 0, zIndex: 150000}}>
        <CanvasLayer
          draw={(ctx) => {
            // the signature line runs along the gallery floor, then becomes the step route
            const pts: {x: number; y: number}[] = [];
            const zEnd = Math.min(NODES[4][2] + 3000, cam.pos[2] + 6000);
            for (let z = cam.pos[2] + 120; z <= zEnd; z += 90) {
              const r = clamp((z - 9000) / 2200);
              const x = lerp(Math.sin(z / 800) * 60, interpRoute(z, 0), r);
              const y = lerp(620, interpRoute(z, 1), r);
              const P = project(cam, [x, y, z]);
              if (P.d > 40) pts.push(P);
            }
            goldLine(ctx, pts, 1, 0.9, 2.6, false);
            // depth field of possible routes / nodes around the step path
            const fld = ramp(t, GAL.full, GAL.help + 0.4);
            if (fld > 0) {
              ctx.globalCompositeOperation = 'lighter';
              for (let i = 0; i < 160; i++) {
                const q = project(cam, [(rnd(i * 2.3) - 0.5) * 3400, (rnd(i * 4.1) - 0.5) * 3600, 9000 + rnd(i * 6.7) * 7000]);
                if (q.d < 60) continue;
                const r = 2.2 * Math.max(0.6, q.s * 2);
                ctx.fillStyle = `rgba(246,238,222,${0.35 * fld * (0.5 + 0.5 * Math.sin(t * 3 + i))})`;
                ctx.beginPath();
                ctx.arc(q.x, q.y, r, 0, Math.PI * 2);
                ctx.fill();
              }
              ctx.globalCompositeOperation = 'source-over';
            }
            // step nodes
            NODES.forEach((n, k) => {
              if (t < GAL.steps - 0.4) return;
              const P = project(cam, n);
              if (P.d < 40) return;
              const on = ramp(t, stepT(k) - 0.1, stepT(k) + 0.15);
              ctx.strokeStyle = `rgba(240,211,138,${0.4 + 0.6 * on})`;
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(P.x, P.y, 26 * P.s * (1 + 0.2 * on), 0, Math.PI * 2);
              ctx.stroke();
              if (on > 0) {
                ctx.fillStyle = `rgba(240,211,138,${0.85 * on})`;
                ctx.beginPath();
                ctx.arc(P.x, P.y, 10 * P.s, 0, Math.PI * 2);
                ctx.fill();
              }
            });
          }}
        />
      </div>
    </Stage>
  );
};
const interpRoute = (z: number, axis: 0 | 1) => {
  if (z <= NODES[0][2]) return NODES[0][axis];
  for (let k = 0; k < 4; k++) {
    if (z <= NODES[k + 1][2]) return lerp(NODES[k][axis], NODES[k + 1][axis], (z - NODES[k][2]) / (NODES[k + 1][2] - NODES[k][2]));
  }
  return NODES[4][axis] + (axis === 1 ? (z - NODES[4][2]) * 0.25 : 0);
};
export const galSpeed = (t: number) => {
  const a = galCam(t).pos[2], b = galCam(t + 1 / 60).pos[2];
  return (b - a) * 60;
};
export {project};
