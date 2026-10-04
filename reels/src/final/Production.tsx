import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {C, FONT} from '../film/brand';
import {back, Cam, clamp, CX, CY, ease, H, lerp, mix3, project, ramp, V3, W} from '../film/lib';
import {CanvasLayer} from '../film/ui';
import {goldLine, Micro, recoil} from './kit';
import {INSP, PROD} from './plan';
import {coverSize, GRADE, Item, photoLayers, Stage, wordItem} from './stage';

/**
 * Sample → production: the catalogue / sample review in depth, "العَيِّنَة" between the
 * layers; the camera dives into the catalogue page and lands in the real factory (photo
 * depth dive). "الإنتاج" — the gold line becomes the production path that guides the camera,
 * machinery passes close to the lens.
 */
const ZF = 6400; // factory world starts beyond the catalogue
// catalogue page position inside cmp (image fractions)
const cmpMid = coverSize(1900, 0.558);
const PAGE: V3 = [-cmpMid.w / 2 + 0.56 * cmpMid.w, -cmpMid.h / 2 + 0.74 * cmpMid.h, 1900];
const DIVE: [number, number] = [PROD.sample + 0.55, PROD.prod - 0.02];

export const prodCam = (t: number): Cam => {
  const arrive = ramp(t, PROD.start, PROD.follow + 0.5, (x) => 1 - Math.pow(1 - x, 2.5));
  const drift = ramp(t, PROD.follow, DIVE[0], ease.inOut);
  const dive = ramp(t, DIVE[0], DIVE[1], (x) => x * x * x);
  const fac = ramp(t, DIVE[1], PROD.end + 0.25, (x) => 1 - Math.pow(1 - x, 1.6));
  const a: V3 = [lerp(220, 40, arrive) - 120 * drift, lerp(-60, 40, drift), lerp(-800, 120, arrive) + 220 * drift];
  const b: V3 = [PAGE[0] * 0.95, PAGE[1] * 0.95, PAGE[2] - 30];
  const p1 = mix3(a, b, dive);
  const f: V3 = [lerp(PAGE[0] * 0.95, -60, fac), lerp(PAGE[1] * 0.95, -40, fac), ZF - 1500 + 2300 * fac];
  const p = t < DIVE[1] ? p1 : f;
  return {pos: p, yaw: t < DIVE[1] ? lerp(0.06, -0.04, drift) : lerp(-0.1, 0.08, fac), roll: t < DIVE[1] ? 0.02 * Math.sin(drift * Math.PI) + 0.05 * dive : lerp(0.05, -0.02, fac)};
};

export const ShotProduction: React.FC<{t: number}> = ({t}) => {
  const cam = prodCam(t);
  const inFactory = t >= DIVE[1];
  const sample = ramp(t, PROD.sample - 0.08, PROD.sample + 0.4, (x) => back(x, 1.3));
  const prod = ramp(t, PROD.prod - 0.06, PROD.prod + 0.4, (x) => back(x, 1.3));
  const items: Item[] = [];
  if (!inFactory) {
    items.push(...photoLayers('cmp', 2600, 1900, 1300));
    if (sample > 0) items.push(wordItem('sample', 'العَيِّنَة', [120, -560 + (1 - sample) * 240, 2250], 210, {rotY: lerp(-30, -12, sample), rotX: 6, opacity: clamp(sample * 1.4), sheen: ramp(t, PROD.sample, PROD.sample + 0.9)}));
  } else {
    items.push(...photoLayers('line', ZF + 2600, ZF + 1900, ZF + 1300));
    // machinery passing close to the lens
    const cnc = coverSize(900, 1.34, 0.9);
    items.push({key: 'cnc', p: [760, -80, ZF - 200], w: cnc.w, h: cnc.h, rotY: -58, render: () => <Img src={staticFile('film/layers/cnc_far.webp')} style={{width: cnc.w, height: cnc.h, filter: GRADE}} />});
    const pk = coverSize(900, 0.805, 0.9);
    items.push({key: 'pack', p: [-820, 60, ZF + 350], w: pk.w, h: pk.h, rotY: 60, render: () => <Img src={staticFile('film/layers/pack_far.webp')} style={{width: pk.w, height: pk.h, filter: GRADE}} />});
    if (prod > 0) items.push(wordItem('prod', 'الإنتاج', [-80, -520 + (1 - prod) * 220, ZF + 2150], 230, {rotY: lerp(26, 10, prod), rotX: 6, opacity: clamp(prod * 1.4), sheen: ramp(t, PROD.prod, PROD.prod + 0.9)}));
  }
  return (
    <Stage cam={cam} items={items} bg={C.ink}>
      <div style={{position: 'absolute', inset: 0, zIndex: 150000}}>
        <CanvasLayer
          draw={(ctx) => {
            if (!inFactory) {
              // the gold line checks the sample on the catalogue page
              const y = PAGE[1] - 80;
              const pts = [[-1200, y + 200, 1700], [PAGE[0] - 420, y, 1880], [PAGE[0] - 60, y + 40, 1890], PAGE].map((p) => project(cam, p as V3));
              goldLine(ctx, pts, ramp(t, PROD.follow + 0.1, DIVE[0] + 0.1, ease.inOut), 1, 2.4);
            } else {
              // production path on the factory floor, drawn ahead of the camera
              const pts: {x: number; y: number}[] = [];
              for (let z = ZF - 1400; z <= ZF + 2600; z += 80) {
                const P = project(cam, [Math.sin((z - ZF) / 900) * 120 - 40, 560, z]);
                if (P.d > 40) pts.push(P);
              }
              const lift = ramp(t, PROD.end - 0.2, PROD.end + 0.3, ease.in); // becomes the scanning beam
              goldLine(ctx, pts, ramp(t, DIVE[1], PROD.coord + 0.2, ease.out), 1 - lift * 0.8, 3);
              if (lift > 0) goldLine(ctx, [{x: -40, y: lerp(1500, CY, lift)}, {x: W + 40, y: lerp(1500, CY, lift)}], 1, lift, 3, false);
            }
          }}
        />
      </div>
      <div style={{position: 'absolute', left: 84, top: 300, zIndex: 300000, opacity: ramp(t, PROD.follow + 0.1, PROD.follow + 0.3) * (1 - ramp(t, DIVE[0], DIVE[0] + 0.2))}}>
        <Micro text="Sample" />
      </div>
      <div style={{position: 'absolute', left: 84, top: 300, zIndex: 300000, opacity: ramp(t, PROD.prod + 0.1, PROD.prod + 0.3) * (1 - ramp(t, PROD.end - 0.2, PROD.end))}}>
        <Micro text="Production" />
      </div>
      <div style={{position: 'absolute', inset: 0, zIndex: 120000, background: 'linear-gradient(180deg, rgba(10,14,24,0.45) 0%, rgba(10,14,24,0) 28%, rgba(10,14,24,0.06) 62%, rgba(8,9,12,0.55) 100%)'}} />
    </Stage>
  );
};

