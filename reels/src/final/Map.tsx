import React from 'react';
import {AbsoluteFill} from 'remotion';
import dots from '../../../content/china-dots.json';
import {C} from '../film/brand';
import {clamp, ease, lerp, project, ramp, V3} from '../film/lib';
import {CanvasLayer, glowSprite, GOLD_RGBA, RED_RGBA, WHITE_RGBA} from '../film/ui';
import {lookAt, Micro} from './kit';
import {M, NODE_IN, V} from './plan';

/**
 * Shot 2 — clean dark 3-D map of China. The selected supplier node IS the Guangzhou pin
 * (same screen position and glow at the hand-off). Brief orbit, a short hold, then a
 * fast vertical dive toward Guangzhou.
 */
type LL = [number, number];
const GZ: LL = [113.2644, 23.1291];
const K = 34;
const toW = ([lon, lat]: LL): V3 => [(lon - GZ[0]) * K, 0, (lat - GZ[1]) * K];
const D = dots as unknown as {china: LL[]; land: LL[]};
const CHINA = D.china.map(toW);
const LAND = D.land.map(toW);
const COAST = D.china.filter(([lon, lat]) => !D.china.some(([a, b]) => Math.abs(a - lon - 0.6) < 0.01 && Math.abs(b - lat) < 0.01)).map(toW);

export const mapCam = (t: number) => {
  const orbit = ramp(t, M.start, M.orbitEnd, (x) => 1 - Math.pow(1 - x, 2.6));
  const hold = ramp(t, M.hold[0], M.hold[1], ease.soft);
  const dive = ramp(t, M.dive[0], M.dive[1], (x) => Math.pow(x, 2.2));
  const th = lerp(-1.05, -0.2, orbit) + 0.05 * hold;
  const ph = lerp(0.9, 1.02, orbit) + 0.04 * hold + (1.5 - 1.06) * dive;
  const dist = (lerp(1350, 1150, orbit) + 100 * hold) * Math.exp(-dive * 3.4);
  const pos: V3 = [Math.sin(th) * Math.cos(ph) * dist, -Math.sin(ph) * dist, -Math.cos(th) * Math.cos(ph) * dist];
  return {cam: lookAt(pos, [0, 0, 0], lerp(0.08, -0.03, orbit) + 0.05 * dive), dive, orbit};
};

