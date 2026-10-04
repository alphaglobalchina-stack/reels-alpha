import React from 'react';
import {AbsoluteFill} from 'remotion';
import dots from '../../../../content/china-dots.json';
import {C} from '../brand';
import {Cam, clamp, ease, H, mix3, project, ramp, V3, W} from '../lib';
import {Ar, At, CanvasLayer, glowSprite, GOLD_RGBA, La, Reveal, WHITE_RGBA} from '../ui';
import {at} from '../timing';
import {S1} from './S1Hook';

/** Scene 2 — inside the portal: dotted China, Guangzhou pin, dive into the city. */
const GZ = {lon: 113.2644, lat: 23.1291};
const K = 36; // world units per degree
const toW = (lon: number, lat: number): V3 => [(lon - GZ.lon) * K, 0, (lat - GZ.lat) * K];

const T_GZ = at('قوانزو');
const T_HEART = at('في', 1, 6);
const T_WORK = at('نعمل');
const T_MARKET = at('السوق');

export const S2 = {start: S1.end - 0.62, end: T_MARKET - 0.1};

const CHINA = (dots as {china: number[][]}).china.map(([a, b]) => toW(a, b));
const LAND = (dots as {land: number[][]}).land.map(([a, b]) => toW(a, b));

const P0: V3 = [-200, -2350, -330];
const P1: V3 = [-40, -1050, -760];
const P2: V3 = [0, -95, -42];

export const s2Cam = (t: number): Cam => {
  const a = ramp(t, S2.start, T_HEART + 0.75, ease.inOut);
  const b = ramp(t, T_WORK - 0.1, S2.end + 0.05, (x) => x * x * x * 0.55 + ease.inOut(x) * 0.45);
  const pos = mix3(mix3(P0, P1, a), P2, b);
  const pitch = 1.3 - 0.39 * a + 0.55 * b;
  return {pos, pitch, yaw: 0.05 * (1 - a) - 0.04 * a, roll: 0.03 - 0.06 * a};
};
/** screen position of the Guangzhou pin (portal centre for scene 3). */
export const s2Pin = (t: number) => project(s2Cam(t), [0, 0, 0]);

