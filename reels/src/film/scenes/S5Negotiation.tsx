import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, IMG} from '../brand';
import {back, Cam, clamp, ease, lerp, mix3, project, ramp, V3} from '../lib';
import {Ar, At, glass, La, Photo, Plane, Reveal} from '../ui';
import {at} from '../timing';
import {S4} from './S4Sourcing';

/** Scene 5 — compare offers, negotiate price / specifications / terms → RIGHT MATCH. */
const T_CMP = at('نقارن');
const T_NEG = at('ونتفاوض');
const T_PRICE = at('الأسعار');
const T_SPEC = at('والمواصفات');
const T_NEED = at('بما');
const T_NEXT = at('نتابع');
const T_MERGE = at('احتياجك') + 0.05;

export const S5 = {start: S4.end - 0.4, end: T_NEXT - 0.08};

const MATCH: V3 = [0, 260, 1050];

export const s5Cam = (t: number): Cam => {
  const drift = ramp(t, S5.start, T_MERGE, ease.inOut);
  const fly = ramp(t, S5.end - 0.5, S5.end, (x) => x * x * x);
  const base: V3 = [lerp(-120, 90, drift), lerp(-40, 40, drift), lerp(-260, -60, drift)];
  const into: V3 = [MATCH[0], MATCH[1], MATCH[2] - 110];
  const lookDown = ramp(t, T_MERGE, S5.end, ease.inOut);
  return {pos: mix3(base, into, fly), yaw: lerp(0.07, -0.05, drift) * (1 - fly), pitch: 0.12 * lookDown * (1 - fly)};
};
export const s5Match = (t: number) => project(s5Cam(t), MATCH);

