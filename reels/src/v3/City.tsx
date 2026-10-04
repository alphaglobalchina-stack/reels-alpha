import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile} from 'remotion';
import {C, IMG} from '../film/brand';
import {back, Cam, clamp, CX, CY, ease, H, lerp, mix3, project, ramp, rnd, V3, W} from '../film/lib';
import {CanvasLayer, glowSprite, GOLD_RGBA, RED_RGBA, WHITE_RGBA} from '../film/ui';
import {Warp} from '../v2/engine';
import {Extruded, IVORY_RGBA, Micro, recoil} from './kit';
import {A, CITY, NODE_IN, V} from './plan';

/**
 * Shot 1 — Guangzhou. Footage → monumental extruded "الصين" (behind the tower via a
 * per-frame depth matte) → hundreds of supplier nodes in depth → filtered in waves →
 * one gold node (tiny red active marker) → the camera accelerates into it.
 */
export const TARGET: V3 = [230, 170, 2700];
const N = 280;
const NODES: V3[] = Array.from({length: N}, (_, i) => [(rnd(i * 3.17) - 0.5) * 3600, -820 + rnd(i * 5.31) * 1800, 1000 + rnd(i * 9.73) * 4400]);
NODES[0] = TARGET;
const BORN = NODES.map((_, i) => (i === 0 ? V.opp - 0.12 : V.opp - 0.08 + Math.pow(rnd(i * 2.2), 1.3) * 0.8));
// wave 0/1/2 rejected, 3 = shortlist (vanish on the lock), target survives
const WAVE = NODES.map((_, i) => (i === 0 ? 9 : i % 23 === 0 ? 3 : Math.floor(rnd(i * 6.6) * 3)));
const LINKS: [number, number][] = [];
for (let i = 0; i < N; i++) {
  const d = NODES.map((p, j) => [j, Math.hypot(p[0] - NODES[i][0], p[1] - NODES[i][1], p[2] - NODES[i][2])] as [number, number]).sort((a, b) => a[1] - b[1]);
  for (const [j, dist] of d.slice(1, 3)) if (j > i && dist < 950) LINKS.push([i, j]);
}

const orbitP = (t: number) => ramp(t, 0, A.holdA[0], (x) => 1 - Math.pow(1 - x, 2.4)) + 0.04 * ramp(t, A.holdA[0], A.holdA[1], ease.linear);
const flyP = (t: number) => ramp(t, V.but, V.but + 0.4, (x) => x * x * x);
const diveP = (t: number) => ramp(t, A.dive[0], A.dive[1], (x) => Math.pow(x, 2.6));
const holdB = (t: number) => ramp(t, A.holdB[0], A.holdB[1], ease.soft) * (1 - ramp(t, A.dive[0], A.dive[0] + 0.2));

export const cityCam = (t: number): Cam => {
  const o = orbitP(t);
  const base: V3 = [lerp(-160, 140, o), lerp(40, -60, o), 500 * o + 900 * ramp(t, V.but, V.right, ease.inOut) + recoil(t, V.right, 70) - 90 * holdB(t)];
  const to: V3 = [TARGET[0], TARGET[1], TARGET[2] - 60];
  const settle = ramp(t, V.right + 0.08, A.holdB[0], ease.inOut); // controlled slow: re-centre on the node
  const mid: V3 = [lerp(base[0], TARGET[0] * 0.55, settle), lerp(base[1], TARGET[1] * 0.55, settle), base[2]];
  return {pos: mix3(mid, to, diveP(t)), roll: lerp(-0.04, 0.012, o) * (1 - diveP(t)) + 0.1 * diveP(t) * diveP(t)};
};

/** Screen radius of the selected node's glow (shared element with the map pin). */
export const nodeGlowR = (t: number) => {
  const P = project(cityCam(t), TARGET);
  return Math.min(320, 18 * Math.max(1, P.s * 1.2));
};

