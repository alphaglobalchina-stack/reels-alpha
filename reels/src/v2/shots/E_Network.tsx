import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {C, FONT, IMG} from '../../film/brand';
import {back, Cam, clamp, ease, lerp, mix3, project, ramp, rnd, V3} from '../../film/lib';
import {Ar, CanvasLayer, glowSprite, GOLD_RGBA, La, Plane, WHITE_RGBA} from '../../film/ui';
import {at} from '../t2';
import {D_END} from './C_Market';

/** Shot E — a supplier network built around the camera; filtering on the beats; the chosen card slams in. */
const T_SUPS = at('الموردين');
const T_FACT = at('والمصانع');
const T_FIT = at('المناسبة');
export const BEATS = [
  {en: 'Search', ar: 'بحث', t: T_SUPS - 0.02},
  {en: 'Verify', ar: 'تحقّق', t: lerp(T_SUPS, T_FACT, 0.5)},
  {en: 'Compare', ar: 'مقارنة', t: T_FACT - 0.02},
  {en: 'Select', ar: 'اختيار', t: T_FIT - 0.02},
];
export const E_START = D_END - 0.04;
const T_SEL = BEATS[3].t;

const THUMBS = [IMG.cnc, IMG.line, IMG.pack, IMG.factory, IMG.insp, IMG.ware, IMG.cmp, IMG.inspWare, 'film/fair_booth.webp', 'film/fair_hall.webp'];
const NC = 34;
const PICK = 5;
const SHORT = [PICK, 11, 20];
// cards on a sphere-ish shell around the camera (front hemisphere, wide)
const CARD: V3[] = Array.from({length: NC}, (_, i) => {
  const a = (rnd(i * 2.71) - 0.5) * 2.6; // yaw
  const e = (rnd(i * 5.13) - 0.5) * 1.5; // elevation
  const r = 1500 + rnd(i * 7.9) * 1300;
  return [Math.sin(a) * Math.cos(e) * r, Math.sin(e) * r * 0.9, Math.cos(a) * Math.cos(e) * r];
});
CARD[PICK] = [260, 120, 1600];
CARD[11] = [-520, -220, 1900];
CARD[20] = [600, -380, 2100];
const VER = new Set(CARD.map((_, i) => i).filter((i) => i === PICK || SHORT.includes(i) || rnd(i * 13.3) > 0.55));
const NN = 220;
const NODE: V3[] = Array.from({length: NN}, (_, i) => {
  const a = (rnd(i * 3.9) - 0.5) * 3.2, e = (rnd(i * 6.1) - 0.5) * 1.8, r = 900 + rnd(i * 1.3) * 3200;
  return [Math.sin(a) * Math.cos(e) * r, Math.sin(e) * r, Math.cos(a) * Math.cos(e) * r];
});
const EDGES: [number, number, number][] = [];
for (let i = 0; i < NN; i++) for (let j = i + 1; j < NN; j++) {
  const d = Math.hypot(NODE[i][0] - NODE[j][0], NODE[i][1] - NODE[j][1], NODE[i][2] - NODE[j][2]);
  if (d < 700 && rnd(i * 31 + j) > 0.55) EDGES.push([i, j, rnd(i + j * 7)]);
}

const cardPos = (i: number, t: number): V3 => {
  const base = CARD[i];
  const k = SHORT.indexOf(i);
  const cmp = ramp(t, BEATS[2].t, BEATS[2].t + 0.35, ease.inOut);
  const sel = ramp(t, T_SEL, T_SEL + 0.32, (x) => back(x, 1.35));
  const away = ramp(t, T_SEL - 0.02, T_SEL + 0.5, (x) => x * x);
  if (i === PICK) return mix3(mix3(base, [0, 60, 1250], cmp), [0, 40, 470], sel);
  if (k >= 0) return mix3(mix3(base, [(k - 1) * 380, 60, 1350], cmp), [base[0] * 3, base[1] * 3, base[2] + 2600], away);
  return [base[0] * (1 + away * 1.8), base[1] * (1 + away * 1.8), base[2] + away * 3000];
};

