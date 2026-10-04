import React from 'react';
import {AbsoluteFill} from 'remotion';
import land from '../../../../content/land-dots.json';
import {C} from '../brand';
import {clamp, ease, H, lerp, ramp, rnd, W} from '../lib';
import {Ar, At, CanvasLayer, glowSprite, GOLD_RGBA, La, Reveal, WHITE_RGBA} from '../ui';
import {at} from '../timing';
import {S7} from './S7Range';

/** Scene 8 — shipping: dotted globe, Guangzhou origin, gold sea route → destination port → ship wake. */
const T_THEN = at('ثم');
const T_SHIP = at('الشحن', 1, 35);
const T_PORT = at('ميناء');
const T_DEST = at('وجهتك');
const T_VOID = at('لا', 1, 38);

export const S8 = {start: S7.end - 0.45, end: T_VOID - 0.02};

type LL = [number, number];
const GZ: LL = [113.3, 23.0];
const densify = (pts: LL[], step = 0.8): LL[] => {
  const out: LL[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [a, b] = [pts[i], pts[i + 1]];
    const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
    for (let k = 0; k < n; k++) out.push([lerp(a[0], b[0], k / n), lerp(a[1], b[1], k / n)]);
  }
  out.push(pts[pts.length - 1]);
  return out;
};
const TRUNK: LL[] = [GZ, [113.6, 22.2], [112.4, 18], [110, 13], [107, 8.5], [105.2, 4.5], [104.3, 1.3], [101.6, 2.4], [98, 5.6], [93, 6.2], [87, 6], [81.5, 5.4], [77.5, 6.4], [72.5, 9]];
const ROUTES: {pts: LL[]; hero?: boolean}[] = [
  {pts: densify([...TRUNK, [66.5, 13.5], [61.5, 19], [59, 23.5], [56.6, 26.4], [55.03, 25.0]]), hero: true},
  {pts: densify([...TRUNK, [60, 12], [51, 12.4], [45, 12.3], [43.3, 12.8], [41.5, 16], [39.1, 21.45]])},
  {pts: densify([...TRUNK, [60, 12], [51, 12.4], [43.3, 12.8], [38.5, 19], [34.6, 27.4], [32.5, 29.9], [32.3, 31.4], [28, 33.2], [18, 34.4], [8, 37.6]])},
  {pts: densify([...TRUNK, [60, 5], [48, -1], [39.7, -4.05]])},
];
const LAND = land as LL[];

const R0 = 470;
const ortho = (lon0: number, lat0: number, R: number, cx: number, cy: number) => {
  const l0 = (lon0 * Math.PI) / 180, p0 = (lat0 * Math.PI) / 180;
  const sp0 = Math.sin(p0), cp0 = Math.cos(p0);
  return ([lon, lat]: LL) => {
    const l = (lon * Math.PI) / 180 - l0, p = (lat * Math.PI) / 180;
    const cp = Math.cos(p), sp = Math.sin(p), cl = Math.cos(l);
    const z = sp0 * sp + cp0 * cp * cl;
    return {x: cx + R * cp * Math.sin(l), y: cy - R * (cp0 * sp - sp0 * cp * cl), z};
  };
};

const SHIP_COLS = ['#6f3a2e', '#2b3a50', '#8a6a2c', '#474c54', '#5a2f2b', '#23303e', '#9b7835', '#3a3f46'];