export const ShotCity: React.FC<{t: number}> = ({t}) => {
  const cam = cityCam(t);
  const tp = project(cam, TARGET);
  const o = orbitP(t);
  const d = diveP(t);
  const field = ramp(t, V.opp - 0.1, V.opp + 0.4);
  const lock = ramp(t, V.right, V.right + 0.3, ease.out);
  const sweep = ramp(t, V.reach - 0.05, V.sup + 0.3, ease.inOut);
  const vf = Math.min(368, Math.max(0, Math.round(t * 60)));

  // footage: aerial truck + push (fast, then controlled), dive into the node
  const vs = 1.26 + 0.14 * o + 0.22 * ramp(t, V.but, V.right, ease.inOut) + 3.4 * d * d;
  const vx = lerp(120, -100, o);
  const vrot = lerp(-2.2, 0.8, o);
  const ox = (tp.x / W) * 100, oy = (tp.y / H) * 100;
  const camT = `translateX(${vx}px) rotate(${vrot}deg) scale(${vs})`;
  const dark = 0.12 + 0.3 * field + 0.25 * lock + 0.2 * d;
  const grade = `brightness(${1 - dark}) saturate(${0.62 - 0.2 * field}) contrast(1.1) sepia(0.06) hue-rotate(-4deg)`;

  // الصين — a 3-D object in the city: orbit around it, then fly through it
  const fly = flyP(t);
  const chinaS = lerp(0.9, 1.08, o) * (1 + 9 * fly);
  const China = (
    <div style={{position: 'absolute', left: -300, right: -300, top: 470, display: 'flex', justifyContent: 'center', transform: `translateX(${vx * 0.55}px) scale(${chinaS})`, transformOrigin: '50% 40%', opacity: 1 - ramp(t, V.but + 0.26, V.but + 0.4)}}>
      <div style={{filter: 'drop-shadow(0 26px 40px rgba(0,0,0,0.6))'}}>
        <Extruded text="الصين" size={360} rotX={lerp(10, 3, o)} rotY={lerp(24, -8, o)} depth={0.14} slices={14} sheen={ramp(t, 0.15, 1.35, ease.inOut)} />
      </div>
    </div>
  );

  return (
    <AbsoluteFill style={{background: C.ink, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: camT, transformOrigin: `${ox}% ${oy}%`, filter: `${grade} blur(${d * d * 10}px)`}}>
        <Sequence from={0} layout="none">
          <OffthreadVideo src={staticFile(IMG.tower)} muted style={{width: W, height: H, objectFit: 'cover'}} />
        </Sequence>
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(8,11,20,0.55) 0%, rgba(8,11,20,0) 30%, rgba(8,11,20,0) 62%, rgba(8,9,12,0.62) 100%)'}} />
      {fly <= 0.04 && China}
      <AbsoluteFill style={{transform: camT, transformOrigin: `${ox}% ${oy}%`, filter: grade, opacity: 1 - d}}>
        <Img src={staticFile(`film/tower_fg/${String(vf).padStart(4, '0')}.webp`)} style={{width: W, height: H}} />
      </AbsoluteFill>
      {fly > 0.04 && China}

      {/* supplier / opportunity nodes in depth */}
      <CanvasLayer
        draw={(ctx) => {
          if (field <= 0) return;
          const P = NODES.map((p, i) => (WAVE[i] === 3 && lock > 0 ? project(cam, mix3(p, TARGET, lock * 0.9)) : project(cam, p)));
          ctx.lineWidth = 1;
          LINKS.forEach(([a, b]) => {
            const born = Math.max(BORN[a], BORN[b]) + 0.06;
            const g = ramp(t, born, born + 0.22);
            if (g <= 0 || P[a].d < 60 || P[b].d < 60) return;
            const alive = (i: number) => (WAVE[i] < 3 ? 1 - ramp(t, A.waves[WAVE[i]], A.waves[WAVE[i]] + 0.16) : WAVE[i] === 3 ? 1 - lock : 1);
            const al = 0.16 * g * Math.min(alive(a), alive(b)) * field;
            if (al < 0.004) return;
            ctx.strokeStyle = `rgba(246,238,222,${al})`;
            ctx.beginPath();
            ctx.moveTo(P[a].x, P[a].y);
            ctx.lineTo(P[a].x + (P[b].x - P[a].x) * g, P[a].y + (P[b].y - P[a].y) * g);
            ctx.stroke();
          });
          ctx.globalCompositeOperation = 'lighter';
          const iv = glowSprite(IVORY_RGBA, 0.2), gs = glowSprite(GOLD_RGBA, 0.16), ws = glowSprite(WHITE_RGBA, 0.25);
          const sweepR = sweep * 1500;
          P.forEach((p, i) => {
            if (p.d < 60 || t < BORN[i]) return;
            const age = t - BORN[i];
            const pop = age < 0.16 ? 1 + 2 * (1 - age / 0.16) : 1;
            const hit = sweep > 0 && sweep < 1 ? Math.max(0, 1 - Math.abs(Math.hypot(p.x - CX, p.y - CY) - sweepR) / 130) : 0;
            const w = WAVE[i];
            let a = 0.55 + 0.35 * Math.sin(t * 5 + i);
            let sz = 6.5;
            if (w < 3) {
              const rej = ramp(t, A.waves[w], A.waves[w] + 0.16);
              a *= 1 - 0.85 * rej;
              sz *= 1 - 0.45 * rej;
            } else if (w === 3) {
              const pre = ramp(t, A.waves[2], A.waves[2] + 0.2);
              a = (a + 0.35 * pre) * (1 - lock);
              sz *= 1 + 0.5 * pre;
            } else {
              a = 1;
              sz = 9 + 16 * lock + 6 * Math.sin(t * 9) * lock;
            }
            const r = sz * Math.max(0.55, p.s * 1.4) * pop * (1 + hit * 0.7);
            ctx.globalAlpha = clamp(a * (0.7 + hit));
            ctx.drawImage(i === 0 ? (lock > 0 ? gs : ws) : iv, p.x - r * 2, p.y - r * 2, r * 4, r * 4);
          });
          ctx.globalAlpha = 1;
          ctx.globalCompositeOperation = 'source-over';
          if (sweep > 0 && sweep < 1) {
            ctx.strokeStyle = `rgba(246,238,222,${0.4 * (1 - sweep)})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(CX, CY, sweepR, 0, Math.PI * 2);
            ctx.stroke();
          }
          // selected supplier: gold pulse + brackets + tiny China-red active marker
          if (lock > 0) {
            const R = Math.max(lerp(150, 46, lock), nodeGlowR(t) * 1.25);
            ctx.strokeStyle = `rgba(240,211,138,${0.9 * (1 - d)})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(tp.x, tp.y, R, 0, Math.PI * 2);
            ctx.stroke();
            const pulse = ((t - V.right) * 1.4) % 1;
            ctx.strokeStyle = `rgba(240,211,138,${0.6 * (1 - pulse) * (1 - d)})`;
            ctx.beginPath();
            ctx.arc(tp.x, tp.y, R * (1 + pulse * 0.9), 0, Math.PI * 2);
            ctx.stroke();
            const b = R * 1.3;
            ctx.strokeStyle = `rgba(246,238,222,${0.85 * lock * (1 - d)})`;
            ctx.lineWidth = 2;
            for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
              ctx.beginPath();
              ctx.moveTo(tp.x + sx * b, tp.y + sy * (b - 16));
              ctx.lineTo(tp.x + sx * b, tp.y + sy * b);
              ctx.lineTo(tp.x + sx * (b - 16), tp.y + sy * b);
              ctx.stroke();
            }
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = lock * (0.7 + 0.3 * Math.sin(t * 14));
            ctx.drawImage(glowSprite(RED_RGBA, 0.25), tp.x + R * 0.72 - 9, tp.y - R * 0.72 - 9, 18, 18);
            ctx.globalAlpha = 1;
            // the node's core blooms as we dive into it (becomes the Guangzhou pin)
            if (d > 0.2) {
              const rr = nodeGlowR(t) * 2.2 * ramp(t, A.dive[1] - 0.4, A.dive[1]);
              const g = ctx.createRadialGradient(tp.x, tp.y, 0, tp.x, tp.y, Math.max(1, rr));
              g.addColorStop(0, 'rgba(255,246,226,0.95)');
              g.addColorStop(0.5, 'rgba(240,206,130,0.4)');
              g.addColorStop(1, 'rgba(240,206,130,0)');
              ctx.fillStyle = g;
              ctx.fillRect(tp.x - rr, tp.y - rr, rr * 2, rr * 2);
            }
            ctx.globalCompositeOperation = 'source-over';
          }
        }}
      />
      <Warp t={t} k={d * 1.3} cx={tp.x} cy={tp.y} color="246,238,222" />

      {/* micro labels */}
      {t > V.reach - 0.1 && t < V.right && (
        <div style={{position: 'absolute', left: 84, top: 300, opacity: ramp(t, V.reach - 0.1, V.reach + 0.1) * (1 - ramp(t, V.right - 0.25, V.right - 0.1))}}>
          <Micro text="Sourcing · filtering suppliers" />
        </div>
      )}
      {lock > 0 && d < 0.3 && (
        <div style={{position: 'absolute', left: tp.x + 70, top: tp.y + 56, opacity: lock * (1 - d * 3)}}>
          <Micro text="Selected" color="rgba(240,211,138,0.95)" dot />
        </div>
      )}

      {/* المُوَرِّد + الصحيح — floating in depth beside the node */}
      {t > V.sup - 0.06 &&
        (() => {
          const out = ramp(t, A.holdB[0] - 0.05, A.dive[0] + 0.15, (x) => x * x);
          if (out >= 1) return null;
          const anchor = {x: 540 + (tp.x - 540) * 0.25, y: 560 + (tp.y - 1000) * 0.15, s: 1};
          const p1 = ramp(t, V.sup - 0.06, V.sup + 0.3, (x) => back(x, 1.5));
          const p2 = ramp(t, V.right - 0.03, V.right + 0.24, (x) => back(x, 1.8));
          const s = (1 + out * 2.5) * (1 + 0.04 * Math.sin(t * 1.3));
          return (
            <div style={{position: 'absolute', left: anchor.x, top: anchor.y, transform: `translate(-50%,-50%) scale(${s})`, opacity: 1 - out, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
              <div style={{transform: `scale(${lerp(2.2, 1, p1)}) translateZ(0)`, opacity: clamp(p1 * 1.5), filter: p1 < 1 ? `blur(${(1 - p1) * 14}px)` : undefined}}>
                <Extruded text="المُوَرِّد" size={150} rotY={lerp(-40, -14, p1)} rotX={6} depth={0.1} slices={9} />
              </div>
              {p2 > 0 && (
                <div style={{transform: `scale(${lerp(2.6, 1, p2)})`, opacity: clamp(p2 * 1.5), filter: p2 < 1 ? `blur(${(1 - p2) * 16}px)` : undefined, marginTop: -18}}>
                  <Extruded text="الصحيح" size={150} rotY={-14} rotX={6} depth={0.1} slices={9} face="gold" sheen={ramp(t, V.right + 0.05, V.right + 0.9, ease.inOut)} />
                </div>
              )}
            </div>
          );
        })()}
    </AbsoluteFill>
  );
};