export const eCam = (t: number): Cam => {
  const k = ramp(t, E_START, T_SEL + 0.6, ease.linear);
  const settle = ramp(t, T_SEL - 0.1, T_SEL + 0.5, ease.inOut);
  return {pos: [0, 0, lerp(-500, 0, ramp(t, E_START, E_START + 0.6, ease.out))], yaw: lerp(0.55, -0.15, k) * (1 - settle) + 0.0 * settle, pitch: lerp(-0.08, 0.05, k) * (1 - settle), roll: lerp(0.08, 0, ramp(t, E_START, E_START + 0.8, ease.out))};
};

export const ShotE: React.FC<{t: number}> = ({t}) => {
  const cam = eCam(t);
  const build = ramp(t, E_START, E_START + 0.55, ease.out);
  const scan = ramp(t, BEATS[0].t, BEATS[1].t + 0.05, ease.inOut);
  const ver = ramp(t, BEATS[1].t, BEATS[1].t + 0.2);
  const cmp = ramp(t, BEATS[2].t, BEATS[2].t + 0.3);
  const sel = ramp(t, T_SEL, T_SEL + 0.3);
  const pp = project(cam, cardPos(PICK, t));

  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse 80% 60% at 50% 50%, #131a28 0%, ${C.ink} 75%)`, overflow: 'hidden'}}>
      <CanvasLayer
        draw={(ctx) => {
          const P = NODE.map((p) => project(cam, p));
          ctx.lineWidth = 1;
          EDGES.forEach(([a, b, r]) => {
            const g = ramp(t, E_START + r * 0.5, E_START + r * 0.5 + 0.22);
            if (g <= 0 || P[a].d < 40 || P[b].d < 40) return;
            const al = 0.26 * g * (1 - 0.6 * cmp) * (1 - 0.5 * sel);
            ctx.strokeStyle = `rgba(214,170,74,${al})`;
            ctx.beginPath();
            ctx.moveTo(P[a].x, P[a].y);
            ctx.lineTo(P[a].x + (P[b].x - P[a].x) * g, P[a].y + (P[b].y - P[a].y) * g);
            ctx.stroke();
          });
          ctx.globalCompositeOperation = 'lighter';
          const gs = glowSprite(GOLD_RGBA, 0.16);
          P.forEach((p, i) => {
            if (p.d < 40) return;
            const born = E_START + rnd(i * 4.4) * 0.45;
            if (t < born) return;
            const r = 7 * Math.max(0.4, p.s * 1.4) * (t - born < 0.15 ? 2 : 1);
            ctx.globalAlpha = clamp((0.5 + 0.5 * Math.sin(t * 6 + i)) * (1 - 0.5 * sel));
            ctx.drawImage(gs, p.x - r * 2, p.y - r * 2, r * 4, r * 4);
          });
          // links from the chosen card to the network, then orbiting light trails around it
          if (sel > 0) {
            for (let k = 0; k < 3; k++) {
              const rx = 330 + k * 70, ry = 90 + k * 30, rot = -0.3 + k * 0.3, sp = (k % 2 ? -1 : 1) * (2.2 + k * 0.6);
              ctx.save();
              ctx.translate(pp.x, pp.y);
              ctx.rotate(rot);
              ctx.strokeStyle = `rgba(240,211,138,${0.5 * sel})`;
              ctx.lineWidth = 2;
              const a0 = t * sp;
              ctx.beginPath();
              ctx.ellipse(0, 0, rx * sel, ry * sel, 0, a0, a0 + Math.PI * 1.2);
              ctx.stroke();
              const hx = Math.cos(a0 + Math.PI * 1.2) * rx * sel, hy = Math.sin(a0 + Math.PI * 1.2) * ry * sel;
              ctx.drawImage(glowSprite(WHITE_RGBA, 0.25), hx - 14, hy - 14, 28, 28);
              ctx.restore();
            }
          }
          ctx.globalAlpha = 1;
          ctx.globalCompositeOperation = 'source-over';
          if (scan > 0 && scan < 1) {
            const x = lerp(-80, 1160, scan);
            const g = ctx.createLinearGradient(x - 120, 0, x + 10, 0);
            g.addColorStop(0, 'rgba(240,211,138,0)');
            g.addColorStop(1, 'rgba(240,211,138,0.28)');
            ctx.fillStyle = g;
            ctx.fillRect(x - 120, 0, 130, 1920);
            ctx.fillStyle = 'rgba(255,240,200,0.9)';
            ctx.fillRect(x, 0, 2, 1920);
          }
        }}
      />
      {CARD.map((_, i) => {
        const p = cardPos(i, t);
        const isPick = i === PICK;
        const dim = VER.has(i) ? 0 : 0.65 * ver;
        const op = build * (1 - dim) * (isPick ? 1 : SHORT.includes(i) ? 1 - 0.4 * sel : 1 - 0.75 * cmp) ;
        const verified = VER.has(i) && ver > 0;
        const glow = isPick ? sel : 0;
        return (
          <Plane key={i} cam={cam} p={p} w={250} h={330} rotY={isPick ? lerp(-18, 0, sel) : (rnd(i) - 0.5) * 30} rotZ={isPick ? lerp(-6, 0, sel) : 0} opacity={op} near={30} focus={isPick && sel > 0 ? 480 : undefined} dof={4}>
            <div style={{width: 250, height: 330, borderRadius: 16, overflow: 'hidden', position: 'relative', background: '#0e0f12', border: `${isPick && sel > 0 ? 3 : 1.5}px solid rgba(240,211,138,${0.25 + 0.6 * (verified ? 1 : 0) * ver + 0.15 * glow})`, boxShadow: glow > 0 ? `0 0 ${70 * glow}px rgba(226,182,80,${0.6 * glow})` : '0 20px 40px rgba(0,0,0,0.5)'}}>
              <Img src={staticFile(THUMBS[i % THUMBS.length])} style={{width: 250, height: 200, objectFit: 'cover', objectPosition: `${30 + rnd(i) * 40}% 50%`, filter: 'saturate(0.85) brightness(0.9)'}} />
              <div style={{padding: '12px 14px'}}>
                <La size={11} track={0.3} color={C.goldPale} weight={700}>{`Supplier ${String(i + 1).padStart(2, '0')}`}</La>
                {[0.85, 0.6].map((w, k) => (
                  <div key={k} style={{height: 6, width: `${w * 100}%`, borderRadius: 3, background: 'rgba(255,255,255,0.14)', marginTop: 10}} />
                ))}
              </div>
              {verified && (
                <div style={{position: 'absolute', right: 10, top: 10, width: 38, height: 38, borderRadius: 19, background: 'rgba(8,8,10,0.8)', border: `2px solid ${C.gold}`, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: ver}}>
                  <svg width={20} height={20} viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke={C.goldLight} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
              )}
              {isPick && sel > 0 && (
                <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 52, background: `linear-gradient(90deg, ${C.goldDark}, ${C.gold})`, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: sel}}>
                  <La size={17} track={0.42} color="#0b0b0c" weight={800}>Best fit</La>
                </div>
              )}
            </div>
          </Plane>
        );
      })}
      {/* beat words */}
      {BEATS.map((b, i) => {
        const next = BEATS[i + 1]?.t ?? 99;
        if (t < b.t - 0.01 || t > next + 0.03) return null;
        const p = ramp(t, b.t - 0.01, b.t + 0.2, (x) => back(x, 1.7));
        const out = ramp(t, next - 0.1, next + 0.02, (x) => x * x);
        return (
          <div key={b.en} style={{position: 'absolute', left: 0, right: 0, top: 330, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 400000, opacity: clamp(p * 1.6) * (1 - out), transform: `scale(${lerp(2.4, 1, p) * (1 + out * 2.2)})`, filter: (1 - p) * 14 + out * 16 > 0.4 ? `blur(${((1 - p) * 14 + out * 16).toFixed(1)}px)` : undefined}}>
            <div style={{fontFamily: FONT.la, fontWeight: 800, fontSize: 116, letterSpacing: '0.1em', color: i === 3 ? C.goldLight : C.white, textTransform: 'uppercase', textShadow: '0 10px 40px rgba(0,0,0,0.7)', lineHeight: 1}}>{b.en}</div>
            <Ar size={52} weight={700} color={C.goldPale} style={{marginTop: 10}}>{b.ar}</Ar>
          </div>
        );
      })}
      {/* camera starts pushing into the chosen card at the end of the preview */}
      <AbsoluteFill style={{background: `radial-gradient(circle at ${pp.x}px ${pp.y}px, rgba(240,211,138,${0.12 * sel}) 0%, rgba(0,0,0,0) 45%)`, mixBlendMode: 'screen', zIndex: 300000}} />
    </AbsoluteFill>
  );
};
