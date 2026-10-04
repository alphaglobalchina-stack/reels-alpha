import React from 'react';
import {AbsoluteFill} from 'remotion';
import copy from '../../../../content/alpha-opening.json';
import {C} from '../brand';
import {clamp, ease, lerp, noise1, ramp, rnd, W} from '../lib';
import {Ar, At, CanvasLayer, glowSprite, GOLD_RGBA, La, Reveal} from '../ui';
import {Flash, LightLeak, RGBSplit} from '../fx';
import {at, BRAND} from '../timing';
import {S8} from './S8Shipping';

/** Scene 9 — the hero line: not just a supplier… a partner inside China. */
const T_DONT = at('لا', 1, 38);
const T_SUP = at('مورد', 1, 39);
const T_ONLY = at('فقط', 1, 39);
const T_OWN = at('امتلك');
const T_PARTNER = at('شريكا');
const T_INSIDE = at('داخل', 1, 41);
const T_CHINA = at('الصين', 1, 41.5);
export const T_NAME = BRAND;

export const S9 = {start: S8.end - 0.02, end: T_NAME + 0.1};
const T_CONV = T_NAME - 0.32;

export const Scene9: React.FC<{t: number}> = ({t}) => {
  const dimSup = ramp(t, T_ONLY + 0.3, T_OWN, ease.soft);
  const goneSup = ramp(t, T_OWN - 0.08, T_OWN + 0.14, ease.in);
  const burst = ramp(t, T_OWN, T_PARTNER + 0.1, ease.out);
  const conv = ramp(t, T_CONV, T_NAME, ease.in);
  const shakeK = t > T_PARTNER && t < T_PARTNER + 0.35 ? Math.pow(1 - (t - T_PARTNER) / 0.35, 2) : 0;
  const sx = noise1(t * 40, 3) * 7 * shakeK;
  const sy = noise1(t * 40, 7) * 7 * shakeK;
  const boxIn = ramp(t, T_SUP - 0.2, T_SUP + 0.25, ease.out);

  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse 70% 45% at 50% 50%, rgba(201,151,28,${0.1 * ramp(t, T_PARTNER, T_PARTNER + 0.6)}) 0%, ${C.ink} 70%)`, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `translate(${sx}px, ${sy}px) scale(${1 - conv * 0.12})`, opacity: 1 - conv}}>
        {/* "don't just look for a supplier…" */}
        {goneSup < 1 && (
          <AbsoluteFill style={{opacity: (1 - dimSup * 0.72) * (1 - goneSup), transform: `scale(${1 - dimSup * 0.08 - goneSup * 0.1})`, filter: dimSup > 0.05 ? `blur(${dimSup * 2.5 + goneSup * 8}px)` : undefined}}>
            <At y={690}>
              <Reveal t={t} at={T_DONT} dur={0.5}>
                <Ar size={70} weight={700} color="rgba(255,255,255,0.92)">
                  لا تبحث عن
                </Ar>
              </Reveal>
            </At>
            <At y={880}>
              <div style={{position: 'relative', width: 470, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <div style={{position: 'absolute', inset: 0, border: `1.5px solid rgba(220,220,220,${0.55 * boxIn})`, borderRadius: 14, clipPath: `inset(0 ${(1 - boxIn) * 50}% 0 ${(1 - boxIn) * 50}%)`}} />
                <Reveal t={t} at={T_SUP} dur={0.45} blur={10}>
                  <Ar size={130} weight={800} color="rgba(236,236,236,0.95)" lh={1.2}>
                    مُوَرِّد
                  </Ar>
                </Reveal>
              </div>
            </At>
            <At y={1070}>
              <Reveal t={t} at={T_ONLY} dur={0.45}>
                <Ar size={70} weight={700} color="rgba(255,255,255,0.8)">
                  فقط…
                </Ar>
              </Reveal>
            </At>
          </AbsoluteFill>
        )}
        {/* the box breaks open — its corners fly to the frame */}
        {burst > 0 && burst < 1 && (
          <AbsoluteFill>
            {[
              [-1, -1],
              [1, -1],
              [1, 1],
              [-1, 1],
            ].map(([dx, dy], k) => {
              const x = W / 2 + dx * lerp(235, 520, burst);
              const y = 880 + dy * lerp(100, 900, burst);
              return (
                <div
                  key={k}
                  style={{
                    position: 'absolute',
                    left: x - (dx < 0 ? 0 : 60),
                    top: y - (dy < 0 ? 0 : 60),
                    width: 60,
                    height: 60,
                    opacity: 1 - burst,
                    borderLeft: dx < 0 ? `2px solid ${C.goldLight}` : undefined,
                    borderRight: dx > 0 ? `2px solid ${C.goldLight}` : undefined,
                    borderTop: dy < 0 ? `2px solid ${C.goldLight}` : undefined,
                    borderBottom: dy > 0 ? `2px solid ${C.goldLight}` : undefined,
                  }}
                />
              );
            })}
          </AbsoluteFill>
        )}
        {/* "own a partner inside China" */}
        <At y={640}>
          <Reveal t={t} at={T_OWN + 0.06} dur={0.45}>
            <Ar size={84} weight={700} color={C.white}>
              امتلك
            </Ar>
          </Reveal>
        </At>
        <At y={880}>
          <Reveal t={t} at={T_PARTNER - 0.03} dur={0.42} blur={22} from={1.25} overshoot={1.1} rise={0}>
            <RGBSplit t={t} at={T_PARTNER} px={16} dur={0.45}>
              <div style={{filter: 'drop-shadow(0 0 40px rgba(226,182,80,0.35))'}}>
                <Ar size={268} weight={900} gold shimmer={ramp(t, T_PARTNER + 0.1, T_PARTNER + 1.5, ease.inOut)} lh={1.15}>
                  شريكًا
                </Ar>
              </div>
            </RGBSplit>
          </Reveal>
        </At>
        <At y={1110}>
          <Reveal t={t} at={T_INSIDE} dur={0.5}>
            <Ar size={124} weight={800} color={C.white} lh={1.2}>
              داخل <span style={{color: C.goldLight}}>الصين</span>
            </Ar>
          </Reveal>
        </At>
        <At y={1265}>
          <Reveal t={t} at={T_CHINA + 0.1} dur={0.5} rise={12}>
            <La size={24} track={0.46} color={C.goldPale} weight={600}>
              {copy.heroEnglish}
            </La>
          </Reveal>
        </At>
      </AbsoluteFill>
      <LightLeak t={t} at={T_PARTNER - 0.1} dur={1.1} x0={-10} x1={110} y={44} strength={0.2} />
      <Flash t={t} at={T_PARTNER} dur={0.3} peak={0.16} />
      {/* convergence: every line of the journey collapses into one point */}
      {conv > 0 && (
        <CanvasLayer
          draw={(ctx) => {
            const cx = W / 2, cy = 860;
            ctx.lineCap = 'round';
            for (let i = 0; i < 90; i++) {
              const a = rnd(i * 2.7) * Math.PI * 2;
              const r0 = 700 + rnd(i * 5.1) * 900;
              const p = clamp(conv * (1.15 + rnd(i) * 0.4) - rnd(i * 3) * 0.15);
              const r = r0 * (1 - p);
              const tail = Math.min(r, 160 + 300 * p);
              ctx.strokeStyle = `rgba(240,211,138,${0.15 + 0.6 * p})`;
              ctx.lineWidth = 1 + 2 * rnd(i * 9);
              ctx.beginPath();
              ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
              ctx.lineTo(cx + Math.cos(a) * (r + tail), cy + Math.sin(a) * (r + tail));
              ctx.stroke();
            }
            for (let k = 0; k < 3; k++) {
              const R = (1 - conv) * (300 + k * 260);
              ctx.strokeStyle = `rgba(240,211,138,${0.5 * conv})`;
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.arc(cx, cy, Math.max(1, R), 0, Math.PI * 2);
              ctx.stroke();
            }
            ctx.globalCompositeOperation = 'lighter';
            const g = 40 + 500 * conv * conv;
            ctx.globalAlpha = conv;
            ctx.drawImage(glowSprite(GOLD_RGBA, 0.25), cx - g, cy - g, g * 2, g * 2);
            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = 'source-over';
          }}
        />
      )}
    </AbsoluteFill>
  );
};
