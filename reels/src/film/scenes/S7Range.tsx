import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, IMG} from '../brand';
import {back, Cam, clamp, ease, lerp, project, ramp} from '../lib';
import {Ar, At, CanvasLayer, glowSprite, GOLD_RGBA, La, Photo, Plane, Reveal} from '../ui';
import {at} from '../timing';
import {S6} from './S6Process';

/** Scene 7 — industrial tunnel: products / equipment / machinery / production lines → clear steps. */
const T_WHETHER = at('سواء');
const T_HELP = at('نحن');
const T_ASSIST = at('نساعدك');
const T_STEPS = at('بخطوات');
const T_STUDIED = at('ومدروسة');
const T_THEN = at('ثم');

export const S7 = {start: S6.end - 0.35, end: T_THEN + 0.12};

const CATS: {ar: string; en: string; t: number; img: string; pos: string}[] = [
  {ar: 'منتجات', en: 'Products', t: at('منتجات'), img: IMG.fairHall, pos: '18% 62%'},
  {ar: 'معدات', en: 'Equipment', t: at('معدات'), img: IMG.fairBooth, pos: '78% 45%'},
  {ar: 'مكائن', en: 'Machinery', t: at('مكائن'), img: IMG.cnc, pos: '55% 50%'},
  {ar: 'خطوط إنتاج', en: 'Production lines', t: at('خطوط'), img: IMG.pack, pos: '50% 50%'},
];

const SPEED = 1500;
const T0 = S7.start;
const TUN_END = T_HELP + 0.1;
const camZ = (t: number) => {
  // steady forward travel with a gentle ease in/out at the ends
  const a = clamp((t - T0) / (TUN_END - T0));
  const dur = TUN_END - T0;
  return SPEED * dur * (a - (Math.sin(a * Math.PI * 2) / (Math.PI * 2)) * 0.18);
};
const camAt = (t: number): Cam => ({pos: [Math.sin(t * 0.6) * 40, Math.cos(t * 0.5) * 30, camZ(t)], roll: Math.sin(t * 0.35) * 0.06});
const RING_R = 820;
const PANEL_LEAD = 760; // panel sits this far ahead of the camera at its cue

const STEPS: [string, string][] = [
  ['البحث والتحقق', 'Source & verify'],
  ['التفاوض', 'Negotiate'],
  ['الإنتاج', 'Produce'],
  ['الفحص', 'Inspect'],
  ['الشحن', 'Ship'],
];
const stepT = (k: number) => lerp(T_STEPS, T_STUDIED, k / 4);

