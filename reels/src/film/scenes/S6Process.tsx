import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, IMG} from '../brand';
import {back, Cam, clamp, ease, keysV, project, ramp, V3, W} from '../lib';
import {Ar, At, CanvasLayer, glowSprite, GOLD_RGBA, La, Photo, Plane, RED_RGBA, Reveal} from '../ui';
import {Flash, RGBSplit} from '../fx';
import {at} from '../timing';
import {S5} from './S5Negotiation';

/** Scene 6 — follow the order along a gold process axis: SAMPLE → PRODUCTION → INSPECTION → VERIFIED. */
const T_FOLLOW = at('نتابع');
const T_SAMPLE = at('العينة');
const T_PROD = at('الإنتاج');
const T_INSP = at('فحص');
const T_PRESHIP = at('قبل');
const T_ENSURE = at('للتأكد');
const T_MATCH = at('مطابقتها');
const T_NEXT = at('سواء');

export const S6 = {start: S5.end - 0.4, end: T_NEXT - 0.12};

const GAP = 1750;
const ST = [0, 1, 2].map((i): V3 => [i === 1 ? 70 : -40, 0, 1400 + i * GAP]);
const VIEW = 1130;
const CWd = 560, CHt = 820;

export const s6Cam = (t: number): Cam => {
  const at3 = (i: number, d = VIEW): V3 => [ST[i][0] * 0.7, 0, ST[i][2] - d];
  const pos = keysV(t, [
    [S6.start, [0, -60, ST[0][2] - 2600]],
    [T_SAMPLE - 0.05, at3(0)],
    [T_PROD - 0.3, at3(0, VIEW - 90)],
    [T_PROD + 0.25, at3(1)],
    [T_INSP - 0.45, at3(1, VIEW - 90)],
    [T_INSP + 0.05, at3(2)],
    [S6.end - 0.75, at3(2, VIEW - 260)],
    [S6.end, [ST[2][0], 0, ST[2][2] + 300]],
  ]);
  const whip = ramp(t, S6.end - 0.75, S6.end, ease.in);
  return {pos, yaw: 0.025 * Math.sin(t * 0.7), roll: -0.02 + 0.06 * whip};
};

const STATIONS: {img: string; pos: string; ar: string; en: string; t: number}[] = [
  {img: IMG.cmp, pos: '45% 40%', ar: 'العيّنة', en: 'Sample', t: T_SAMPLE},
  {img: IMG.line, pos: '50% 45%', ar: 'الإنتاج', en: 'Production', t: T_PROD},
  {img: IMG.insp, pos: '45% 50%', ar: 'الفحص', en: 'Inspection', t: T_INSP},
];

const CHECKS: {x: number; y: number; w: number; h: number; en: string; t: number}[] = [
  {x: 300, y: 250, w: 230, h: 300, en: 'Dimensions', t: T_INSP + 0.55},
  {x: 30, y: 470, w: 200, h: 250, en: 'Finish', t: T_PRESHIP + 0.15},
  {x: 270, y: 590, w: 260, h: 190, en: 'Packing', t: T_ENSURE + 0.1},
];

