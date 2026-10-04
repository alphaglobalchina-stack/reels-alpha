import React from 'react';
import {AbsoluteFill, OffthreadVideo, Sequence, staticFile} from 'remotion';
import {C, IMG} from '../brand';
import {Cam, clamp, ease, lerp, mix3, project, ramp, rnd, V3, W, H} from '../lib';
import {Ar, At, CanvasLayer, glowSprite, GOLD_RGBA, La, RED_RGBA, Reveal, WHITE_RGBA} from '../ui';
import {at} from '../timing';

/** Scene 1 — Hook: China / opportunity → many suppliers → the right one → portal. */
export const S1 = {
  start: 0,
  get end() {
    return at('من', 1, 5.5) + 0.02; // portal completes as "من قوانزو" begins
  },
};

const T_BUT = at('لكن');
const T_SUPPLIER = at('المورد');
const T_RIGHT = at('الصحيح');
const T_START = at('هو');
const T_ONLY = at('فقط');

export const S1_TARGET: V3 = [150, -60, 1700];

// Node field above the city (deterministic).
const NODES: V3[] = Array.from({length: 120}, (_, i) => [
  (rnd(i * 3.3) - 0.5) * 2600,
  -820 + rnd(i * 5.1) * 1250,
  700 + rnd(i * 9.7) * 3300,
]);
NODES[17] = S1_TARGET;
const LINKS: [number, number][] = [];
NODES.forEach((a, i) =>
  NODES.forEach((b, j) => {
    if (j <= i) return;
    const d = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
    if (d < 560 && rnd(i * 13 + j) > 0.35) LINKS.push([i, j]);
  }),
);

const dollyP = (t: number) => ramp(t, T_START - 0.25, S1.end, (x) => x * x * (0.35 + 0.65 * x) * 0.6 + ease.inOut(x) * 0.4);

export const s1Cam = (t: number): Cam => {
  const dolly = dollyP(t);
  const base: V3 = [0, 40 - ramp(t, T_BUT - 0.3, T_RIGHT + 0.5, ease.inOut) * 120, -ramp(t, 0, T_START, ease.soft) * 260];
  const to: V3 = [S1_TARGET[0], S1_TARGET[1], S1_TARGET[2] - 70];
  return {pos: mix3(base, to, dolly), roll: -0.02 * ramp(t, 0, 5)};
};