/**
 * Inspection — a brief freeze on the inspector; the signature line is the scanning beam;
 * premium industrial QC marks; one gold VERIFIED confirmation; push through the check.
 */
const SEAL: V3 = [0, 260, 1150];
export const inspCam = (t: number): Cam => {
  const arrive = ramp(t, INSP.start, INSP.insp, (x) => 1 - Math.pow(1 - x, 2.2));
  const push = ramp(t, INSP.insp + 0.45, INSP.push[0], ease.inOut); // after the freeze
  const thr = ramp(t, INSP.push[0], INSP.push[1], (x) => x * x * x);
  const base: V3 = [lerp(-160, 0, arrive) + 70 * push, lerp(40, 0, arrive), lerp(-500, -40, arrive) + 380 * push + recoil(t, INSP.match, 40)];
  return {pos: mix3(base, [SEAL[0], SEAL[1], SEAL[2] - 40], thr), yaw: lerp(0.06, 0, arrive) - 0.03 * push, roll: 0};
};
const MARKS: {en: string; x: number; y: number; w: number; h: number; t: number}[] = [
  {en: 'Dimensions', x: 0.58, y: 0.36, w: 0.3, h: 0.24, t: INSP.preship - 0.3},
  {en: 'Material', x: 0.12, y: 0.52, w: 0.26, h: 0.2, t: INSP.preship + 0.25},
  {en: 'Packing', x: 0.06, y: 0.8, w: 0.3, h: 0.12, t: INSP.ensure + 0.1},
];