const InspectionOverlay: React.FC<{t: number}> = ({t}) => {
  const scan = ramp(t, T_INSP + 0.15, T_ENSURE + 0.4, ease.inOut);
  const on = ramp(t, T_INSP, T_INSP + 0.3) * (1 - ramp(t, T_MATCH + 0.5, T_MATCH + 0.9));
  const y = scan * CHt;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: on}}>
      {/* measuring grid above the beam */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: y,
          backgroundImage: 'linear-gradient(rgba(240,211,138,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(240,211,138,0.10) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      {scan > 0 && scan < 1 && (
        <div style={{position: 'absolute', left: -20, right: -20, top: y - 2, height: 4, background: `linear-gradient(90deg, transparent, ${C.goldLight}, transparent)`, boxShadow: '0 0 30px 10px rgba(226,182,80,0.35)'}} />
      )}
      {CHECKS.map((c, k) => {
        const p = ramp(t, c.t, c.t + 0.35, ease.out);
        if (p <= 0) return null;
        const ok = ramp(t, c.t + 0.45, c.t + 0.7);
        const col = ok > 0.5 ? C.goldLight : C.red;
        const L = 26;
        return (
          <div key={k} style={{position: 'absolute', left: c.x, top: c.y, width: c.w, height: c.h, opacity: p, transform: `scale(${1.25 - 0.25 * p})`}}>
            {[
              {left: 0, top: 0, borderLeft: 3, borderTop: 3},
              {right: 0, top: 0, borderRight: 3, borderTop: 3},
              {left: 0, bottom: 0, borderLeft: 3, borderBottom: 3},
              {right: 0, bottom: 0, borderRight: 3, borderBottom: 3},
            ].map((b, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  width: L,
                  height: L,
                  left: b.left,
                  right: b.right,
                  top: b.top,
                  bottom: b.bottom,
                  borderLeft: b.borderLeft ? `3px solid ${col}` : undefined,
                  borderRight: b.borderRight ? `3px solid ${col}` : undefined,
                  borderTop: b.borderTop ? `3px solid ${col}` : undefined,
                  borderBottom: b.borderBottom ? `3px solid ${col}` : undefined,
                }}
              />
            ))}
            <div style={{position: 'absolute', left: 0, top: -36, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(8,8,10,0.78)', padding: '5px 10px', borderRadius: 6, border: `1px solid ${col}`}}>
              <div style={{width: 9, height: 9, borderRadius: 5, background: col}} />
              <La size={13} track={0.24} color={C.white} weight={700}>
                {`${c.en}${ok > 0.5 ? '  ✓' : ''}`}
              </La>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const Scene6: React.FC<{t: number}> = ({t}) => {
  const cam = s6Cam(t);
  const whip = ramp(t, S6.end - 0.75, S6.end, ease.in);
  const seal = ramp(t, T_MATCH - 0.05, T_MATCH + 0.45, (x) => back(x, 1.7));
  const sealOut = ramp(t, S6.end - 0.7, S6.end - 0.35);
  const active = t < T_PROD - 0.1 ? 0 : t < T_INSP - 0.25 ? 1 : 2;

  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse 90% 60% at 50% 50%, #14161b 0%, ${C.ink} 80%)`, overflow: 'hidden'}}>
      {/* process rail */}
      <CanvasLayer
        draw={(ctx) => {
          const y = CHt / 2 + 120;
          const pts: ReturnType<typeof project>[] = [];
          for (let z = 0; z <= ST[2][2] + 2400; z += 60) {
            const x = z < ST[0][2] ? ST[0][0] : z > ST[2][2] ? ST[2][0] : 0;
            pts.push(project(cam, [x * 0.6, y, z]));
          }
          ctx.lineWidth = 3;
          ctx.strokeStyle = 'rgba(214,170,74,0.55)';
          ctx.beginPath();
          let started = false;
          for (const P of pts) {
            if (P.d < 40) continue;
            if (!started) {
              ctx.moveTo(P.x, P.y);
              started = true;
            } else ctx.lineTo(P.x, P.y);
          }
          ctx.stroke();
          // light pulses travelling along the rail (conveyor feel)
          ctx.globalCompositeOperation = 'lighter';
          const gs = glowSprite(GOLD_RGBA, 0.15);
          for (let k = 0; k < 14; k++) {
            const z = ((k * 420 + t * 900) % (ST[2][2] + 2400)) as number;
            const P = project(cam, [0, y, z]);
            if (P.d < 40) continue;
            const r = 22 * P.s;
            ctx.globalAlpha = 0.8;
            ctx.drawImage(gs, P.x - r, P.y - r, r * 2, r * 2);
          }
          // station markers
          ST.forEach((s, i) => {
            const P = project(cam, [s[0] * 0.6, y, s[2]]);
            if (P.d < 40) return;
            const lit = i <= active ? 1 : 0.35;
            ctx.globalAlpha = lit;
            const r = 46 * P.s;
            ctx.drawImage(glowSprite(i === 2 && t > T_INSP && t < T_MATCH ? RED_RGBA : GOLD_RGBA, 0.2), P.x - r, P.y - r, r * 2, r * 2);
          });
          ctx.globalAlpha = 1;
          ctx.globalCompositeOperation = 'source-over';
        }}
      />
      {/* depth plates (blurred, far) */}
      <Plane cam={cam} p={[-900, -200, ST[1][2] + 600]} w={700} h={520} rotY={40} opacity={0.45} focus={VIEW} dof={9}>
        <Photo src={IMG.cnc} w={700} h={520} radius={10} />
      </Plane>
      <Plane cam={cam} p={[950, -150, ST[2][2] + 700]} w={700} h={520} rotY={-40} opacity={0.4} focus={VIEW} dof={9}>
        <Photo src={IMG.factory} w={700} h={520} radius={10} />
      </Plane>
      {/* stations */}
      {STATIONS.map((s, i) => {
        const lit = i === active ? 1 : 0.45;
        return (
          <Plane key={i} cam={cam} p={ST[i]} w={CWd} h={CHt} rotY={i === 1 ? -7 : 6} opacity={i === 2 ? 1 - whip * 0.6 : 1} near={50}>
            <div style={{width: CWd, height: CHt, borderRadius: 24, overflow: 'hidden', position: 'relative', border: `1.5px solid rgba(233,207,143,${0.2 + 0.5 * lit})`, boxShadow: '0 40px 90px rgba(0,0,0,0.6)'}}>
              <Photo src={s.img} w={CWd} h={CHt} pos={s.pos} grade={`saturate(0.8) contrast(1.06) brightness(${0.55 + 0.4 * lit}) sepia(0.1)`} />
              <div style={{position: 'absolute', left: 22, bottom: 20, display: 'flex', alignItems: 'center', gap: 12}}>
                <La size={15} track={0.3} color={C.goldLight} weight={700}>
                  {`0${i + 1}`}
                </La>
                <div style={{width: 30, height: 1.5, background: C.gold}} />
                <La size={15} track={0.3} color={C.white} weight={700}>
                  {s.en}
                </La>
              </div>
              {i === 2 && <InspectionOverlay t={t} />}
            </div>
          </Plane>
        );
      })}

      {/* headline per station */}
      <At y={345} style={{zIndex: 300000}}>
        <Reveal t={t} at={T_FOLLOW} dur={0.45} out={T_SAMPLE - 0.2} outDur={0.2}>
          <La size={22} track={0.5} color={C.goldPale}>
            We follow your order
          </La>
        </Reveal>
      </At>
      {STATIONS.slice(0, 2).map((s, i) => (
        <At key={i} y={345} style={{zIndex: 300000}}>
          <Reveal t={t} at={s.t} dur={0.45} out={STATIONS[i + 1].t - 0.3} outDur={0.22}>
            <Ar size={104} weight={800} color={C.white} lh={1.15}>
              {s.ar}
            </Ar>
          </Reveal>
        </At>
      ))}
      <At y={345} style={{zIndex: 300000}}>
        <Reveal t={t} at={T_INSP - 0.04} dur={0.5} blur={18} out={S6.end - 0.6} outDur={0.3}>
          <RGBSplit t={t} at={T_INSP} px={8}>
            <Ar size={150} weight={800} gold shimmer={ramp(t, T_INSP, T_INSP + 1.2, ease.inOut)} lh={1.1}>
              فحص
            </Ar>
          </RGBSplit>
        </Reveal>
      </At>
      <At y={450} style={{zIndex: 300000}}>
        <Reveal t={t} at={T_PRESHIP} dur={0.45} out={S6.end - 0.6} outDur={0.3}>
          <La size={20} track={0.42} color={C.goldPale}>
            Pre-shipment inspection
          </La>
        </Reveal>
      </At>

      {/* VERIFIED seal */}
      {seal > 0 && sealOut < 1 && (
        <At y={930} style={{zIndex: 400000, opacity: clamp(seal * 1.6) * (1 - sealOut), transform: `translate(-50%,-50%) scale(${(1.6 - 0.6 * seal) * (1 + sealOut * 0.4)}) rotate(${(1 - seal) * -14}deg)`}}>
          <div style={{width: 380, height: 380, borderRadius: 190, position: 'relative', background: 'radial-gradient(circle, rgba(16,14,10,0.94) 0%, rgba(10,9,8,0.9) 66%)', border: `4px solid ${C.goldLight}`, boxShadow: `0 0 0 10px rgba(201,151,28,0.18), 0 0 90px rgba(226,182,80,0.45)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
            <svg width={380} height={380} style={{position: 'absolute', inset: 0}} viewBox="0 0 380 380">
              <defs>
                <path id="sealArc" d="M190 190 m-150 0 a150 150 0 1 1 300 0 a150 150 0 1 1 -300 0" />
              </defs>
              <circle cx={190} cy={190} r={128} fill="none" stroke="rgba(240,211,138,0.45)" strokeWidth={1.5} />
              <text fill={C.goldLight} fontFamily="Montserrat" fontWeight={700} fontSize={19} letterSpacing={6.5}>
                <textPath href="#sealArc">QUALITY CHECK · PRE-SHIPMENT · QUALITY CHECK · PRE-SHIPMENT ·</textPath>
              </text>
            </svg>
            <svg width={110} height={90} viewBox="0 0 48 40">
              <path d="M8 21l10 10L40 8" fill="none" stroke={C.goldLight} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={50} strokeDashoffset={50 * (1 - ramp(t, T_MATCH + 0.1, T_MATCH + 0.45))} />
            </svg>
            <La size={30} track={0.3} color={C.white} weight={800} style={{marginTop: 4}}>
              Verified
            </La>
          </div>
        </At>
      )}
      <Flash t={t} at={T_MATCH + 0.06} dur={0.4} peak={0.35} />
      {whip > 0 && <AbsoluteFill style={{background: `radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 20%, rgba(7,8,10,${whip}) 75%)`, zIndex: 500000, width: W}} />}
    </AbsoluteFill>
  );
};