export const Scene2: React.FC<{t: number}> = ({t}) => {
  const cam = s2Cam(t);
  const pin = ramp(t, T_GZ - 0.05, T_GZ + 0.55, ease.out);
  const dive = ramp(t, T_WORK - 0.1, S2.end, ease.in);
  const heroOut = ramp(t, T_WORK - 0.05, T_WORK + 0.5, ease.in);
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse 90% 60% at 50% 55%, #111a2b 0%, ${C.navy} 55%, ${C.ink} 100%)`, overflow: 'hidden'}}>
      <CanvasLayer
        draw={(ctx) => {
          // graticule
          ctx.lineWidth = 1;
          for (let lon = 70; lon <= 140; lon += 10) {
            ctx.strokeStyle = 'rgba(233,207,143,0.06)';
            ctx.beginPath();
            for (let lat = 5; lat <= 56; lat += 1) {
              const P = project(cam, toW(lon, lat));
              if (P.d < 30) continue;
              lat === 5 ? ctx.moveTo(P.x, P.y) : ctx.lineTo(P.x, P.y);
            }
            ctx.stroke();
          }
          for (let lat = 10; lat <= 55; lat += 10) {
            ctx.beginPath();
            for (let lon = 66; lon <= 142; lon += 1) {
              const P = project(cam, toW(lon, lat));
              if (P.d < 30) continue;
              lon === 66 ? ctx.moveTo(P.x, P.y) : ctx.lineTo(P.x, P.y);
            }
            ctx.stroke();
          }
          // land context
          ctx.fillStyle = 'rgba(165,175,195,0.28)';
          for (const p of LAND) {
            const P = project(cam, p);
            if (P.d < 30 || P.x < -20 || P.x > W + 20 || P.y < -20 || P.y > H + 20) continue;
            const r = Math.min(9, 5.2 * P.s);
            ctx.fillRect(P.x - r / 2, P.y - r / 2, r, r);
          }
          // China — warm dots, brighter toward Guangzhou
          for (const p of CHINA) {
            const P = project(cam, p);
            if (P.d < 30 || P.x < -20 || P.x > W + 20 || P.y < -20 || P.y > H + 20) continue;
            const dist = Math.hypot(p[0], p[2]);
            const near = clamp(1 - dist / 900) * pin;
            const r = Math.min(14, 7 * P.s);
            ctx.fillStyle = `rgba(${Math.round(218 + 30 * near)},${Math.round(172 + 45 * near)},${Math.round(84 + 60 * near)},${0.74 + 0.26 * near})`;
            ctx.beginPath();
            ctx.arc(P.x, P.y, r / 2, 0, Math.PI * 2);
            ctx.fill();
          }
          // Guangzhou pin: ground rings + light beam
          if (pin > 0) {
            const G = project(cam, [0, 0, 0]);
            for (let k = 0; k < 3; k++) {
              const ph = ((t - T_GZ) * 0.7 + k / 3) % 1;
              ctx.strokeStyle = `rgba(240,211,138,${0.6 * (1 - ph) * pin})`;
              ctx.lineWidth = 2;
              ctx.beginPath();
              for (let a = 0; a <= 64; a++) {
                const ang = (a / 64) * Math.PI * 2;
                const P = project(cam, [Math.cos(ang) * ph * 260, 0, Math.sin(ang) * ph * 260]);
                a === 0 ? ctx.moveTo(P.x, P.y) : ctx.lineTo(P.x, P.y);
              }
              ctx.stroke();
            }
            const top = project(cam, [0, -520 * pin * (1 - dive), 0]);
            const gr = ctx.createLinearGradient(G.x, G.y, top.x, top.y);
            gr.addColorStop(0, `rgba(255,226,160,${0.9 * pin})`);
            gr.addColorStop(1, 'rgba(255,226,160,0)');
            ctx.strokeStyle = gr;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(G.x, G.y);
            ctx.lineTo(top.x, top.y);
            ctx.stroke();
            ctx.globalCompositeOperation = 'lighter';
            const r = (26 + 30 * dive) * Math.max(1, G.s);
            ctx.drawImage(glowSprite(WHITE_RGBA, 0.2), G.x - r, G.y - r, r * 2, r * 2);
            ctx.drawImage(glowSprite(GOLD_RGBA, 0.1), G.x - r * 2.2, G.y - r * 2.2, r * 4.4, r * 4.4);
            ctx.globalCompositeOperation = 'source-over';
          }
        }}
      />
      {/* coordinates tag beside the pin */}
      {pin > 0 && dive < 0.5 && (() => {
        const G = project(cam, [0, 0, 0]);
        const coord = ramp(t, T_GZ + 0.15, T_GZ + 1.1, ease.linear);
        const s1 = '23.1291° N';
        const s2 = '113.2644° E';
        const n = Math.round(coord * (s1.length + s2.length));
        return (
          <div style={{position: 'absolute', left: G.x + 46, top: G.y - 70, opacity: pin * (1 - dive * 2)}}>
            <div style={{width: 2, height: 54, background: C.gold, position: 'absolute', left: -14, top: 8, opacity: 0.8}} />
            <La size={30} track={0.28} color={C.white} weight={700}>
              Guangzhou
            </La>
            <La size={19} track={0.2} color={C.goldPale} weight={500} style={{marginTop: 6}}>
              {s1.slice(0, n)}
              {n > s1.length ? '  ·  ' + s2.slice(0, n - s1.length) : ''}
            </La>
          </div>
        );
      })()}
      {/* hero type */}
      {heroOut < 1 && (
        <At y={430} style={{transform: `translate(-50%,-50%) scale(${1 + heroOut * 1.6})`, opacity: 1 - heroOut, filter: heroOut > 0.02 ? `blur(${heroOut * 16}px)` : undefined}}>
          <Reveal t={t} at={T_GZ} dur={0.6} blur={16}>
            <Ar size={196} weight={800} gold shimmer={ramp(t, T_GZ, T_GZ + 1.4, ease.inOut)} lh={1.15}>
              قوانزو
            </Ar>
          </Reveal>
          <Reveal t={t} at={T_HEART} dur={0.5}>
            <Ar size={64} weight={700} color="rgba(255,255,255,0.94)">
              في قلب الصين
            </Ar>
          </Reveal>
        </At>
      )}
      <At y={300} style={{opacity: 1 - ramp(t, T_GZ - 0.2, T_GZ + 0.2)}}>
        <La size={22} track={0.6} color={C.goldPale}>
          China
        </La>
      </At>
    </AbsoluteFill>
  );
};
