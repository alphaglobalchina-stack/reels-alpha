import React from 'react';
import {C, FONT} from '../film/brand';
import {back, Cam, clamp, ease, lerp, mix3, project, ramp, V3} from '../film/lib';
import {CanvasLayer} from '../film/ui';
import {goldLine, Micro, recoil} from './kit';
import {NEG, NEG_START, NEG_THROUGH, SNAP} from './plan';
import {Item, photoLayers, Stage} from './stage';

/**
 * Negotiation — through the chosen supplier card into the negotiation itself (booth photo in
 * depth). PRICE / SPECIFICATIONS / TERMS float around the camera on their words, threaded
 * by the gold line; they align and SNAP into RIGHT MATCH, and the camera pushes through it.
 */
const PLATE: V3 = [0, 40, 1180];
const OBJ: {en: string; ar: string; t: number; p: V3; icon: number}[] = [
  {en: 'Price', ar: 'السعر', t: NEG.price, p: [-200, -400, 1100], icon: 0},
  {en: 'Specifications', ar: 'المواصفات', t: NEG.spec, p: [180, -70, 1380], icon: 1},
  {en: 'Terms', ar: 'الشروط', t: NEG.terms, p: [-150, 290, 1620], icon: 2},
];

export const negCam = (t: number): Cam => {
  const arrive = ramp(t, NEG_START, NEG.cmp + 0.55, (x) => 1 - Math.pow(1 - x, 2.6));
  const orbit = ramp(t, NEG.cmp + 0.3, SNAP - 0.2, ease.inOut);
  const hold = ramp(t, SNAP - 0.18, SNAP, ease.soft);
  const thr = ramp(t, NEG_THROUGH[0], NEG_THROUGH[1], (x) => x * x * x);
  const base: V3 = [lerp(180, -160, orbit) + 40 * Math.sin(t * 0.9), lerp(60, -30, orbit), lerp(-900, -60, arrive) + 260 * orbit - 50 * hold + recoil(t, SNAP, 50)];
  const into: V3 = [PLATE[0], PLATE[1], PLATE[2] - 40];
  return {pos: mix3(base, into, thr), yaw: lerp(-0.1, 0.1, orbit) * (1 - thr), roll: lerp(0.05, -0.02, arrive) + 0.02 * Math.sin(orbit * Math.PI)};
};

