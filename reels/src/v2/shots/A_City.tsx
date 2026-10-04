import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile} from 'remotion';
import {C, IMG} from '../../film/brand';
import {back, Cam, clamp, CX, CY, ease, H, lerp, mix3, project, ramp, rnd, V3, W} from '../../film/lib';
import {Ar, CanvasLayer, glowSprite, GOLD_RGBA, La, RED_RGBA, WHITE_RGBA} from '../../film/ui';
import {Warp} from '../engine';
import {at} from '../t2';

/**
 * Shot A — Guangzhou hook → hundreds of supplier nodes → the right one → dive into it.
 * "الصين" lives between the buildings: video → type → per-frame depth matte of the tower.
 */
export const T = {
  china: at('الصين'),
  opp: at('بالفرص'),
  but: at('لكن'),
  reach: at('الوصول'),
  sup: at('المورد'),
  right: at('الصحيح'),
  is: at('هو'),
  only: at('فقط'),
  from: at('من', 1, 4.3),
};
export const A_END = T.from - 0.08; // ring fills the frame → globe

export const TARGET: V3 = [210, 160, 2600];
const N = 260;
const NODES: V3[] = Array.from({length: N}, (_, i) => [(rnd(i * 3.17) - 0.5) * 3400, -760 + rnd(i * 5.31) * 1700, 900 + rnd(i * 9.73) * 4300]);
NODES[0] = TARGET;
const BORN = NODES.map((_, i) => (i === 0 ? T.opp - 0.1 : T.opp - 0.05 + Math.pow(rnd(i * 2.2), 1.4) * 0.95));
const LINKS: [number, number][] = [];
for (let i = 0; i < N; i++) {
  const d = NODES.map((p, j) => [j, Math.hypot(p[0] - NODES[i][0], p[1] - NODES[i][1], p[2] - NODES[i][2])] as [number, number]).sort((a, b) => a[1] - b[1]);
  for (const [j, dist] of d.slice(1, 3)) if (j > i && dist < 900) LINKS.push([i, j]);
}

const push = (t: number) => ramp(t, 0, T.is, (x) => 1 - Math.pow(1 - x, 1.6));
const dollyP = (t: number) => ramp(t, T.is - 0.25, A_END, (x) => (x < 0.45 ? 0.12 * ease.inOut(x / 0.45) : 0.12 + 0.88 * Math.pow((x - 0.45) / 0.55, 2.4)));

export const aCam = (t: number): Cam => {
  const base: V3 = [0, -80 * push(t), 1500 * push(t)];
  const to: V3 = [TARGET[0], TARGET[1], TARGET[2] - 70];
  const d = dollyP(t);
  return {pos: mix3(base, to, d), roll: lerp(-0.035, 0.01, push(t)) * (1 - d) + 0.12 * d * d};
};
/** ring radius of the target on screen — grows to the globe size at the cut */
export const ringR = (t: number) => {
  const cam = aCam(t);
  const P = project(cam, TARGET);
  return Math.min(430, 46 * Math.max(1, P.s * 1.15));
};

