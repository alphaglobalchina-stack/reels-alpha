import React from 'react';
import {AbsoluteFill} from 'remotion';
import land from '../../../../content/land-dots.json';
import dots from '../../../../content/china-dots.json';
import {C} from '../../film/brand';
import {back, clamp, CX, CY, ease, lerp, ramp} from '../../film/lib';
import {Ar, CanvasLayer, glowSprite, GOLD_RGBA, La, WHITE_RGBA} from '../../film/ui';
import {Haze} from '../engine';
import {at} from '../t2';
import {A_END} from './A_City';

/** Shot B — the node becomes a luminous globe, fast orbit to Guangzhou, vertical dive through haze. */
const T_GZ = at('قوانزو');
const T_IN = at('في', 1, 5);
const T_HEART = at('قلب');
const T_WORK = at('نعمل');
export const B = {start: A_END - 0.06, end: T_WORK - 0.02};
export const B_DIVE_END = T_WORK - 0.05;

type LL = [number, number];
const LAND = land as LL[];
const CHINA = (dots as unknown as {china: LL[]}).china;
const GZ: LL = [113.2644, 23.1291];
const R0 = 430;

const ortho = (lon0: number, lat0: number, R: number, cx: number, cy: number) => {
  const l0 = (lon0 * Math.PI) / 180, p0 = (lat0 * Math.PI) / 180;
  const sp0 = Math.sin(p0), cp0 = Math.cos(p0);
  return ([lon, lat]: LL) => {
    const l = (lon * Math.PI) / 180 - l0, p = (lat * Math.PI) / 180;
    const cp = Math.cos(p), sp = Math.sin(p), cl = Math.cos(l);
    return {x: cx + R * cp * Math.sin(l), y: cy - R * (cp0 * sp - sp0 * cp * cl), z: sp0 * sp + cp0 * cp * cl};
  };
};