export const ShotInspection: React.FC<{t: number}> = ({t}) => {
  const cam = inspCam(t);
  const hero = ramp(t, INSP.insp - 0.06, INSP.insp + 0.4, (x) => back(x, 1.3));
  const scan = ramp(t, INSP.insp + 0.1, INSP.ensure + 0.5, ease.inOut);
  const ver = ramp(t, INSP.match - 0.04, INSP.match + 0.3, (x) => back(x, 1.6));
  const mid = coverSize(1900, 0.558);
  const items: Item[] = [...photoLayers('insp', 2600, 1900, 1300)];
  if (hero > 0) items.push(wordItem('insp', 'الفحص', [120, -600 + (1 - hero) * 200, 1120], 150, {rotY: lerp(-26, -8, hero), rotX: 6, opacity: clamp(hero * 1.4), sheen: ramp(t, INSP.insp, INSP.insp + 0.9)}));
  if (ver > 0)
    items.push({
      key: 'seal',
      p: SEAL,
      w: 360,
      h: 360,
      near: 30,
      render: () => (
        <div style={{width: 360, height: 360, borderRadius: 180, background: 'radial-gradient(circle, rgba(16,14,10,0.9) 0%, rgba(10,9,8,0.86) 70%)', border: `3px solid ${C.goldLight}`, boxShadow: `0 0 0 8px rgba(201,151,28,0.16), 0 0 ${70 * (1 - ramp(t, INSP.match, INSP.match + 0.9))}px rgba(226,182,80,0.55)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: `scale(${lerp(1.4, 1, ver)})`, opacity: clamp(ver * 1.6)}}>
          <svg width={110} height={90} viewBox="0 0 48 40">
            <path d="M8 21l10 10L40 8" fill="none" stroke={C.goldLight} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={50} strokeDashoffset={50 * (1 - ramp(t, INSP.match + 0.06, INSP.match + 0.36))} />
          </svg>
          <div style={{fontFamily: FONT.la, fontWeight: 800, fontSize: 26, letterSpacing: '0.34em', color: C.white, marginTop: 6}}>VERIFIED</div>
        </div>
      ),
    });
  return (
    <Stage cam={cam} items={items} bg={C.ink}>
      <div style={{position: 'absolute', inset: 0, zIndex: 150000}}>
        <CanvasLayer
          draw={(ctx) => {
            // QC marks pinned to the mid layer (premium industrial, thin ivory → gold when passed)
            MARKS.forEach((m) => {
              const p = ramp(t, m.t, m.t + 0.25, ease.out);
              if (p <= 0) return;
              const ok = ramp(t, m.t + 0.45, m.t + 0.6);
              const a = project(cam, [-mid.w / 2 + m.x * mid.w, -mid.h / 2 + m.y * mid.h, 1900]);
              const b = project(cam, [-mid.w / 2 + (m.x + m.w) * mid.w, -mid.h / 2 + (m.y + m.h) * mid.h, 1900]);
              const col = ok > 0.5 ? `rgba(240,211,138,${p})` : `rgba(246,238,222,${0.85 * p})`;
              const L = 22;
              ctx.strokeStyle = col;
              ctx.lineWidth = 2;
              for (const [x, y, dx, dy] of [[a.x, a.y, 1, 1], [b.x, a.y, -1, 1], [b.x, b.y, -1, -1], [a.x, b.y, 1, -1]]) {
                ctx.beginPath();
                ctx.moveTo(x, y + dy * L);
                ctx.lineTo(x, y);
                ctx.lineTo(x + dx * L, y);
                ctx.stroke();
              }
              ctx.fillStyle = 'rgba(8,8,10,0.72)';
              ctx.fillRect(a.x, a.y - 34, 196, 26);
              ctx.fillStyle = col;
              ctx.font = `700 14px Montserrat`;
              ctx.fillText(`${m.en.toUpperCase()}${ok > 0.5 ? '  ✓' : ''}`, a.x + 10, a.y - 16);
            });
            // the scanning beam = the signature line
            if (scan > 0 && scan < 1) {
              const y = lerp(CY, 300, Math.min(1, scan * 2.2)) + lerp(0, 1220, Math.max(0, (scan - 0.45) / 0.55));
              const g = ctx.createLinearGradient(0, y - 120, 0, y);
              g.addColorStop(0, 'rgba(240,211,138,0)');
              g.addColorStop(1, 'rgba(240,211,138,0.12)');
              ctx.fillStyle = g;
              ctx.fillRect(0, y - 120, W, 120);
              goldLine(ctx, [{x: -40, y}, {x: W + 40, y}], 1, 1, 3, false);
            }
            // micro shockwave on VERIFIED
            const sw = ramp(t, INSP.match, INSP.match + 0.7);
            if (sw > 0 && sw < 1) {
              const sp = project(cam, SEAL);
              ctx.strokeStyle = `rgba(240,211,138,${0.6 * (1 - sw)})`;
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(sp.x, sp.y, 180 * sp.s + sw * 520, 0, Math.PI * 2);
              ctx.stroke();
            }
          }}
        />
      </div>
      <div style={{position: 'absolute', left: 84, top: 300, zIndex: 300000, opacity: ramp(t, INSP.insp + 0.1, INSP.insp + 0.3) * (1 - ramp(t, INSP.preship - 0.2, INSP.preship))}}>
        <Micro text="Scanning" dot />
      </div>
      <div style={{position: 'absolute', left: 84, top: 300, zIndex: 300000, opacity: ramp(t, INSP.preship, INSP.preship + 0.2) * (1 - ramp(t, INSP.push[0] - 0.2, INSP.push[0]))}}>
        <Micro text="Quality check · QC" color="rgba(240,211,138,0.95)" />
      </div>
      <div style={{position: 'absolute', inset: 0, zIndex: 120000, background: 'linear-gradient(180deg, rgba(10,14,24,0.45) 0%, rgba(10,14,24,0) 28%, rgba(10,14,24,0.08) 62%, rgba(8,9,12,0.55) 100%)'}} />
      <AbsoluteFill style={{zIndex: 400000, background: `radial-gradient(circle at ${CX}px ${CY}px, rgba(255,236,196,${0.4 * ramp(t, INSP.push[0] + 0.1, INSP.push[1]) ** 2}) 0%, rgba(0,0,0,0) 60%)`, mixBlendMode: 'screen'}} />
    </Stage>
  );
};