export const Scene1: React.FC<{t: number}> = ({t}) => {
  const cam = s1Cam(t);
  const field = ramp(t, T_BUT - 0.05, T_BUT + 0.8);
  const dim = ramp(t, T_RIGHT, T_RIGHT + 0.45);
  const sweep = ramp(t, T_SUPPLIER - 0.05, T_SUPPLIER + 0.9, ease.soft);
  const dolly = dollyP(t);
  const tgt = project(cam, S1_TARGET);

  // background aerial: slow push, darkens as the network takes over
  const bgScale = 1.04 + 0.06 * ramp(t, 0, 4.4, ease.soft) + 0.9 * dolly * dolly;
  const bgDark = 0.95 - 0.34 * field - 0.25 * dolly;
  const heroOut = ramp(t, T_BUT - 0.12, T_BUT + 0.55, ease.in);

  return (
    <AbsoluteFill style={{background: C.ink, overflow: 'hidden'}}>
      <AbsoluteFill
        style={{
          transform: `scale(${bgScale})`,
          transformOrigin: `${(tgt.x / W) * 100}% ${(tgt.y / H) * 100}%`,
          filter: `brightness(${bgDark}) saturate(${0.78 - 0.25 * field}) contrast(1.08) sepia(0.12) blur(${dolly * 8}px)`,
        }}
      >
        <Sequence from={0} layout="none">
          <OffthreadVideo src={staticFile(IMG.tower)} muted style={{width: W, height: H, objectFit: 'cover'}} />
        </Sequence>
      </AbsoluteFill>
      {/* legibility + mood grade */}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(7,8,10,0.66) 0%, rgba(7,8,10,0.18) 30%, rgba(7,8,10,0.05) 55%, rgba(7,8,10,0.7) 100%)'}} />
      <AbsoluteFill style={{background: `rgba(6,9,16,${0.38 * field})`}} />

      {/* Opening line — readable at frame 0 */}
      {heroOut < 1 && (
        <At y={610} style={{opacity: 1 - heroOut, transform: `translate(-50%,-50%) scale(${1.045 - 0.045 * ramp(t, 0, 2, ease.soft) + heroOut * 1.3})`, filter: heroOut > 0.02 ? `blur(${heroOut * 18}px)` : undefined}}>
          <La size={24} track={0.6} color={C.goldPale} style={{marginBottom: 6, opacity: 0.9}}>
            China
          </La>
          <div style={{filter: 'drop-shadow(0 8px 36px rgba(0,0,0,0.7)) brightness(1.18)'}}>
            <Ar size={292} weight={800} gold shimmer={ramp(t, 0.15, 1.6, ease.inOut)} lh={1.1}>
              الصين
            </Ar>
          </div>
          <Ar size={78} weight={700} color="rgba(255,255,255,0.96)" style={{marginTop: -6, textShadow: '0 6px 30px rgba(0,0,0,0.6)'}}>
            مليئة بالفُرَص
          </Ar>
          <div style={{marginTop: 22, height: 2, width: 360 * ramp(t, at('بالفرص'), at('بالفرص') + 0.7), background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)`}} />
        </At>
      )}

      {/* Supplier network */}
      <CanvasLayer
        draw={(ctx) => {
          if (field <= 0) return;
          const pr = NODES.map((p, i) => {
            const rise = (1 - field) * (300 + rnd(i) * 400);
            return project(cam, [p[0], p[1] + rise, p[2]]);
          });
          const sweepR = sweep * 1500;
          // links
          ctx.lineWidth = 1;
          LINKS.forEach(([a, b]) => {
            const A = pr[a], B = pr[b];
            if (A.d < 80 || B.d < 80) return;
            const k = (a === 17 || b === 17 ? 1 : 1 - dim * 0.8) * field;
            ctx.strokeStyle = `rgba(214,170,74,${0.16 * k})`;
            ctx.beginPath();
            ctx.moveTo(A.x, A.y);
            ctx.lineTo(B.x, B.y);
            ctx.stroke();
          });
          ctx.globalCompositeOperation = 'lighter';
          const gs = glowSprite(GOLD_RGBA, 0.16);
          const ws = glowSprite(WHITE_RGBA, 0.25);
          pr.forEach((P, i) => {
            if (P.d < 60) return;
            const isT = i === 17;
            const dist = Math.hypot(P.x - W / 2, P.y - H / 2);
            const hit = sweep > 0 && sweep < 1 ? Math.max(0, 1 - Math.abs(dist - sweepR) / 120) : 0;
            const tw = 0.7 + 0.3 * Math.sin(t * 3 + i * 1.7);
            const a = field * (isT ? 1 : (1 - dim * 0.82) * tw) * (0.55 + hit * 0.9);
            const r = (isT ? 16 + 10 * dim : 8.5) * P.s * 1.7 * (1 + hit);
            ctx.globalAlpha = clamp(a);
            ctx.drawImage(isT && dim > 0 ? ws : gs, P.x - r * 2, P.y - r * 2, r * 4, r * 4);
          });
          ctx.globalAlpha = 1;
          ctx.globalCompositeOperation = 'source-over';
          // search sweep ring
          if (sweep > 0 && sweep < 1) {
            ctx.strokeStyle = `rgba(240,211,138,${0.5 * (1 - sweep)})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(W / 2, H / 2, sweepR, 0, Math.PI * 2);
            ctx.stroke();
          }
          // lock-on on the right supplier
          if (dim > 0) {
            const T = pr[17];
            const lock = ramp(t, T_RIGHT, T_RIGHT + 0.5, ease.out);
            const R = lerp(150, 46, lock) * Math.max(1, T.s * 1.1);
            ctx.strokeStyle = `rgba(240,211,138,${0.9 * lock})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(T.x, T.y, R, 0, Math.PI * 2);
            ctx.stroke();
            ctx.strokeStyle = `rgba(240,211,138,${0.35 * lock})`;
            ctx.beginPath();
            ctx.arc(T.x, T.y, R * 1.7 + Math.sin(t * 4) * 4, 0, Math.PI * 2);
            ctx.stroke();
            // corner brackets — red while acquiring, then gold
            const red = 1 - ramp(t, T_RIGHT + 0.35, T_RIGHT + 0.75);
            const b = R * 1.25;
            ctx.strokeStyle = red > 0.02 ? `rgba(232,64,47,${lock})` : `rgba(240,211,138,${lock})`;
            ctx.lineWidth = 3;
            for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
              ctx.beginPath();
              ctx.moveTo(T.x + sx * b, T.y + sy * (b - 18));
              ctx.lineTo(T.x + sx * b, T.y + sy * b);
              ctx.lineTo(T.x + sx * (b - 18), T.y + sy * b);
              ctx.stroke();
            }
            if (red > 0.02) {
              ctx.globalCompositeOperation = 'lighter';
              ctx.globalAlpha = red * 0.8;
              const rs = glowSprite(RED_RGBA, 0.1);
              ctx.drawImage(rs, T.x + b - 10, T.y - b - 10, 20, 20);
              ctx.globalAlpha = 1;
              ctx.globalCompositeOperation = 'source-over';
            }
          }
        }}
      />

      {/* labels */}
      {field > 0 && dolly < 0.6 && (
        <>
          <At y={330} style={{opacity: field * (1 - ramp(t, T_RIGHT - 0.1, T_RIGHT + 0.2)) * (1 - dolly * 1.6)}}>
            <La size={22} track={0.5} color={C.goldPale}>
              Thousands of suppliers
            </La>
          </At>
          {t > T_RIGHT && (
            <div style={{position: 'absolute', left: tgt.x, top: tgt.y + 110, transform: 'translateX(-50%)', opacity: clamp(1 - dolly * 2)}}>
              <Reveal t={t} at={T_RIGHT + 0.25} rise={14} blur={8}>
                <La size={22} track={0.42} color={C.goldLight}>
                  The right supplier
                </La>
              </Reveal>
            </div>
          )}
          {t > T_ONLY - 0.6 && (
            <At y={330}>
              <Reveal t={t} at={T_START} rise={16} blur={10} out={S1.end - 0.5}>
                <La size={22} track={0.5} color={C.goldPale}>
                  is only the beginning
                </La>
              </Reveal>
            </At>
          )}
        </>
      )}
    </AbsoluteFill>
  );
};