export const ShotA: React.FC<{t: number}> = ({t}) => {
  const cam = aCam(t);
  const tp = project(cam, TARGET);
  const d = dollyP(t);
  const field = ramp(t, T.opp - 0.1, T.opp + 0.5);
  const collapse = ramp(t, T.right - 0.02, T.right + 0.3, ease.in);
  const lock = ramp(t, T.right, T.right + 0.35, ease.out);
  const sweep = ramp(t, T.reach, T.sup + 0.35, ease.inOut);

  // aerial push on the footage (camera crane-up + push), then the dive into the node
  const bgScale = 1.06 + 0.3 * push(t) + 3.2 * d * d;
  const bgY = -70 * push(t);
  const bgRot = lerp(-1.6, 0.6, push(t));
  const ox = (tp.x / W) * 100, oy = (tp.y / H) * 100;
  const camT = `translateY(${bgY}px) rotate(${bgRot}deg) scale(${bgScale})`;
  const vf = Math.min(368, Math.max(0, Math.round(t * 60)));
  const dim = 0.25 + 0.35 * field + 0.25 * lock;

  // "الصين": between the buildings, then the camera flies through it
  const fly = ramp(t, T.but - 0.02, T.but + 0.5, (x) => x * x * x);
  const chinaScale = lerp(0.86, 1.12, ramp(t, 0, T.but, ease.soft)) * (1 + 7 * fly);
  const chinaOnTop = fly > 0.04;
  const China = (
    <div style={{position: 'absolute', left: -200, right: -200, top: 500, display: 'flex', justifyContent: 'center', transform: `perspective(1400px) rotateX(${lerp(16, 3, ramp(t, 0, T.but))}deg) scale(${chinaScale})`, transformOrigin: '50% 30%', opacity: 1 - ramp(t, T.but + 0.32, T.but + 0.5), filter: fly > 0.02 ? `blur(${fly * 26}px)` : undefined}}>
      <div style={{filter: 'drop-shadow(0 0 2px rgba(60,35,0,0.9)) drop-shadow(0 16px 44px rgba(0,0,0,0.75)) brightness(1.25) contrast(1.1)'}}>
        <Ar size={370} weight={900} gold shimmer={ramp(t, 0.1, 1.3, ease.inOut)} lh={1.05}>
          الصين
        </Ar>
      </div>
    </div>
  );

  return (
    <AbsoluteFill style={{background: C.ink, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: camT, transformOrigin: `${ox}% ${oy}%`, filter: `brightness(${1 - dim * 0.75}) saturate(${0.85 - 0.3 * field}) contrast(1.08) sepia(0.1) blur(${d * d * 10}px)`}}>
        <Sequence from={0} layout="none">
          <OffthreadVideo src={staticFile(IMG.tower)} muted style={{width: W, height: H, objectFit: 'cover'}} />
        </Sequence>
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(7,8,10,0.55) 0%, rgba(7,8,10,0) 28%, rgba(7,8,10,0) 60%, rgba(7,8,10,0.6) 100%)'}} />
      {!chinaOnTop && China}
      {/* depth matte: tower + skyline in front of the type */}
      <AbsoluteFill style={{transform: camT, transformOrigin: `${ox}% ${oy}%`, filter: `brightness(${1 - dim * 0.75}) saturate(${0.85 - 0.3 * field}) contrast(1.08) sepia(0.1)`, opacity: 1 - d}}>
        <Img src={staticFile(`film/tower_fg/${String(vf).padStart(4, '0')}.webp`)} style={{width: W, height: H}} />
      </AbsoluteFill>
      {chinaOnTop && China}
      <div style={{position: 'absolute', left: 0, right: 0, top: 960, display: 'flex', justifyContent: 'center', opacity: ramp(t, 0, 0.01) * (1 - ramp(t, T.but - 0.1, T.but + 0.2))}}>
        <div style={{transform: `translateY(${(1 - ramp(t, T.opp - 0.35, T.opp + 0.15, (x) => back(x, 1.4))) * 40}px)`, opacity: ramp(t, T.opp - 0.38, T.opp - 0.2), filter: `blur(${(1 - ramp(t, T.opp - 0.38, T.opp - 0.1)) * 12}px)`}}>
          <Ar size={92} weight={800} color={C.white} style={{textShadow: '0 8px 30px rgba(0,0,0,0.7)'}}>
            مليئة <span style={{color: C.goldLight}}>بالفُرَص</span>
          </Ar>
        </div>
      </div>

      {/* supplier / data nodes across the city */}
      <CanvasLayer
        draw={(ctx) => {
          if (field <= 0) return;
          const P = NODES.map((p, i) => {
            if (i === 0 || collapse <= 0) return project(cam, p);
            const q = mix3(p, TARGET, collapse * 0.85);
            return project(cam, q);
          });
          // links draw on
          ctx.lineWidth = 1.1;
          LINKS.forEach(([a, b], k) => {
            const born = Math.max(BORN[a], BORN[b]) + 0.08;
            const g = ramp(t, born, born + 0.25);
            if (g <= 0 || P[a].d < 60 || P[b].d < 60) return;
            const al = 0.22 * g * (1 - collapse) * field;
            if (al <= 0.005) return;
            ctx.strokeStyle = `rgba(226,186,96,${al})`;
            ctx.beginPath();
            ctx.moveTo(P[a].x, P[a].y);
            ctx.lineTo(P[a].x + (P[b].x - P[a].x) * g, P[a].y + (P[b].y - P[a].y) * g);
            ctx.stroke();
          });
          ctx.globalCompositeOperation = 'lighter';
          const gs = glowSprite(GOLD_RGBA, 0.16), ws = glowSprite(WHITE_RGBA, 0.25);
          const sweepR = sweep * 1500;
          P.forEach((p, i) => {
            if (p.d < 60 || t < BORN[i]) return;
            const age = t - BORN[i];
            const pop = age < 0.18 ? 1 + 2.5 * (1 - age / 0.18) : 1;
            const hit = sweep > 0 && sweep < 1 ? Math.max(0, 1 - Math.abs(Math.hypot(p.x - CX, p.y - CY) - sweepR) / 140) : 0;
            const isT = i === 0;
            const a = isT ? 1 : (1 - collapse) * (0.55 + 0.45 * Math.sin(t * 5 + i)) * (0.6 + hit);
            const r = (isT ? 15 + 18 * lock : 7) * Math.max(0.5, p.s * 1.5) * pop * (1 + hit * 0.8);
            ctx.globalAlpha = clamp(a);
            ctx.drawImage(isT && lock > 0 ? ws : gs, p.x - r * 2, p.y - r * 2, r * 4, r * 4);
            if (age < 0.25 && !isT) {
              ctx.strokeStyle = `rgba(255,226,160,${0.6 * (1 - age / 0.25)})`;
              ctx.lineWidth = 1.2;
              ctx.beginPath();
              ctx.arc(p.x, p.y, 6 + age * 120 * Math.max(0.6, p.s), 0, Math.PI * 2);
              ctx.stroke();
            }
          });
          // collapse sparks
          if (collapse > 0 && collapse < 1) {
            P.forEach((p, i) => {
              if (i === 0 || i % 3 || p.d < 60) return;
              ctx.strokeStyle = `rgba(255,236,190,${0.5 * (1 - collapse)})`;
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p.x + (tp.x - p.x) * 0.15, p.y + (tp.y - p.y) * 0.15);
              ctx.stroke();
            });
          }
          ctx.globalAlpha = 1;
          ctx.globalCompositeOperation = 'source-over';
          // search sweep
          if (sweep > 0 && sweep < 1) {
            ctx.strokeStyle = `rgba(240,211,138,${0.55 * (1 - sweep)})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(CX, CY, sweepR, 0, Math.PI * 2);
            ctx.stroke();
          }
          // lock-on: red while acquiring → gold; ring grows into the globe outline
          if (lock > 0) {
            const R = Math.max(lerp(170, 50, lock), ringR(t));
            const red = 1 - ramp(t, T.right + 0.3, T.right + 0.6);
            ctx.strokeStyle = `rgba(240,211,138,${0.95})`;
            ctx.lineWidth = 2.5 + 3 * d;
            ctx.beginPath();
            ctx.arc(tp.x, tp.y, R, 0, Math.PI * 2);
            ctx.stroke();
            ctx.strokeStyle = `rgba(240,211,138,0.35)`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(tp.x, tp.y, R * 1.55 + Math.sin(t * 6) * 5, -t * 2, -t * 2 + Math.PI * 1.4);
            ctx.stroke();
            const b = R * 1.22;
            ctx.strokeStyle = red > 0.02 ? `rgba(232,64,47,${lock})` : `rgba(240,211,138,${lock})`;
            ctx.lineWidth = 3;
            for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
              ctx.beginPath();
              ctx.moveTo(tp.x + sx * b, tp.y + sy * (b - 22));
              ctx.lineTo(tp.x + sx * b, tp.y + sy * b);
              ctx.lineTo(tp.x + sx * (b - 22), tp.y + sy * b);
              ctx.stroke();
            }
            if (red > 0.02) {
              ctx.globalCompositeOperation = 'lighter';
              ctx.globalAlpha = red;
              ctx.drawImage(glowSprite(RED_RGBA, 0.1), tp.x + b - 12, tp.y - b - 12, 24, 24);
              ctx.globalAlpha = 1;
              ctx.globalCompositeOperation = 'source-over';
            }
            // core grows into a luminous disc as we dive
            if (d > 0.3) {
              ctx.globalCompositeOperation = 'lighter';
              const rr = R * 1.6 * ramp(t, A_END - 0.35, A_END);
              const g = ctx.createRadialGradient(tp.x, tp.y, 0, tp.x, tp.y, Math.max(1, rr));
              g.addColorStop(0, 'rgba(255,240,210,0.9)');
              g.addColorStop(0.6, 'rgba(240,200,120,0.35)');
              g.addColorStop(1, 'rgba(240,200,120,0)');
              ctx.fillStyle = g;
              ctx.fillRect(tp.x - rr, tp.y - rr, rr * 2, rr * 2);
              ctx.globalCompositeOperation = 'source-over';
            }
          }
        }}
      />
      <Warp t={t} k={ramp(t, T.is + 0.15, A_END, (x) => x * x) * 1.2} cx={tp.x} cy={tp.y} />

      {/* HUD */}
      {t > T.reach - 0.1 && t < T.right + 0.05 && (
        <div style={{position: 'absolute', left: 90, top: 330, opacity: ramp(t, T.reach - 0.1, T.reach + 0.1) * (0.6 + 0.4 * Math.round((Math.sin(t * 22) + 1) / 2))}}>
          <La size={18} track={0.42} color={C.goldPale}>
            ● Searching suppliers
          </La>
        </div>
      )}
      {lock > 0 && d < 0.5 && (
        <div style={{position: 'absolute', left: tp.x + ringR(t) * 1.3 + 16, top: tp.y - 12, opacity: lock * (1 - d * 2)}}>
          <La size={16} track={0.34} color={C.goldLight} weight={700}>
            Target locked
          </La>
          <La size={13} track={0.3} color={C.mist} weight={500} style={{marginTop: 4}}>
            The right supplier
          </La>
        </div>
      )}

      {/* المُوَرِّد / الصحيح — slam in from depth, leave past the lens */}
      {t > T.sup - 0.05 &&
        (() => {
          const out = ramp(t, T.is - 0.2, T.is + 0.25, (x) => x * x);
          if (out >= 1) return null;
          const p1 = ramp(t, T.sup - 0.05, T.sup + 0.28, (x) => back(x, 1.6));
          const p2 = ramp(t, T.right - 0.04, T.right + 0.24, (x) => back(x, 1.8));
          return (
            <div style={{position: 'absolute', left: 0, right: 0, top: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `scale(${1 + out * 3.5})`, opacity: 1 - out, filter: out > 0.02 ? `blur(${out * 20}px)` : undefined}}>
              <div style={{transform: `perspective(1200px) rotateX(${(1 - p1) * 50}deg) scale(${lerp(2.6, 1, p1)})`, opacity: clamp(p1 * 1.5), filter: p1 < 1 ? `blur(${(1 - p1) * 16}px)` : undefined}}>
                <Ar size={170} weight={900} color={C.white} lh={1.15} style={{textShadow: '0 10px 40px rgba(0,0,0,0.7)'}}>
                  المُوَرِّد
                </Ar>
              </div>
              {p2 > 0 && (
                <div style={{transform: `scale(${lerp(3.2, 1, p2)})`, opacity: clamp(p2 * 1.5), filter: p2 < 1 ? `blur(${(1 - p2) * 18}px)` : undefined, marginTop: -10}}>
                  <Ar size={170} weight={900} gold shimmer={ramp(t, T.right, T.right + 0.9, ease.inOut)} lh={1.15}>
                    الصحيح
                  </Ar>
                </div>
              )}
            </div>
          );
        })()}
    </AbsoluteFill>
  );
};