export const ShotB: React.FC<{t: number}> = ({t}) => {
  const spin = ramp(t, B.start, T_GZ + 0.55, (x) => 1 - Math.pow(1 - x, 3));
  const lon0 = lerp(-40, GZ[0], spin);
  const lat0 = lerp(-8, GZ[1] - 4, spin);
  const roll = lerp(0.12, -0.04, spin) + 0.04 * ramp(t, T_HEART, B.end);
  const birth = ramp(t, B.start, B.start + 0.22, ease.out);
  const dive = ramp(t, T_HEART - 0.1, B_DIVE_END, (x) => x * x * x);
  const zoom = Math.exp(dive * 3.6);
  const haze = ramp(t, B_DIVE_END - 0.55, B_DIVE_END - 0.05) * (1 - ramp(t, B_DIVE_END + 0.05, B.end + 0.3));
  const P = ortho(lon0, lat0, R0, CX, CY);
  const gz = P(GZ);
  const fx = gz.x, fy = gz.y; // dive focus
  const hero = ramp(t, T_GZ - 0.05, T_GZ + 0.45, (x) => back(x, 1.4));
  const heroOut = ramp(t, T_HEART + 0.05, B_DIVE_END - 0.1, (x) => x * x);

  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse 80% 55% at 50% 50%, #121a2c 0%, ${C.navy} 50%, ${C.ink} 100%)`, overflow: 'hidden'}}>
      <CanvasLayer
        draw={(ctx) => {
          ctx.save();
          ctx.translate(fx, fy);
          ctx.rotate(roll);
          ctx.scale(zoom, zoom);
          ctx.translate(-fx, -fy);
          // atmosphere + body
          const R = R0 * lerp(0.92, 1, birth);
          const atm = ctx.createRadialGradient(CX, CY, R * 0.92, CX, CY, R * 1.22);
          atm.addColorStop(0, 'rgba(201,151,28,0)');
          atm.addColorStop(0.4, `rgba(226,182,80,${0.28 * birth})`);
          atm.addColorStop(1, 'rgba(201,151,28,0)');
          ctx.fillStyle = atm;
          ctx.beginPath();
          ctx.arc(CX, CY, R * 1.22, 0, Math.PI * 2);
          ctx.fill();
          const body = ctx.createRadialGradient(CX - R * 0.35, CY - R * 0.4, 10, CX, CY, R);
          body.addColorStop(0, '#1c2638');
          body.addColorStop(1, '#070a11');
          ctx.fillStyle = body;
          ctx.beginPath();
          ctx.arc(CX, CY, R, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = `rgba(240,211,138,${0.9 - 0.6 * birth})`;
          ctx.lineWidth = 3 / zoom;
          ctx.stroke();
          // graticule
          ctx.strokeStyle = 'rgba(233,207,143,0.08)';
          ctx.lineWidth = 1 / zoom;
          for (let lon = -180; lon < 180; lon += 20) {
            ctx.beginPath();
            let on = false;
            for (let lat = -80; lat <= 80; lat += 4) {
              const q = P([lon, lat]);
              if (q.z <= 0) { on = false; continue; }
              on ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y);
              on = true;
            }
            ctx.stroke();
          }
          // land + China (dots keep a constant size while we dive)
          const ds = 1 / Math.sqrt(zoom);
          for (const p of LAND) {
            const q = P(p);
            if (q.z <= 0.02) continue;
            const r = (2.2 + 1.4 * q.z) * ds;
            ctx.fillStyle = `rgba(165,175,195,${(0.12 + 0.3 * q.z) * birth})`;
            ctx.fillRect(q.x - r / 2, q.y - r / 2, r, r);
          }
          for (const p of CHINA) {
            const q = P(p);
            if (q.z <= 0.02) continue;
            const near = clamp(1 - Math.hypot(p[0] - GZ[0], p[1] - GZ[1]) / 12);
            const r = (1.6 + 0.9 * q.z) * ds * (1 + near * 0.6);
            ctx.fillStyle = `rgba(${230},${180 + 40 * near},${90 + 70 * near},${(0.55 + 0.45 * near) * birth})`;
            ctx.fillRect(q.x - r / 2, q.y - r / 2, r, r);
          }
          ctx.restore();
          // Guangzhou pulse + HUD crosshair (screen space)
          const g = {x: fx, y: fy};
          ctx.globalCompositeOperation = 'lighter';
          const pr = 30 + 26 * Math.sin(t * 9) ** 2;
          ctx.drawImage(glowSprite(GOLD_RGBA, 0.15), g.x - pr, g.y - pr, pr * 2, pr * 2);
          ctx.drawImage(glowSprite(WHITE_RGBA, 0.3), g.x - 12, g.y - 12, 24, 24);
          ctx.globalCompositeOperation = 'source-over';
          const hud = ramp(t, T_GZ - 0.1, T_GZ + 0.2) * (1 - ramp(t, T_HEART + 0.1, T_HEART + 0.4));
          if (hud > 0) {
            ctx.strokeStyle = `rgba(240,211,138,${0.55 * hud})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(g.x - 900, g.y); ctx.lineTo(g.x - 40, g.y);
            ctx.moveTo(g.x + 40, g.y); ctx.lineTo(g.x + 900, g.y);
            ctx.moveTo(g.x, g.y - 900); ctx.lineTo(g.x, g.y - 40);
            ctx.moveTo(g.x, g.y + 40); ctx.lineTo(g.x, g.y + 900);
            ctx.stroke();
            for (let k = 0; k < 2; k++) {
              const ph = ((t - T_GZ) * 1.6 + k / 2) % 1;
              ctx.strokeStyle = `rgba(240,211,138,${0.8 * (1 - ph) * hud})`;
              ctx.beginPath();
              ctx.arc(g.x, g.y, 14 + ph * 90, 0, Math.PI * 2);
              ctx.stroke();
            }
          }
        }}
      />
      {/* coordinates HUD — brief */}
      {(() => {
        const hud = ramp(t, T_GZ, T_GZ + 0.15) * (1 - ramp(t, T_HEART, T_HEART + 0.2));
        if (hud <= 0) return null;
        const flick = 0.75 + 0.25 * Math.round((Math.sin(t * 40) + 1) / 2);
        const s = '23.1291° N   113.2644° E';
        const n = Math.round(ramp(t, T_GZ, T_GZ + 0.4) * s.length);
        return (
          <div style={{position: 'absolute', left: fx + 30, top: fy + 26, opacity: hud * flick}}>
            <La size={24} track={0.26} color={C.white} weight={700}>
              Guangzhou
            </La>
            <La size={16} track={0.18} color={C.goldLight} weight={500} style={{marginTop: 6}}>
              {s.slice(0, n)}
            </La>
          </div>
        );
      })()}
      {/* قوانزو — swings in on a perspective axis */}
      {hero > 0 && heroOut < 1 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `scale(${1 + heroOut * 3}) translateY(${-heroOut * 120}px)`, opacity: 1 - heroOut, filter: heroOut > 0.02 ? `blur(${heroOut * 18}px)` : undefined}}>
          <div style={{transform: `perspective(1300px) rotateY(${(1 - hero) * 75}deg) scale(${lerp(1.5, 1, hero)})`, opacity: clamp(hero * 1.6), filter: hero < 1 ? `blur(${(1 - hero) * 14}px)` : undefined}}>
            <Ar size={220} weight={900} gold shimmer={ramp(t, T_GZ, T_GZ + 1, ease.inOut)} lh={1.1}>
              قوانزو
            </Ar>
          </div>
          {t > T_IN - 0.04 && (
            <div style={{transform: `scale(${lerp(1.8, 1, ramp(t, T_IN - 0.04, T_IN + 0.25, (x) => back(x, 1.5)))})`, opacity: ramp(t, T_IN - 0.04, T_IN + 0.15)}}>
              <Ar size={76} weight={800} color={C.white}>
                في قلب الصين
              </Ar>
            </div>
          )}
        </div>
      )}
      <Haze t={t} k={haze} />
    </AbsoluteFill>
  );
};