const drawShip = (ctx: CanvasRenderingContext2D, t: number, cx: number, cy: number, sc: number) => {
  const L = 760 * sc, B = 128 * sc;
  const top = cy - L / 2, bot = cy + L / 2;
  // wake (behind = below)
  ctx.save();
  for (let i = 0; i < 260; i++) {
    const u = rnd(i * 1.7);
    const along = u * (H - bot + 200);
    const spread = 0.34 * along + B * 0.45;
    const side = i % 2 ? 1 : -1;
    const jit = (rnd(i * 3.1 + Math.floor(t * 20)) - 0.5) * 18 * sc;
    const x = cx + side * spread * (0.85 + rnd(i) * 0.3) + jit;
    const y = bot + along + ((t * 260 * sc) % 40);
    ctx.globalAlpha = 0.45 * (1 - u) * (0.5 + rnd(i * 9) * 0.5);
    ctx.fillStyle = '#e9eef2';
    ctx.fillRect(x, y, (6 + rnd(i * 5) * 16) * sc, 2.2 * sc);
  }
  // turbulent centre trail
  for (let i = 0; i < 180; i++) {
    const u = rnd(i * 4.3 + 2);
    const along = u * (H - bot + 200);
    const w = B * 0.32 + along * 0.06;
    const x = cx + (rnd(i * 7.1 + Math.floor(t * 24)) - 0.5) * w;
    const y = bot + along;
    ctx.globalAlpha = 0.5 * (1 - u);
    ctx.fillStyle = '#f4f6f7';
    ctx.beginPath();
    ctx.arc(x, y, (2 + rnd(i) * 5) * sc, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  // hull
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 30 * sc;
  ctx.shadowOffsetX = 14 * sc;
  ctx.fillStyle = '#1d2026';
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
  ctx.strokeStyle = 'rgba(201,151,28,0.55)';
  ctx.lineWidth = 1.5 * sc;
  ctx.stroke();
  // containers
  const cw = (B * 0.84) / 7, ch = 34 * sc;
  let y = top + L * 0.16;
  let bay = 0;
  while (y < bot - L * 0.2) {
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 7; c++) {
        const s = bay * 31 + r * 7 + c;
        if (rnd(s * 2.3) < 0.05) continue;
        const narrow = y < top + L * 0.22 && (c === 0 || c === 6);
        if (narrow) continue;
        ctx.fillStyle = SHIP_COLS[Math.floor(rnd(s) * SHIP_COLS.length)];
        ctx.fillRect(cx - B * 0.42 + c * cw + 1, y + r * ch + 1, cw - 2, ch - 2);
      }
    }
    y += ch * 2 + 6 * sc;
    bay++;
  }
  // bridge
  ctx.fillStyle = '#d8d4cb';
  ctx.fillRect(cx - B * 0.44, bot - L * 0.17, B * 0.88, 40 * sc);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(cx - B * 0.44, bot - L * 0.17 + 30 * sc, B * 0.88, 10 * sc);
};

