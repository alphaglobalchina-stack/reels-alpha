import React from 'react';
import {AbsoluteFill} from 'remotion';
import land from '../../../content/land-dots.json';
import {C} from '../film/brand';
import {back, clamp, CX, ease, H, lerp, ramp, rnd, W} from '../film/lib';
import {CanvasLayer, glowSprite, GOLD_RGBA, RED_RGBA} from '../film/ui';
import {Extruded, goldLine, Micro} from './kit';
import {SHIP} from './plan';

/**
 * Shipping — the gold line leaves Guangzhou and the camera chases it low over the curve of
 * the Earth; the route turns into a crane cable in a night port; the cable becomes the
 * wake of a container ship; then the vacuum before the hero line.
 */
type LL = [number, number];
const LAND = land as LL[];
const GZ: LL = [113.3, 23.0];
const ROUTE: LL[] = (() => {
  const pts: LL[] = [GZ, [113.6, 22.2], [112.4, 18], [110, 13], [107, 8.5], [105.2, 4.5], [104.3, 1.3], [101.6, 2.4], [98, 5.6], [93, 6.2], [87, 6], [81.5, 5.4], [77.5, 6.4], [72.5, 9], [66.5, 13.5], [61.5, 19], [59, 23.5], [56.6, 26.4], [55.03, 25.0]];
  const out: LL[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const n = Math.ceil(Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]) / 0.6);
    for (let k = 0; k < n; k++) out.push([lerp(pts[i][0], pts[i + 1][0], k / n), lerp(pts[i][1], pts[i + 1][1], k / n)]);
  }
  out.push(pts[pts.length - 1]);
  return out;
})();
const ortho = (lon0: number, lat0: number, R: number, cx: number, cy: number) => {
  const l0 = (lon0 * Math.PI) / 180, p0 = (lat0 * Math.PI) / 180, sp0 = Math.sin(p0), cp0 = Math.cos(p0);
  return ([lon, lat]: LL) => {
    const l = (lon * Math.PI) / 180 - l0, p = (lat * Math.PI) / 180, cp = Math.cos(p), sp = Math.sin(p), cl = Math.cos(l);
    return {x: cx + R * cp * Math.sin(l), y: cy - R * (cp0 * sp - sp0 * cp * cl), z: sp0 * sp + cp0 * cp * cl};
  };
};
const headAt = (k: number): LL => ROUTE[Math.min(ROUTE.length - 1, Math.floor(k * (ROUTE.length - 1)))];