export const ShotMap: React.FC<{t: number}> = ({t}) => {
  const {cam, dive} = mapCam(t);
  const birth = ramp(t, M.start, M.start + 0.35, ease.out);
  const handoff = 1 - ramp(t, NODE_IN, NODE_IN + 0.35, ease.out); // node core shrinking into the pin
  const label = ramp(t, V.gz - 0.05, V.gz + 0.25) * (1 - ramp(t, M.dive[0], M.dive[0] + 0.15));
  const G = project(cam, [0, 0, 0]);
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse 90% 60% at 50% 50%, #0f1626 0%, ${C.navy} 55%, ${C.ink} 100%)`, overflow: 'hidden'}}>
      <CanvasLayer
        draw={(ctx) => {
          // graticule
          ctx.lineWidth = 1;
          ctx.strokeStyle = `rgba(246,238,222,${0.05 * birth})`;
          for (let lon = 70; lon <= 140; lon += 10) {
            ctx.beginPath();
            let on = false;
            for (let lat = 4; lat <= 56; lat += 2) {
              const P = project(cam, toW([lon, lat]));
              if (P.d < 20) { on = false; continue; }
              on ? ctx.lineTo(P.x, P.y) : ctx.moveTo(P.x, P.y);
              on = true;
            }
            ctx.stroke();
          }
          for (let lat = 10; lat <= 50; lat += 10) {
            ctx.beginPath();
            let on = false;
            for (let lon = 66; lon <= 142; lon += 2) {
              const P = project(cam, toW([lon, lat]));
              if (P.d < 20) { on = false; continue; }
              on ? ctx.lineTo(P.x, P.y) : ctx.moveTo(P.x, P.y);
              on = true;
            }
            ctx.stroke();
          }
          const draw = (pts: V3[], fn: (p: V3, P: ReturnType<typeof project>) => void) => {
            for (const p of pts) {
              const P = project(cam, p);
              if (P.d < 20 || P.x < -30 || P.x > 1110 || P.y < -30 || P.y > 1950) continue;
              fn(p, P);
            }
          };
          draw(LAND, (p, P) => {
            const r = Math.min(10, 4.4 * P.s);
            ctx.fillStyle = `rgba(150,160,180,${0.24 * birth})`;
            ctx.fillRect(P.x - r / 2, P.y - r / 2, r, r);
          });
          draw(CHINA, (p, P) => {
            const near = clamp(1 - Math.hypot(p[0], p[2]) / 700);
            const r = Math.min(16, 6.4 * P.s) * (1 + near * 0.3);
            ctx.fillStyle = `rgba(${236 + 10 * near},${228 - 10 * near},${210 - 60 * near},${(0.62 + 0.35 * near) * birth})`;
            ctx.beginPath();
            ctx.arc(P.x, P.y, r / 2, 0, Math.PI * 2);
            ctx.fill();
          });
          draw(COAST, (p, P) => {
            const r = Math.min(12, 4 * P.s);
            ctx.fillStyle = `rgba(246,238,222,${0.55 * birth})`;
            ctx.fillRect(P.x - r / 2, P.y - r / 2, r, r);
          });
          // Guangzhou pin = the selected node
          ctx.globalCompositeOperation = 'lighter';
          const core = 26 + 260 * handoff * handoff;
          ctx.drawImage(glowSprite(WHITE_RGBA, 0.25), G.x - core, G.y - core, core * 2, core * 2);
          const pr = 46 + 14 * Math.sin(t * 8);
          ctx.drawImage(glowSprite(GOLD_RGBA, 0.15), G.x - pr, G.y - pr, pr * 2, pr * 2);
          ctx.globalAlpha = 0.9;
          ctx.drawImage(glowSprite(RED_RGBA, 0.3), G.x - 7, G.y - 7, 14, 14);
          ctx.globalAlpha = 1;
          ctx.globalCompositeOperation = 'source-over';
          // ground rings around the pin
          for (let k = 0; k < 2; k++) {
            const ph = ((t - NODE_IN) * 0.9 + k / 2) % 1;
            ctx.strokeStyle = `rgba(240,211,138,${0.55 * (1 - ph) * (1 - dive)})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            for (let a = 0; a <= 48; a++) {
              const ang = (a / 48) * Math.PI * 2;
              const P = project(cam, [Math.cos(ang) * ph * 240, 0, Math.sin(ang) * ph * 240]);
              a === 0 ? ctx.moveTo(P.x, P.y) : ctx.lineTo(P.x, P.y);
            }
            ctx.stroke();
          }
          // HUD hairlines through the pin (very subtle)
          if (label > 0) {
            ctx.strokeStyle = `rgba(246,238,222,${0.22 * label})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(G.x + 40, G.y); ctx.lineTo(G.x + 330, G.y);
            ctx.moveTo(G.x, G.y - 40); ctx.lineTo(G.x, G.y - 240);
            ctx.stroke();
          }
        }}
      />
      {label > 0 && (
        <div style={{position: 'absolute', left: G.x + 52, top: G.y - 74, opacity: label}}>
          <Micro text="Guangzhou" color="rgba(246,238,222,0.95)" size={22} />
          <div style={{marginTop: 8, display: 'flex', flexDirection: 'column', gap: 3}}>
            {['23.1291° N', '113.2644° E'].map((s, i) => {
              const n = Math.round(ramp(t, V.gz + 0.08 + i * 0.12, V.gz + 0.4 + i * 0.12) * s.length);
              return (
                <div key={s} style={{fontFamily: "Montserrat, sans-serif", fontSize: 15, fontWeight: 500, letterSpacing: '0.18em', color: 'rgba(240,211,138,0.85)'}}>
                  {s.slice(0, n)}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