/**
 * Shot 3 — the map dive lands on the city's lights; the Canton Tower sweeps past the
 * lens (object occlusion) and reveals the Canton Fair behind it.
 */
const CITY_SRC0 = 230; // source frame of the aerial used here
export const CityPass: React.FC<{t: number}> = ({t}) => {
  const k = t - CITY.start;
  const vf = Math.min(368, Math.max(0, Math.round(CITY_SRC0 + k * 60)));
  const descend = ramp(t, CITY.start, CITY.pass[0], (x) => 1 - Math.pow(1 - x, 2));
  const pass = ramp(t, CITY.pass[0], CITY.pass[1], (x) => x * x * (3 - 2 * x));
  const s = lerp(3.0, 2.15, descend) * (1 + 0.45 * pass);
  const baseOp = 1 - ramp(t, CITY.pass[0] + 0.1, CITY.pass[0] + 0.26);
  const towerS = s * (1 + 3.8 * pass * pass);
  const towerX = -1300 * pass * pass;
  const grade = `brightness(${0.8 - 0.25 * pass}) saturate(0.62) contrast(1.12) sepia(0.06)`;
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      {baseOp > 0 && (
        <AbsoluteFill style={{transform: `scale(${s}) rotate(${lerp(9, 2, descend)}deg)`, transformOrigin: '58% 78%', filter: grade, opacity: baseOp}}>
          <Sequence from={Math.round(CITY.start * 60)} layout="none">
            <OffthreadVideo src={staticFile(IMG.tower)} startFrom={CITY_SRC0} muted style={{width: W, height: H, objectFit: 'cover'}} />
          </Sequence>
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{transform: `translateX(${towerX}px) rotate(${lerp(9, 2, descend)}deg) scale(${towerS})`, transformOrigin: '58% 78%', filter: `${grade} brightness(${1 - 0.5 * pass})`, opacity: ramp(t, CITY.start + 0.15, CITY.pass[0])}}>
        <Img src={staticFile(`film/tower_fg/${String(vf).padStart(4, '0')}.webp`)} style={{width: W, height: H}} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
export const CITY_PASS_END = CITY.pass[1];
export {NODE_IN};