const SHIP_COLS = ['#5f3a30', '#2b3a50', '#7c6230', '#474c54', '#4f2f2b', '#23303e', '#8b6d36', '#3a3f46'];
const drawShip = (ctx: CanvasRenderingContext2D, t: number, cx: number, cy: number, sc: number) => {
  const L = 760 * sc, B = 132 * sc, top = cy - L / 2, bot = cy + L / 2;
  for (let i = 0; i < 240; i++) {
    const u = rnd(i * 1.7), along = u * (H - bot + 240), spread = 0.34 * along + B * 0.45, side = i % 2 ? 1 : -1;
    const x = cx + side * spread * (0.85 + rnd(i) * 0.3) + (rnd(i * 3.1 + Math.floor(t * 20)) - 0.5) * 16 * sc;
    ctx.globalAlpha = 0.4 * (1 - u) * (0.5 + rnd(i * 9) * 0.5);
    ctx.fillStyle = '#e9eef2';
    ctx.fillRect(x, bot + along + ((t * 260 * sc) % 40), (6 + rnd(i * 5) * 16) * sc, 2.2 * sc);
  }
  for (let i = 0; i < 160; i++) {
    const u = rnd(i * 4.3 + 2), along = u * (H - bot + 240);
    ctx.globalAlpha = 0.45 * (1 - u);
    ctx.fillStyle = '#f4f6f7';
    ctx.beginPath();
    ctx.arc(cx + (rnd(i * 7.1 + Math.floor(t * 24)) - 0.5) * (B * 0.32 + along * 0.06), bot + along, (2 + rnd(i) * 5) * sc, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 30 * sc;
  ctx.fillStyle = '#1b1e24';
  ctx.beginPath();
  ctx.moveTo(cx, top);
  ctx.bezierCurveTo(cx + B * 0.55, top + L * 0.06, cx + B / 2, top + L * 0.16, cx + B / 2, top + L * 0.24);
  ctx.lineTo(cx + B / 2, bot - B * 0.25);
  ctx.quadraticCurveTo(cx + B / 2, bot, cx + B * 0.3, bot);
  ctx.lineTo(cx - B * 0.3, bot);
  ctx.quadraticCurveTo(cx - B / 2, bot, cx - B / 2, bot - B * 0.25);
  ctx.lineTo(cx - B / 2, top + L * 0.24);
  ctx.bezierCurveTo(cx - B / 2, top + L * 0.16, cx - B * 0.55, top + L * 0.06, cx, top);
  ctx.fill();
  ctx.restore();
  const cw = (B * 0.84) / 7, ch = 34 * sc;
  let y = top + L * 0.16, bay = 0;
  while (y < bot - L * 0.2) {
    for (let r = 0; r < 2; r++)
      for (let c = 0; c < 7; c++) {
        const s = bay * 31 + r * 7 + c;
        if (rnd(s * 2.3) < 0.05 || (y < top + L * 0.22 && (c === 0 || c === 6))) continue;
        ctx.fillStyle = SHIP_COLS[Math.floor(rnd(s) * SHIP_COLS.length)];
        ctx.fillRect(cx - B * 0.42 + c * cw + 1, y + r * ch + 1, cw - 2, ch - 2);
      }
    y += ch * 2 + 6 * sc;
    bay++;
  }
  ctx.fillStyle = '#d8d4cb';
  ctx.fillRect(cx - B * 0.44, bot - L * 0.17, B * 0.88, 40 * sc);
};

export const ShotShipping: React.FC<{t: number}> = ({t}) => {
  const chase = ramp(t, SHIP.start + 0.05, SHIP.portIn, (x) => 0.08 + 0.92 * ease.inOut(x));
  const toPort = ramp(t, SHIP.portIn - 0.12, SHIP.portIn + 0.22, ease.inOut);
  const toWake = ramp(t, SHIP.wake - 0.1, SHIP.wake + 0.18, ease.inOut);
  const vac = ramp(t, SHIP.end - 0.2, SHIP.end, ease.soft);
  const head = headAt(chase);
  const lon0 = head[0] - 2, lat0 = head[1] - 52;
  const R = 1350;
  const P = ortho(lon0, lat0, R, CX, 1960);
  const hero = ramp(t, SHIP.ship - 0.08, SHIP.ship + 0.4, (x) => back(x, 1.3));
  return (
    <AbsoluteFill style={{background: C.ink, overflow: 'hidden'}}>
      {/* globe, camera low over the surface chasing the route */}
      {toPort < 1 && (
        <AbsoluteFill style={{opacity: 1 - toPort, transform: `scale(${1 + toPort * 0.6})`, transformOrigin: '50% 40%'}}>
          <CanvasLayer
            draw={(ctx) => {
              const sky = ctx.createLinearGradient(0, 0, 0, 900);
              sky.addColorStop(0, '#05070c');
              sky.addColorStop(1, '#0d1626');
              ctx.fillStyle = sky;
              ctx.fillRect(0, 0, W, H);
              // limb glow (horizon)
              const g = ctx.createRadialGradient(CX, 1960, R * 0.96, CX, 1960, R * 1.12);
              g.addColorStop(0, 'rgba(120,150,200,0)');
              g.addColorStop(0.35, 'rgba(150,170,210,0.22)');
              g.addColorStop(0.55, 'rgba(226,182,80,0.10)');
              g.addColorStop(1, 'rgba(0,0,0,0)');
              ctx.fillStyle = g;
              ctx.fillRect(0, 0, W, H);
              ctx.fillStyle = '#080c15';
              ctx.beginPath();
              ctx.arc(CX, 1960, R, 0, Math.PI * 2);
              ctx.fill();
              for (const p of LAND) {
                const q = P(p);
                if (q.z <= 0.01 || q.y < 0 || q.y > H) continue;
                const r = 1.6 + 3.2 * q.z;
                const asia = p[0] > 72 && p[0] < 135 && p[1] > 15 && p[1] < 54;
                ctx.fillStyle = asia ? `rgba(240,232,214,${0.25 + 0.5 * q.z})` : `rgba(160,170,190,${0.12 + 0.35 * q.z})`;
                ctx.fillRect(q.x - r / 2, q.y - r / 2, r, r);
              }
              // the route — gold line from Guangzhou, camera on its head
              const n = Math.max(2, Math.floor(chase * (ROUTE.length - 1)));
              const pts = ROUTE.slice(0, n).map(P).filter((q) => q.z > 0);
              goldLine(ctx, pts, 1, 1, 3.4, true);
              const o = P(GZ);
              if (o.z > 0) {
                ctx.globalCompositeOperation = 'lighter';
                ctx.drawImage(glowSprite(GOLD_RGBA, 0.15), o.x - 30, o.y - 30, 60, 60);
                ctx.drawImage(glowSprite(RED_RGBA, 0.3), o.x - 6, o.y - 6, 12, 12);
                ctx.globalCompositeOperation = 'source-over';
              }
              // faint secondary lanes
              for (let k = 0; k < 3; k++) {
                const lane = ROUTE.slice(0, n).map(([lo, la]) => P([lo + (k - 1) * 3.5 - 2, la + (k - 1) * 2.5] as LL)).filter((q) => q.z > 0);
                ctx.strokeStyle = 'rgba(246,238,222,0.12)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                lane.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)));
                ctx.stroke();
              }
            }}
          />
          {hero > 0 && (
            <div style={{position: 'absolute', left: -200, right: -200, top: 300, display: 'flex', justifyContent: 'center', opacity: clamp(hero * 1.5) * (1 - ramp(t, SHIP.portIn - 0.3, SHIP.portIn)), transform: `scale(${lerp(1.6, 1, hero)})`}}>
              <div style={{filter: 'drop-shadow(0 24px 30px rgba(0,0,0,0.6))'}}>
                <Extruded text="الشحن" size={230} rotX={lerp(30, 14, hero)} rotY={0} depth={0.13} slices={12} sheen={ramp(t, SHIP.ship, SHIP.ship + 1)} />
              </div>
            </div>
          )}
          <div style={{position: 'absolute', left: 84, top: 300, opacity: ramp(t, SHIP.then, SHIP.then + 0.2) * (1 - ramp(t, SHIP.ship - 0.2, SHIP.ship))}}>
            <Micro text="Guangzhou · shipping" />
          </div>
        </AbsoluteFill>
      )}
      {/* night port: the route becomes the crane cable */}
      {toPort > 0 && toWake < 1 && (
        <AbsoluteFill style={{opacity: toPort * (1 - toWake)}}>
          <CanvasLayer
            draw={(ctx) => {
              const k = ramp(t, SHIP.portIn - 0.1, SHIP.wake, ease.inOut); // crane-up
              const sky = ctx.createLinearGradient(0, 0, 0, H);
              sky.addColorStop(0, '#060912');
              sky.addColorStop(0.55, '#101a2c');
              sky.addColorStop(0.6, '#1d2433');
              sky.addColorStop(1, '#05070b');
              ctx.fillStyle = sky;
              ctx.fillRect(0, 0, W, H);
              const hy = 1080 + 260 * k; // horizon rises as the camera cranes up
              // far city glow
              const cg = ctx.createRadialGradient(CX, hy, 10, CX, hy, 700);
              cg.addColorStop(0, 'rgba(255,190,110,0.42)');
              cg.addColorStop(1, 'rgba(255,190,110,0)');
              ctx.fillStyle = cg;
              ctx.fillRect(0, hy - 400, W, 600);
              for (let i = 0; i < 60; i++) {
                const x = rnd(i * 2.3) * W, h = 20 + rnd(i * 4.1) * 90;
                ctx.fillStyle = '#0a0e17';
                ctx.fillRect(x, hy - h, 14 + rnd(i) * 30, h);
                ctx.fillStyle = `rgba(255,214,150,${0.5 * rnd(i * 7)})`;
                ctx.fillRect(x + 4, hy - h + 6, 2, 2);
              }
              // water + reflections
              ctx.fillStyle = '#04060a';
              ctx.fillRect(0, hy, W, H - hy);
              for (let i = 0; i < 90; i++) {
                ctx.fillStyle = `rgba(255,200,130,${0.06 + 0.1 * rnd(i)})`;
                ctx.fillRect(rnd(i * 3.3) * W, hy + 8 + rnd(i * 1.9) * 260, 20 + rnd(i) * 60, 1.5);
              }
              // gantry cranes at three depths (parallax with the crane-up)
              const crane = (x: number, base: number, s: number, al: number) => {
                ctx.strokeStyle = `rgba(14,18,26,${al})`;
                ctx.fillStyle = `rgba(14,18,26,${al})`;
                ctx.lineWidth = 10 * s;
                ctx.beginPath();
                ctx.moveTo(x - 160 * s, base); ctx.lineTo(x - 160 * s, base - 620 * s);
                ctx.moveTo(x + 160 * s, base); ctx.lineTo(x + 160 * s, base - 620 * s);
                ctx.moveTo(x - 200 * s, base - 620 * s); ctx.lineTo(x + 520 * s, base - 620 * s);
                ctx.moveTo(x - 160 * s, base - 300 * s); ctx.lineTo(x + 160 * s, base - 300 * s);
                ctx.moveTo(x - 160 * s, base - 620 * s); ctx.lineTo(x, base - 820 * s); ctx.lineTo(x + 160 * s, base - 620 * s);
                ctx.stroke();
                // warm rim light from the quay floodlights
                ctx.strokeStyle = `rgba(255,206,140,${0.35 * al})`;
                ctx.lineWidth = 1.6;
                ctx.stroke();
                const fl = ctx.createRadialGradient(x + 160 * s, base - 300 * s, 4, x + 160 * s, base - 300 * s, 420 * s);
                fl.addColorStop(0, `rgba(255,214,150,${0.28 * al})`);
                fl.addColorStop(1, 'rgba(255,214,150,0)');
                ctx.fillStyle = fl;
                ctx.fillRect(x - 300 * s, base - 720 * s, 900 * s, 900 * s);
                for (let j = 0; j < 6; j++) {
                  ctx.fillStyle = `rgba(255,226,170,${0.9 * al})`;
                  ctx.fillRect(x - 200 * s + j * 140 * s, base - 628 * s, 4 * s, 4 * s);
                }
              };
              crane(160, hy + 40, 0.5, 0.9);
              crane(820, hy + 60, 0.62, 0.9);
              const nearX = 300, nearBase = hy + 520 + 300 * k, s = 1.05;
              crane(nearX, nearBase, s, 1);
              // container stacks in the foreground
              const cols = ['#3a4350', '#5a3a2e', '#2c4258', '#575043', '#34506e'];
              for (let r = 0; r < 3; r++)
                for (let c = 0; c < 9; c++) {
                  const x = -40 + c * 136, y = H - 140 - r * 92 + 380 * k;
                  ctx.fillStyle = cols[(r * 9 + c * 7) % cols.length];
                  ctx.fillRect(x, y, 130, 86);
                  ctx.fillStyle = 'rgba(255,220,160,0.32)';
                  ctx.fillRect(x, y, 130, 3);
                  for (let q = 0; q < 6; q++) {
                    ctx.fillStyle = 'rgba(0,0,0,0.22)';
                    ctx.fillRect(x + 8 + q * 20, y + 8, 5, 72);
                  }
                }
              // the gold cable lifting a container
              const tx = nearX + 330 * s, ty = nearBase - 620 * s;
              const lift = ramp(t, SHIP.port - 0.1, SHIP.wake, ease.inOut);
              const cy = lerp(nearBase - 120, ty + 260, lift);
              goldLine(ctx, [{x: CX, y: H + 40}, {x: tx, y: Math.min(H, cy + 60)}], toPort > 0.99 ? 0 : 1 - toPort, 1, 3, false);
              goldLine(ctx, [{x: tx, y: ty}, {x: tx, y: cy}], 1, 1, 2.6, false);
              ctx.fillStyle = '#3a2c27';
              ctx.fillRect(tx - 110, cy, 220, 96);
              ctx.strokeStyle = 'rgba(240,211,138,0.55)';
              ctx.lineWidth = 1.5;
              ctx.strokeRect(tx - 110, cy, 220, 96);
              for (let q = 0; q < 10; q++) {
                ctx.fillStyle = 'rgba(0,0,0,0.25)';
                ctx.fillRect(tx - 104 + q * 22, cy + 6, 6, 84);
              }
              // haze
              const hz = ctx.createLinearGradient(0, hy - 300, 0, hy + 200);
              hz.addColorStop(0, 'rgba(180,190,210,0)');
              hz.addColorStop(0.6, 'rgba(180,190,210,0.07)');
              hz.addColorStop(1, 'rgba(180,190,210,0)');
              ctx.fillStyle = hz;
              ctx.fillRect(0, hy - 300, W, 500);
            }}
          />
          <div style={{position: 'absolute', left: 84, top: 300, opacity: ramp(t, SHIP.port - 0.1, SHIP.port + 0.1)}}>
            <Micro text="Your destination port" color="rgba(240,211,138,0.95)" dot />
          </div>
        </AbsoluteFill>
      )}
      {/* the cable becomes the wake of a container ship */}
      {toWake > 0 && (
        <AbsoluteFill style={{opacity: toWake}}>
          <CanvasLayer
            draw={(ctx) => {
              const bg = ctx.createLinearGradient(0, 0, 0, H);
              bg.addColorStop(0, '#07101c');
              bg.addColorStop(1, '#0a1524');
              ctx.fillStyle = bg;
              ctx.fillRect(0, 0, W, H);
              for (let i = 0; i < 380; i++) {
                ctx.globalAlpha = 0.05 + rnd(i) * 0.08;
                ctx.fillStyle = '#9fb3c8';
                ctx.fillRect(rnd(i * 2.1) * W, (rnd(i * 5.3) * H + t * 360) % H, 10 + rnd(i * 3) * 40, 1.5);
              }
              ctx.globalAlpha = 1;
              const sc = lerp(1.2, 0.95, ramp(t, SHIP.wake, SHIP.end, ease.out));
              const shipY = 720 - (t - SHIP.wake) * 60;
              drawShip(ctx, t, CX, shipY, sc);
              goldLine(ctx, [{x: CX, y: shipY + 380 * sc}, {x: CX, y: H + 20}], 1, 1, 3, false);
              const v = ctx.createRadialGradient(CX, 860, 200, CX, 960, 1100);
              v.addColorStop(0, 'rgba(0,0,0,0)');
              v.addColorStop(1, 'rgba(0,0,0,0.7)');
              ctx.fillStyle = v;
              ctx.fillRect(0, 0, W, H);
            }}
          />
        </AbsoluteFill>
      )}
      {vac > 0 && <AbsoluteFill style={{background: C.ink, opacity: vac}} />}
    </AbsoluteFill>
  );
};