const Icon: React.FC<{k: number}> = ({k}) => {
  const s = {fill: 'none', stroke: C.goldLight, strokeWidth: 2.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
  return (
    <svg width={46} height={46} viewBox="0 0 48 48">
      {k === 0 && (<><path d="M26 6h14v14L22 38a3 3 0 01-4 0L8 28a3 3 0 010-4z" {...s} /><circle cx={33} cy={13} r={2.5} {...s} /></>)}
      {k === 1 && (<><path d="M8 14h32M8 24h32M8 34h32" {...s} /><circle cx={18} cy={14} r={3.5} {...s} fill="#111" /><circle cx={31} cy={24} r={3.5} {...s} fill="#111" /><circle cx={14} cy={34} r={3.5} {...s} fill="#111" /></>)}
      {k === 2 && (<><path d="M12 6h18l8 8v28H12z" {...s} /><path d="M30 6v8h8M18 22h14M18 29h14M18 36h8" {...s} /></>)}
    </svg>
  );
};

const objPos = (k: number, t: number): V3 => {
  const o = OBJ[k];
  const arr = ramp(t, o.t - 0.06, o.t + 0.4, (x) => back(x, 1.4));
  const float: V3 = [o.p[0] + Math.sin(t * 1.1 + k) * 18, o.p[1] + Math.cos(t * 0.9 + k) * 14, o.p[2] + (1 - arr) * 1600];
  const align = ramp(t, SNAP - 0.32, SNAP, (x) => x * x);
  const stack: V3 = [PLATE[0], PLATE[1] + (k - 1) * 70, PLATE[2] + 2];
  return mix3(float, stack, align);
};

export const ShotNegotiation: React.FC<{t: number}> = ({t}) => {
  const cam = negCam(t);
  const snap = ramp(t, SNAP - 0.02, SNAP + 0.16, (x) => back(x, 2));
  const items: Item[] = [...photoLayers('booth', 2900, 2150, 1500, {x: 0, y: 0})];
  OBJ.forEach((o, k) => {
    const arr = ramp(t, o.t - 0.06, o.t + 0.25);
    if (arr <= 0) return;
    items.push({
      key: o.en,
      p: objPos(k, t),
      w: 360,
      h: 200,
      rotY: lerp((k - 1) * -22, 0, ramp(t, SNAP - 0.32, SNAP)),
      opacity: arr * (1 - ramp(t, SNAP - 0.04, SNAP + 0.02)),
      render: () => (
        <div style={{width: 360, height: 200, borderRadius: 22, background: 'linear-gradient(160deg, rgba(28,30,36,0.78), rgba(10,11,14,0.86))', border: '1.5px solid rgba(240,211,138,0.55)', boxShadow: '0 30px 60px rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', gap: 20, padding: '0 28px', boxSizing: 'border-box'}}>
          <Icon k={o.icon} />
          <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
            <div style={{fontFamily: FONT.la, fontWeight: 800, fontSize: 20, letterSpacing: '0.32em', color: C.white, textTransform: 'uppercase'}}>{o.en}</div>
            <div dir="rtl" style={{fontFamily: FONT.ar, fontWeight: 700, fontSize: 30, color: C.goldLight, lineHeight: 1.2}}>{o.ar}</div>
          </div>
        </div>
      ),
    });
  });
  if (t >= SNAP - 0.04) {
    items.push({
      key: 'match',
      p: PLATE,
      w: 560,
      h: 220,
      near: 30,
      render: () => (
        <div style={{width: 560, height: 220, borderRadius: 26, background: 'linear-gradient(160deg, rgba(30,28,22,0.86), rgba(10,10,10,0.92))', border: `3px solid ${C.goldLight}`, boxShadow: `0 0 ${60 * (1 - ramp(t, SNAP, SNAP + 0.8))}px rgba(226,182,80,0.6), 0 30px 70px rgba(0,0,0,0.6)`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22, transform: `scale(${lerp(1.18, 1, snap)})`}}>
          <svg width={64} height={64} viewBox="0 0 48 48">
            <circle cx={24} cy={24} r={20} fill="none" stroke={C.goldLight} strokeWidth={2} />
            <path d="M14 25l7 7 13-14" fill="none" stroke={C.goldLight} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={34} strokeDashoffset={34 * (1 - ramp(t, SNAP + 0.04, SNAP + 0.3))} />
          </svg>
          <div style={{fontFamily: FONT.la, fontWeight: 800, fontSize: 30, letterSpacing: '0.34em', color: C.white}}>RIGHT MATCH</div>
        </div>
      ),
    });
  }
  return (
    <Stage cam={cam} items={items} bg={C.ink}>
      {/* negotiation path: the gold line threads the three terms, then contracts into the snap */}
      <div style={{position: 'absolute', inset: 0, zIndex: 150000}}>
        <CanvasLayer
          draw={(ctx) => {
            const vis = OBJ.filter((o) => t > o.t - 0.02);
            if (!vis.length) return;
            const pts = [{x: 1140, y: 640}, ...vis.map((o) => project(cam, objPos(OBJ.indexOf(o), t)))];
            const prog = ramp(t, NEG.price - 0.1, NEG.terms + 0.3, ease.inOut);
            goldLine(ctx, pts, Math.min(1, prog * 1.05), 1 - ramp(t, SNAP - 0.05, SNAP + 0.1), 2.4);
            const pulse = ramp(t, SNAP, SNAP + 0.6);
            if (pulse > 0 && pulse < 1) {
              const pp = project(cam, PLATE);
              ctx.strokeStyle = `rgba(240,211,138,${0.6 * (1 - pulse)})`;
              ctx.lineWidth = 2;
              const w = 300 * pp.s * (1 + pulse * 0.5), h = 120 * pp.s * (1 + pulse * 0.5);
              ctx.strokeRect(pp.x - w, pp.y - h, w * 2, h * 2);
            }
          }}
        />
      </div>
      <div style={{position: 'absolute', left: 84, top: 300, zIndex: 300000, opacity: ramp(t, NEG.cmp + 0.1, NEG.cmp + 0.3) * (1 - ramp(t, NEG.neg - 0.2, NEG.neg))}}>
        <Micro text="Compare offers" />
      </div>
      <div style={{position: 'absolute', left: 84, top: 300, zIndex: 300000, opacity: ramp(t, NEG.neg, NEG.neg + 0.2) * (1 - ramp(t, SNAP - 0.2, SNAP))}}>
        <Micro text="Negotiation" />
      </div>
      <div style={{position: 'absolute', inset: 0, zIndex: 120000, background: 'linear-gradient(180deg, rgba(10,14,24,0.5) 0%, rgba(10,14,24,0) 30%, rgba(10,14,24,0.1) 60%, rgba(8,9,12,0.6) 100%)', opacity: clamp(1)}} />
    </Stage>
  );
};