export const Scene7: React.FC<{t: number}> = ({t}) => {
  const cam = camAt(Math.min(t, TUN_END));
  const open = ramp(t, T_HELP - 0.2, T_HELP + 0.7, ease.inOut);
  const tunnelOp = ramp(t, S7.start, S7.start + 0.35) * (1 - open);
  const up = ramp(t, T_THEN - 0.32, S7.end, ease.in);

  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse 70% 50% at 50% 50%, #16181d 0%, ${C.ink} 75%)`, overflow: 'hidden'}}>
      {tunnelOp > 0 && (
        <AbsoluteFill style={{opacity: tunnelOp}}>
          <CanvasLayer
            draw={(ctx) => {
              const z0 = cam.pos[2];
              const first = Math.ceil(z0 / 380) * 380;
              ctx.lineWidth = 2;
              for (let z = first; z < z0 + 9000; z += 380) {
                const P = project(cam, [0, 0, z]);
                if (P.d < 50) continue;
                const fade = clamp(1 - P.d / 9000) * clamp((P.d - 50) / 400);
                const R = RING_R * (1 + open * 1.5) * P.s;
                ctx.strokeStyle = `rgba(214,170,74,${0.55 * fade})`;
                ctx.beginPath();
                ctx.arc(P.x, P.y, R, 0, Math.PI * 2);
                ctx.stroke();
                // ticks on the ring
                ctx.strokeStyle = `rgba(240,211,138,${0.35 * fade})`;
                for (let k = 0; k < 12; k++) {
                  const a = (k / 12) * Math.PI * 2 + z * 0.0002;
                  ctx.beginPath();
                  ctx.moveTo(P.x + Math.cos(a) * R, P.y + Math.sin(a) * R);
                  ctx.lineTo(P.x + Math.cos(a) * R * 0.94, P.y + Math.sin(a) * R * 0.94);
                  ctx.stroke();
                }
              }
              // longitudinal rails
              ctx.lineWidth = 1.2;
              for (let k = 0; k < 10; k++) {
                const a = (k / 10) * Math.PI * 2 + 0.3;
                const A = project(cam, [Math.cos(a) * RING_R, Math.sin(a) * RING_R, z0 + 120]);
                const B = project(cam, [Math.cos(a) * RING_R, Math.sin(a) * RING_R, z0 + 9000]);
                const g = ctx.createLinearGradient(A.x, A.y, B.x, B.y);
                g.addColorStop(0, 'rgba(214,170,74,0.28)');
                g.addColorStop(1, 'rgba(214,170,74,0)');
                ctx.strokeStyle = g;
                ctx.beginPath();
                ctx.moveTo(A.x, A.y);
                ctx.lineTo(B.x, B.y);
                ctx.stroke();
              }
              // vanishing glow
              ctx.globalCompositeOperation = 'lighter';
              const V = project(cam, [0, 0, z0 + 9000]);
              ctx.globalAlpha = 0.5;
              ctx.drawImage(glowSprite(GOLD_RGBA, 0.08), V.x - 260, V.y - 260, 520, 520);
              ctx.globalAlpha = 1;
              ctx.globalCompositeOperation = 'source-over';
            }}
          />
          {CATS.map((c, k) => {
            const side = k % 2 === 0 ? -1 : 1;
            const z = camZ(c.t) + PANEL_LEAD + 900;
            return (
              <Plane key={k} cam={cam} p={[side * 470, k === 3 ? -60 : 40, z]} w={560} h={740} rotY={side * -52} near={80}>
                <div style={{width: 560, height: 740, borderRadius: 20, overflow: 'hidden', border: '1.5px solid rgba(233,207,143,0.45)', boxShadow: '0 30px 80px rgba(0,0,0,0.6)'}}>
                  <Photo src={c.img} w={560} h={740} pos={c.pos} />
                </div>
              </Plane>
            );
          })}
        </AbsoluteFill>
      )}

      {/* category type — lands from depth, then flies past the lens */}
      {CATS.map((c, k) => {
        const next = k < 3 ? CATS[k + 1].t : T_HELP - 0.1;
        if (t < c.t - 0.06 || t > next + 0.3) return null;
        const p = ramp(t, c.t - 0.06, c.t + 0.45, (x) => back(x, 1.3));
        const past = ramp(t, next - 0.08, next + 0.3, ease.in);
        const sc = lerp(0.55, 1, p) * (1 + past * 2.2);
        return (
          <At key={k} y={900 - past * 120} style={{zIndex: 300000, opacity: clamp(p * 1.6) * (1 - past), transform: `translate(-50%,-50%) scale(${sc})`, filter: (1 - p) * 10 + past * 14 > 0.4 ? `blur(${((1 - p) * 10 + past * 14).toFixed(1)}px)` : undefined}}>
            <La size={20} track={0.5} color={C.goldPale} style={{marginBottom: 6}}>
              {`0${k + 1}  ·  ${c.en}`}
            </La>
            <div style={{filter: 'drop-shadow(0 8px 30px rgba(0,0,0,0.85))'}}>
              <Ar size={k === 3 ? 128 : 150} weight={800} gold={k % 2 === 0} color={C.white} shimmer={ramp(t, c.t, c.t + 0.9, ease.inOut)} lh={1.15}>
                {c.ar}
              </Ar>
            </div>
          </At>
        );
      })}

      {/* sourcing from China + clear steps */}
      <div style={{position: 'absolute', inset: 0, transform: `translateY(${-up * 1300}px)`, opacity: 1 - up * 0.6}}>
        <At y={lerp(800, 380, ramp(t, T_STEPS - 0.45, T_STEPS + 0.2, ease.inOut))} style={{zIndex: 300000}}>
          <Reveal t={t} at={T_ASSIST} dur={0.55} blur={16}>
            <Ar size={104} weight={800} gold shimmer={ramp(t, T_ASSIST, T_ASSIST + 1.4, ease.inOut)} lh={1.2}>
              التوريد من الصين
            </Ar>
            <La size={20} track={0.5} color={C.mist} style={{marginTop: 4}}>
              Sourcing from China · step by step
            </La>
          </Reveal>
        </At>
        {t > T_STEPS - 0.1 && (
          <div style={{position: 'absolute', left: 0, right: 0, top: 600, zIndex: 300000}}>
            {/* spine */}
            <div style={{position: 'absolute', right: 355, top: 40, width: 2, height: 4 * 160 * ramp(t, T_STEPS, T_STUDIED + 0.2, ease.inOut) + 900 * ramp(t, T_STUDIED + 0.6, T_THEN, ease.in), background: `linear-gradient(180deg, ${C.gold}, ${C.goldLight})`}} />
            {STEPS.map(([ar, en], k) => {
              const p = ramp(t, stepT(k) - 0.05, stepT(k) + 0.4, (x) => back(x, 1.4));
              if (p <= 0) return null;
              const hot = k === 4 ? ramp(t, T_STUDIED + 0.4, T_STUDIED + 0.8) : 0;
              return (
                <div key={k} dir="rtl" style={{position: 'absolute', right: 314, top: k * 160, display: 'flex', alignItems: 'center', gap: 34, opacity: clamp(p * 1.5), transform: `translateX(${(1 - p) * -40}px)`}}>
                  <div style={{width: 82, height: 82, borderRadius: 41, border: `2px solid ${C.goldLight}`, background: hot > 0 ? `rgba(201,151,28,${0.3 + 0.6 * hot})` : '#101114', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 ${20 + 60 * hot}px rgba(226,182,80,${0.25 + 0.5 * hot})`}}>
                    <La size={24} track={0.05} color={hot > 0.5 ? '#0b0b0c' : C.goldLight} weight={800}>
                      {`0${k + 1}`}
                    </La>
                  </div>
                  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start'}}>
                    <Ar size={56} weight={800} color={C.white} style={{textAlign: 'right'}} lh={1.25}>
                      {ar}
                    </Ar>
                    <La size={16} track={0.36} color={C.goldPale}>
                      {en}
                    </La>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

