import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, IMG} from '../brand';
import {Cam, ease, lerp, mix3, project, ramp, rnd, V3, W} from '../lib';
import {Ar, La, Photo, Plane} from '../ui';
import {at} from '../timing';
import {S3} from './S3Market';

/** Scene 4 — sourcing system: SEARCH → VERIFY → COMPARE → SELECT, then fly into the chosen card. */
const T_SEARCH = at('نبحث');
const T_VERIFY = at('الموردين');
const T_COMPARE = at('والمصانع');
const T_SELECT = at('المناسبة');
const T_NEXT = at('نقارن');

export const S4 = {start: S3.end - 0.32, end: T_NEXT + 0.1};

const CW = 300, CHh = 400, GAP = 44;
const COLS = 5, ROWS = 5, Z0 = 2000;
const HALL = 12; // centre card = the hall photo (match from scene 3)
const PICK = 13; // best fit
const SHORT = [7, PICK, 16]; // compared three

const THUMBS: [string, string][] = [
  [IMG.cnc, '40% 50%'], [IMG.line, '50% 40%'], [IMG.pack, '50% 50%'], [IMG.factory, '30% 50%'], [IMG.insp, '50% 30%'],
  [IMG.ware, '40% 60%'], [IMG.cmp, '50% 40%'], [IMG.inspWare, '60% 50%'], [IMG.fairBooth, '80% 40%'], [IMG.factory, '75% 50%'],
  [IMG.line, '50% 75%'], [IMG.cnc, '75% 40%'], [IMG.fairHall, '50% 45%'], [IMG.factory, '55% 55%'], [IMG.pack, '30% 70%'],
  [IMG.ware, '75% 40%'], [IMG.line, '40% 30%'], [IMG.fairBooth, '20% 60%'], [IMG.inspWare, '30% 40%'], [IMG.cnc, '20% 60%'],
  [IMG.pack, '70% 30%'], [IMG.insp, '50% 70%'], [IMG.cmp, '30% 70%'], [IMG.factory, '90% 40%'], [IMG.fairHall, '30% 70%'],
];
const VERIFIED = new Set([1, 3, 7, 9, 11, 13, 16, 18, 21, 23]);

const home = (i: number): V3 => {
  const c = (i % COLS) - (COLS - 1) / 2;
  const r = Math.floor(i / COLS) - (ROWS - 1) / 2;
  const x = c * (CW + GAP);
  return [x, r * (CHh + GAP), Z0 + (x * x) / 2600]; // gentle cylinder
};
const front = (k: number): V3 => [(k - 1) * (CW + 90), 0, Z0 - 620];

export const s4Cam = (t: number): Cam => {
  const pull = ramp(t, S4.start, T_VERIFY + 0.2, ease.inOut);
  const fly = ramp(t, T_NEXT - 0.42, S4.end, (x) => x * x * x);
  const near: V3 = [0, 0, Z0 - 330];
  const far: V3 = [0, 30, Z0 - 2650];
  const sel = cardPos(PICK, t);
  const into: V3 = [sel[0], sel[1], sel[2] - 120];
  const base = mix3(near, far, pull);
  const cmp = ramp(t, T_COMPARE, T_SELECT + 0.3, ease.inOut);
  const mid = mix3(base, [0, 0, Z0 - 2100], cmp);
  return {pos: mix3(mid, into, fly), yaw: lerp(0.04, -0.02, pull) * (1 - fly), roll: 0.015 * (1 - pull)};
};

const cardPos = (i: number, t: number): V3 => {
  const k = SHORT.indexOf(i);
  const h = home(i);
  if (k < 0) {
    const away = ramp(t, T_COMPARE, T_COMPARE + 0.6, ease.inOut);
    return [h[0] * (1 + away * 0.25), h[1] * (1 + away * 0.25), h[2] + away * 700];
  }
  const p = ramp(t, T_COMPARE + k * 0.07, T_COMPARE + 0.6 + k * 0.07, ease.inOut);
  return mix3(h, front(k), p);
};

/** screen centre of the chosen card (portal centre for scene 5). */
export const s4Pick = (t: number) => project(s4Cam(t), cardPos(PICK, t));