export const Scene8: React.FC<{t: number}> = ({t}) => {
  const rise = ramp(t, S8.start, T_THEN + 0.55, ease.out);
  const draw = ramp(t, T_SHIP - 0.1, T_PORT, ease.inOut);
  const pin = ramp(t, T_PORT - 0.05, T_PORT + 0.45, ease.out);
  const dive = ramp(t, T_PORT + 0.3, T_PORT + 0.75, ease.in);
  const sea = ramp(t, T_PORT + 0.55, T_PORT + 0.8, ease.soft);
  const voidP = ramp(t, S8.end - 0.16, S8.end, ease.soft);
  const lon0 = lerp(104, 82, ramp(t, S8.start, S8.end, ease.inOut));
  const cy = lerp(H + R0 + 120, 1010, rise);

  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse 80% 55% at 50% 52%, #0f1626 0%, ${C.navy} 50%, ${C.ink} 100%)`, overflow: 'hidden'}}>
      {sea < 1 && (
        <AbsoluteFill style={{opacity: 1 - sea}}>
          <CanvasLayer
            draw={(ctx) => {
              // dive toward the destination: zoom around the hero route head
              const hero = ROUTES[0].pts;
              const pre = ortho(lon0, 16, R0, 540, cy);
              const dst = pre(hero[hero.length - 1]);
              const z = 1 + dive * dive * 7;
              ctx.translate(dst.x, dst.y);
              ctx.scale(z, z);
              ctx.translate(-dst.x, -dst.y);
              const P = pre;
              // atmosphere
              const g = ctx.createRadialGradient(540, cy, R0 * 0.9, 540, cy, R0 * 1.18);
              g.addColorStop(0, 'rgba(201,151,28,0)');
              g.addColorStop(0.45, 'rgba(201,151,28,0.18)');
              g.addColorStop(1, 'rgba(201,151,28,0)');
              ctx.fillStyle = g;
              ctx.beginPath();
              ctx.arc(540, cy, R0 * 1.18, 0, Math.PI * 2);
              ctx.fill();
              const body = ctx.createRadialGradient(540 - R0 * 0.3, cy - R0 * 0.35, 10, 540, cy, R0);
              body.addColorStop(0, '#18202f');
              body.addColorStop(1, '#090c13');
              ctx.fillStyle = body;
              ctx.beginPath();
              ctx.arc(540, cy, R0, 0, Math.PI * 2);
              ctx.fill();
              ctx.strokeStyle = 'rgba(233,207,143,0.25)';
              ctx.lineWidth = 1.2;
              ctx.stroke();
              // land dots
              for (const p of LAND) {
                const q = P(p);
                if (q.z <= 0.02) continue;
                const isAsia = p[0] > 72 && p[0] < 135 && p[1] > 15 && p[1] < 54;
                ctx.fillStyle = isAsia ? `rgba(226,186,96,${0.25 + 0.55 * q.z})` : `rgba(170,178,195,${0.12 + 0.35 * q.z})`;
                const r = 2.3 + 1.6 * q.z;
                ctx.fillRect(q.x - r / 2, q.y - r / 2, r, r);
              }
              // routes
              ROUTES.forEach((rt, k) => {
                const d = k === 0 ? draw : ramp(t, T_SHIP + 0.15 + k * 0.1, T_PORT + 0.3 + k * 0.1, ease.inOut);
                const n = Math.floor(rt.pts.length * d);
                if (n < 2) return;
                ctx.lineWidth = k === 0 ? 4 : 2;
                ctx.strokeStyle = k === 0 ? 'rgba(240,211,138,0.95)' : 'rgba(214,170,74,0.38)';
                ctx.beginPath();
                rt.pts.slice(0, n).forEach((p, i) => {
                  const q = P(p);
                  i === 0 ? ctx.moveTo(q.x, q.y) : ctx.lineTo(q.x, q.y);
                });
                ctx.stroke();
                if (k === 0 && d < 1) {
                  const h = P(rt.pts[n - 1]);
                  ctx.globalCompositeOperation = 'lighter';
                  ctx.drawImage(glowSprite(WHITE_RGBA, 0.2), h.x - 30, h.y - 30, 60, 60);
                  ctx.globalCompositeOperation = 'source-over';
                }
              });
              // origin + destination
              ctx.globalCompositeOperation = 'lighter';
              const o = P(GZ);
              const pulse = 0.5 + 0.5 * Math.sin(t * 6);
              ctx.drawImage(glowSprite(GOLD_RGBA, 0.15), o.x - 40 - pulse * 8, o.y - 40 - pulse * 8, 80 + pulse * 16, 80 + pulse * 16);
              if (pin > 0) {
                ctx.globalAlpha = pin;
                ctx.drawImage(glowSprite(WHITE_RGBA, 0.2), dst.x - 36, dst.y - 36, 72, 72);
                ctx.globalAlpha = 1;
              }
              ctx.globalCompositeOperation = 'source-over';
              if (pin > 0) {
                for (let k = 0; k < 2; k++) {
                  const ph = ((t - T_PORT) * 0.9 + k / 2) % 1;
                  ctx.strokeStyle = `rgba(240,211,138,${0.8 * (1 - ph) * pin})`;
                  ctx.lineWidth = 2;
                  ctx.beginPath();
                  ctx.arc(dst.x, dst.y, 10 + ph * 60, 0, Math.PI * 2);
                  ctx.stroke();
                }
              }
            }}
          />
          {/* origin / destination labels */}
          {(() => {
            const P = ortho(lon0, 16, R0, 540, cy);
            const o = P(GZ);
            const d = P(ROUTES[0].pts[ROUTES[0].pts.length - 1]);
            const fadeD = 1 - dive * 2;
            return (
              <>
                <div style={{position: 'absolute', left: o.x + 26, top: o.y - 14, opacity: rise * (1 - dive * 2)}}>
                  <La size={16} track={0.3} color={C.white} weight={700}>
                    Guangzhou
                  </La>
                </div>
                {pin > 0 && (
                  <div style={{position: 'absolute', left: d.x, top: d.y - 150, transform: 'translateX(-50%)', opacity: pin * clamp(fadeD), display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                    <Ar size={52} weight={800} color={C.white} lh={1.25}>
                      ميناء وِجهَتك
                    </Ar>
                    <La size={15} track={0.34} color={C.goldLight}>
                      Your destination port
                    </La>
                    <div style={{width: 1.5, height: 40 * pin, background: C.goldLight, marginTop: 8}} />
                  </div>
                )}
              </>
            );
          })()}
        </AbsoluteFill>
      )}
      {/* sea level: the route becomes a ship's wake */}
      {sea > 0 && (
        <AbsoluteFill style={{opacity: sea}}>
          <CanvasLayer
            draw={(ctx) => {
              const bg = ctx.createLinearGradient(0, 0, 0, H);
              bg.addColorStop(0, '#08101c');
              bg.addColorStop(1, '#0b1626');
              ctx.fillStyle = bg;
              ctx.fillRect(0, 0, W, H);
              // water texture drifting past
              for (let i = 0; i < 420; i++) {
                const x = rnd(i * 2.1) * W;
                const y = (rnd(i * 5.3) * H + t * 340) % H;
                ctx.globalAlpha = 0.05 + rnd(i) * 0.08;
                ctx.fillStyle = '#9fb3c8';
                ctx.fillRect(x, y, 10 + rnd(i * 3) * 40, 1.5);
              }
              ctx.globalAlpha = 1;
              const sc = 1.15 - 0.15 * ramp(t, T_PORT + 0.55, S8.end, ease.out);
              const shipY = 780 - (t - T_PORT) * 60;
              // gold route = wake centre line
              const g = ctx.createLinearGradient(0, shipY + 380 * sc, 0, H);
              g.addColorStop(0, 'rgba(240,211,138,0.95)');
              g.addColorStop(1, 'rgba(240,211,138,0.25)');
              drawShip(ctx, t, 540, shipY, sc);
              ctx.strokeStyle = g;
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.moveTo(540, shipY + 380 * sc);
              ctx.lineTo(540, H);
              ctx.stroke();
              ctx.globalCompositeOperation = 'lighter';
              ctx.globalAlpha = 0.55;
              ctx.drawImage(glowSprite(GOLD_RGBA, 0.1), 540 - 60, shipY + 380 * sc - 20, 120, 900);
              ctx.globalAlpha = 1;
              ctx.globalCompositeOperation = 'source-over';
              // grade
              const v = ctx.createRadialGradient(540, 860, 200, 540, 960, 1100);
              v.addColorStop(0, 'rgba(0,0,0,0)');
              v.addColorStop(1, 'rgba(0,0,0,0.7)');
              ctx.fillStyle = v;
              ctx.fillRect(0, 0, W, H);
            }}
          />
        </AbsoluteFill>
      )}
      {/* type */}
      <At y={330} style={{zIndex: 300000}}>
        <Reveal t={t} at={T_SHIP - 0.04} dur={0.5} blur={16} out={T_PORT + 0.4} outDur={0.3}>
          <Ar size={150} weight={800} gold shimmer={ramp(t, T_SHIP, T_SHIP + 1.2, ease.inOut)} lh={1.15}>
            الشحن
          </Ar>
          <La size={20} track={0.5} color={C.mist} style={{marginTop: 4}}>
            From China to your port
          </La>
        </Reveal>
      </At>
      {voidP > 0 && <AbsoluteFill style={{background: C.ink, opacity: voidP, zIndex: 600000}} />}
    </AbsoluteFill>
  );
};