const Icon: React.FC<{k: number}> = ({k}) => {
  const s = {fill: 'none', stroke: C.goldLight, strokeWidth: 2.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
  return (
    <svg width={64} height={64} viewBox="0 0 48 48">
      {k === 0 && (
        <>
          <path d="M26 6h14v14L22 38a3 3 0 01-4 0L8 28a3 3 0 010-4z" {...s} />
          <circle cx={33} cy={13} r={2.5} {...s} />
        </>
      )}
      {k === 1 && (
        <>
          <path d="M8 14h32M8 24h32M8 34h32" {...s} />
          <circle cx={18} cy={14} r={3.5} {...s} fill="#111" />
          <circle cx={31} cy={24} r={3.5} {...s} fill="#111" />
          <circle cx={14} cy={34} r={3.5} {...s} fill="#111" />
        </>
      )}
      {k === 2 && (
        <>
          <path d="M12 6h18l8 8v28H12z" {...s} />
          <path d="M30 6v8h8M18 22h14M18 29h14M18 36h8" {...s} />
        </>
      )}
    </svg>
  );
};

const TERMS: [string, string, number][] = [
  ['السعر', 'Price', T_PRICE],
  ['المواصفات', 'Specifications', T_SPEC],
  ['الشروط', 'Terms', T_NEED],
];

export const Scene5: React.FC<{t: number}> = ({t}) => {
  const cam = s5Cam(t);
  const offersIn = ramp(t, T_CMP - 0.1, T_CMP + 0.5);
  const offersOut = ramp(t, T_PRICE - 0.35, T_PRICE + 0.05);
  const neg = ramp(t, T_NEG, T_NEG + 0.9, ease.inOut);
  const merge = ramp(t, T_MERGE, T_MERGE + 0.5, ease.inOut);
  const match = ramp(t, T_MERGE + 0.35, T_MERGE + 0.85, (x) => back(x, 1.6));
  const fly = ramp(t, S5.end - 0.5, S5.end, ease.in);
  const photoFocus = 1 - 0.45 * ramp(t, T_PRICE - 0.3, T_PRICE + 0.3);

  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse 85% 60% at 50% 45%, #15171c 0%, ${C.ink} 78%)`, overflow: 'hidden'}}>
      {/* negotiation photo in a glass frame */}
      <Plane cam={cam} p={[0, -330, 1500]} w={820} h={820} rotY={-6} opacity={photoFocus * (1 - fly)}>
        <div style={{...glass(0.3), padding: 14, borderRadius: 30}}>
          <Photo src={IMG.fairBooth} w={792} h={792} pos="40% 50%" radius={20} zoom={1 + 0.05 * ramp(t, S5.start, S5.end, ease.linear)} />
        </div>
      </Plane>

      {/* offers being compared */}
      {offersIn > 0 &&
        offersOut < 1 &&
        ['A', 'B', 'C'].map((n, k) => {
          const base = [0.78, 0.6, 0.9][k];
          const negotiated = [0.66, 0.42, 0.74][k];
          const fill = lerp(base, negotiated, neg) * ramp(t, T_CMP + k * 0.12, T_CMP + 0.6 + k * 0.12, ease.out);
          const best = k === 1 ? neg : 0;
          return (
            <Plane key={n} cam={cam} p={[0, 230 + k * 122, 1350]} w={760} h={100} opacity={offersIn * (1 - offersOut)} rotY={-4}>
              <div style={{...glass(0.5, best > 0.5 ? 'rgba(240,211,138,0.85)' : 'rgba(233,207,143,0.32)'), width: 760, height: 100, borderRadius: 20, display: 'flex', alignItems: 'center', padding: '0 34px', gap: 26, boxSizing: 'border-box'}}>
                <La size={20} track={0.3} color={best > 0.5 ? C.goldLight : C.mist} weight={700} style={{width: 150}}>
                  {`Offer ${n}`}
                </La>
                <div style={{flex: 1, height: 12, borderRadius: 6, background: 'rgba(255,255,255,0.1)', overflow: 'hidden'}}>
                  <div style={{width: `${fill * 100}%`, height: '100%', borderRadius: 6, background: best > 0.5 ? `linear-gradient(90deg, ${C.goldDark}, ${C.goldLight})` : 'rgba(255,255,255,0.45)'}} />
                </div>
              </div>
            </Plane>
          );
        })}

      {/* price / specifications / terms */}
      {TERMS.map(([ar, en, ts], k) => {
        if (t < ts - 0.05) return null;
        const p = ramp(t, ts - 0.05, ts + 0.5, (x) => back(x, 1.5));
        const fan: V3 = [(k - 1) * 330, 290, 1050 + Math.abs(k - 1) * 60];
        const pos = mix3([fan[0], fan[1] + (1 - p) * 220, fan[2] + (1 - p) * 500], MATCH, merge);
        const op = clamp(p * 1.4) * (1 - ramp(t, T_MERGE + 0.3, T_MERGE + 0.6));
        return (
          <Plane key={en} cam={cam} p={pos} w={300} h={300} rotY={(k - 1) * -10 * (1 - merge)} rotZ={(k - 1) * 3 * (1 - merge)} opacity={op}>
            <div style={{...glass(0.5), width: 300, height: 300, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10}}>
              <Icon k={k} />
              <Ar size={44} weight={800} color={C.white} lh={1.3}>
                {ar}
              </Ar>
              <La size={16} track={0.32} color={C.goldLight}>
                {en}
              </La>
            </div>
          </Plane>
        );
      })}

      {/* resolved state */}
      {match > 0 && (
        <Plane cam={cam} p={MATCH} w={420} h={420} opacity={clamp(match * 1.5)} near={30}>
          <div style={{width: 420, height: 420, borderRadius: 210, border: `3px solid ${C.goldLight}`, background: 'radial-gradient(circle, rgba(201,151,28,0.32) 0%, rgba(12,12,14,0.9) 70%)', boxShadow: `0 0 90px rgba(226,182,80,${0.5 * match})`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: `scale(${0.7 + 0.3 * match})`}}>
            <svg width={110} height={110} viewBox="0 0 48 48">
              <path d="M11 25l8 8 18-18" fill="none" stroke={C.goldLight} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={40} strokeDashoffset={40 * (1 - ramp(t, T_MERGE + 0.45, T_MERGE + 0.85))} />
            </svg>
            <La size={24} track={0.4} color={C.white} weight={800} style={{marginTop: 6}}>
              Right match
            </La>
          </div>
        </Plane>
      )}

      {/* headline */}
      <At y={330} style={{zIndex: 300000}}>
        <Reveal t={t} at={T_CMP} dur={0.45} out={T_NEG - 0.15} outDur={0.25}>
          <La size={24} track={0.5} color={C.goldPale}>
            Compare offers
          </La>
        </Reveal>
      </At>
      <At y={330} style={{zIndex: 300000}}>
        <Reveal t={t} at={T_NEG} dur={0.5} out={S5.end - 0.55} outDur={0.3}>
          <La size={24} track={0.5} color={C.goldPale}>
            Negotiation
          </La>
        </Reveal>
      </At>
    </AbsoluteFill>
  );
};