const Card: React.FC<{i: number; t: number}> = ({i, t}) => {
  const [src, pos] = THUMBS[i];
  const verify = ramp(t, T_VERIFY + rnd(i) * 0.45, T_VERIFY + 0.3 + rnd(i) * 0.45);
  const isV = VERIFIED.has(i);
  const sel = ramp(t, T_SELECT, T_SELECT + 0.4, ease.out);
  const isPick = i === PICK;
  const inShort = SHORT.includes(i);
  const border = isPick && sel > 0 ? `rgba(240,211,138,${0.5 + 0.5 * sel})` : isV && verify > 0 ? `rgba(233,207,143,${0.25 + 0.3 * verify})` : 'rgba(255,255,255,0.14)';
  return (
    <div
      style={{
        width: CW,
        height: CHh,
        borderRadius: 18,
        overflow: 'hidden',
        background: 'linear-gradient(170deg, #1b1d22 0%, #0d0e11 100%)',
        border: `${isPick && sel > 0 ? 3 : 1.5}px solid ${border}`,
        boxShadow: isPick && sel > 0 ? `0 0 ${60 * sel}px rgba(226,182,80,${0.45 * sel})` : '0 20px 50px rgba(0,0,0,0.5)',
        position: 'relative',
      }}
    >
      <Photo src={src} w={CW} h={i === HALL ? CHh : 210} pos={pos} />
      {i !== HALL && (
        <div style={{padding: '16px 18px'}}>
          <La size={13} track={0.3} color={C.goldPale} weight={600}>
            {`Supplier  ${String(i + 1).padStart(2, '0')}`}
          </La>
          {[0.86, 0.62, 0.74].map((w, k) => (
            <div key={k} style={{height: 7, width: `${w * 100 * (0.7 + 0.3 * rnd(i * 3 + k))}%`, borderRadius: 4, background: 'rgba(255,255,255,0.13)', marginTop: 14}} />
          ))}
          <div style={{display: 'flex', gap: 6, marginTop: 18}}>
            {[0, 1, 2, 3, 4].map((k) => (
              <div key={k} style={{width: 12, height: 12, borderRadius: 6, background: k < 3 + Math.round(rnd(i * 7) * 2) ? C.gold : 'rgba(255,255,255,0.15)', opacity: 0.85}} />
            ))}
          </div>
        </div>
      )}
      {i === HALL && <div style={{position: 'absolute', inset: 0, background: `rgba(7,8,10,${0.55 * ramp(t, S4.start, T_VERIFY)})`}} />}
      {isV && verify > 0 && (
        <div
          style={{
            position: 'absolute',
            right: 14,
            top: 14,
            width: 46,
            height: 46,
            borderRadius: 23,
            background: 'rgba(10,10,12,0.75)',
            border: `2px solid ${C.gold}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `scale(${0.6 + 0.4 * verify})`,
            opacity: verify,
          }}
        >
          <svg width={24} height={24} viewBox="0 0 24 24">
            <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke={C.goldLight} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={24} strokeDashoffset={24 * (1 - verify)} />
          </svg>
        </div>
      )}
      {isPick && sel > 0 && (
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 58, background: `linear-gradient(90deg, ${C.goldDark}, ${C.gold})`, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: sel}}>
          <La size={18} track={0.42} color="#0b0b0c" weight={800}>
            Best fit
          </La>
        </div>
      )}
      {inShort && !isPick && <div style={{position: 'absolute', inset: 0, background: `rgba(7,8,10,${0.5 * sel})`}} />}
    </div>
  );
};

const STEPS: [string, string, number][] = [
  ['بحث', 'Search', T_SEARCH],
  ['تحقّق', 'Verify', T_VERIFY],
  ['مقارنة', 'Compare', T_COMPARE],
  ['اختيار', 'Select', T_SELECT],
];

export const Scene4: React.FC<{t: number}> = ({t}) => {
  const cam = s4Cam(t);
  const cmp = ramp(t, T_COMPARE, T_COMPARE + 0.6);
  const scan = ramp(t, T_SEARCH, T_VERIFY + 0.15, ease.inOut);
  const fly = ramp(t, T_NEXT - 0.42, S4.end, ease.in);
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse 80% 55% at 50% 50%, #12161f 0%, ${C.ink} 75%)`, overflow: 'hidden'}}>
      {Array.from({length: COLS * ROWS}, (_, i) => {
        const inShort = SHORT.includes(i);
        const v = VERIFIED.has(i);
        const verifyDim = ramp(t, T_VERIFY + 0.2, T_VERIFY + 0.6) * (v ? 0 : 0.55);
        const op = (1 - verifyDim) * (inShort ? 1 : 1 - cmp * 0.82) * (i === PICK ? 1 : 1 - fly);
        return (
          <Plane key={i} cam={cam} p={cardPos(i, t)} w={CW} h={CHh} rotY={((i % COLS) - 2) * -4} opacity={op} near={40}>
            <Card i={i} t={t} />
          </Plane>
        );
      })}
      {/* search scan */}
      {scan > 0 && scan < 1 && (
        <div style={{position: 'absolute', top: 0, bottom: 0, left: lerp(-60, W + 60, scan), width: 3, background: `linear-gradient(180deg, transparent, ${C.goldLight}, transparent)`, boxShadow: `0 0 40px 12px rgba(226,182,80,0.35)`, zIndex: 200000}} />
      )}
      {/* step chips */}
      <div style={{position: 'absolute', top: 300, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 22, zIndex: 300000, opacity: ramp(t, T_SEARCH - 0.2, T_SEARCH + 0.2) * (1 - fly)}} dir="rtl">
        {STEPS.map(([ar, en, ts], k) => {
          const on = ramp(t, ts, ts + 0.3);
          const past = k < STEPS.length - 1 ? ramp(t, STEPS[k + 1][2], STEPS[k + 1][2] + 0.3) : 0;
          const lit = on * (1 - past * 0.55);
          return (
            <div key={en} style={{width: 200, padding: '12px 0 14px', borderRadius: 16, border: `1.5px solid rgba(233,207,143,${0.15 + 0.6 * lit})`, background: `rgba(201,151,28,${0.16 * lit})`, display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `scale(${1 + 0.06 * on * (1 - past)})`}}>
              <Ar size={40} weight={800} color={lit > 0.5 ? C.goldLight : `rgba(255,255,255,${0.35 + 0.5 * on})`} lh={1.3}>
                {ar}
              </Ar>
              <La size={14} track={0.36} color={`rgba(233,207,143,${0.4 + 0.6 * lit})`} style={{marginTop: 2}}>
                {en}
              </La>
            </div>
          );
        })}
      </div>
      {/* gold glow pushes through the pick */}
      {fly > 0 && (() => {
        const P = s4Pick(t);
        return <AbsoluteFill style={{background: `radial-gradient(circle at ${P.x}px ${P.y}px, rgba(240,211,138,${0.35 * fly}) 0%, rgba(0,0,0,0) ${30 + 40 * fly}%)`, zIndex: 250000, mixBlendMode: 'screen'}} />;
      })()}
    </AbsoluteFill>
  );
};
