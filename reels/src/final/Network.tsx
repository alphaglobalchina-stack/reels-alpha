import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {C, FONT, IMG} from '../film/brand';
import {back, Cam, clamp, CX, CY, ease, lerp, mix3, nearFade, project, ramp, rnd, V3} from '../film/lib';
import {CanvasLayer, glowSprite, GOLD_RGBA, RED_RGBA} from '../film/ui';
import {cover} from './Market';
import {goldLine, IVORY_RGBA, Micro, recoil} from './kit';
import {HALL, NET} from './plan';

/**
 * Shot 5 — the hall aisle becomes the sourcing network: the hall image itself breaks into
 * tiles that fly out around the camera and turn into supplier cards. SEARCH → VERIFY →
 * COMPARE → (hold) → SELECT: rejected cards fly into depth, links disconnect, one card
 * comes to the lens — and the camera goes through it.
 */
const L = 'film/layers/';
const HALL0: Cam = {pos: [0, 0, 0]};
const HALL_LAYERS = [
  {src: 'hall_far.webp', z: 2600},
  {src: 'hall_mid.webp', z: 1850},
  {src: 'hall_near.webp', z: 1150},
];
const ASPECT = 941 / 1672;
const FAR = cover(HALL0, 2600, ASPECT);
const COLS = 5, ROWS = 9;
const TW = FAR.w / COLS, TH = FAR.h / ROWS;
const NT = COLS * ROWS;
const PICK = 22; // centre tile (booths in the aisle)
const SHORT = [PICK, 16, 28];

export const hallCam = (t: number): Cam => {
  const a = ramp(t, HALL.start, HALL.hold[0], (x) => 1 - Math.pow(1 - x, 2.4));
  const h = ramp(t, HALL.hold[0], HALL.hold[1], ease.linear);
  const net = ramp(t, NET.burst, NET.hold[0], ease.inOut);
  const hold = ramp(t, NET.hold[0], NET.hold[1], ease.soft);
  const sel = ramp(t, NET.select, NET.through[0], ease.out);
  const thr = ramp(t, NET.through[0], NET.through[1], (x) => x * x * x);
  const z = -1100 + 1250 * a + 40 * h + 420 * net - 30 * hold + recoil(t, NET.select, 80);
  const pick = pickPos(t);
  const base: V3 = [lerp(120, -30, a) + 60 * Math.sin(net * Math.PI), lerp(30, 0, a), z];
  const into: V3 = [pick[0], pick[1], pick[2] - 50];
  return {pos: mix3(base, into, thr), yaw: (lerp(-0.05, 0.03, a) + lerp(0, -0.32, net) + 0.04 * Math.sin(t * 0.8)) * (1 - sel * 0.85), pitch: lerp(0, 0.05, net) * (1 - sel), roll: lerp(-0.05, 0.01, a) + 0.03 * Math.sin(net * Math.PI)};
};

// camera position the network is built around (frozen at the burst so cards stay put)
const P0: V3 = [-30, 0, -1100 + 1250 + 40];
const tileHome = (i: number): V3 => {
  const c = i % COLS, r = Math.floor(i / COLS);
  return [FAR.p[0] - FAR.w / 2 + (c + 0.5) * TW, FAR.p[1] - FAR.h / 2 + (r + 0.5) * TH, FAR.p[2]];
};
const cardHome = (i: number): V3 => {
  if (i === PICK) return [P0[0] + 230, P0[1] + 60, P0[2] + 1500];
  if (i === 16) return [P0[0] - 520, P0[1] - 260, P0[2] + 1800];
  if (i === 28) return [P0[0] + 560, P0[1] - 380, P0[2] + 2000];
  const a = (rnd(i * 2.71) - 0.5) * 2.7, e = (rnd(i * 5.13) - 0.5) * 1.5, r = 1300 + rnd(i * 7.9) * 1500;
  return [P0[0] + Math.sin(a) * Math.cos(e) * r, P0[1] + Math.sin(e) * r * 0.9, P0[2] + Math.cos(a) * Math.cos(e) * r];
};
const flyT = (i: number) => {
  const c = i % COLS - 2, r = Math.floor(i / COLS) - 4;
  return NET.burst + 0.03 * Math.hypot(c, r) + rnd(i * 3.3) * 0.06;
};
const cardPos = (i: number, t: number): V3 => {
  const f = ramp(t, flyT(i), flyT(i) + 0.42, (x) => 1 - Math.pow(1 - x, 2.6));
  const h = tileHome(i), c = cardHome(i);
  const arc: V3 = [(h[0] - CX) * 0.0 + (rnd(i) - 0.5) * 900 * Math.sin(Math.PI * f), -380 * Math.sin(Math.PI * f) * (rnd(i * 4) - 0.3), 0];
  let p: V3 = [lerp(h[0], c[0], f) + arc[0], lerp(h[1], c[1], f) + arc[1], lerp(h[2], c[2], f)];
  const k = SHORT.indexOf(i);
  const cmp = ramp(t, NET.compare, NET.compare + 0.3, ease.inOut);
  if (k >= 0) p = mix3(p, [P0[0] + (k === 0 ? 0 : k === 1 ? -390 : 390), P0[1] + 70, P0[2] + (k === 0 ? 1180 : 1320)], cmp);
  const away = ramp(t, NET.select - 0.02, NET.select + 0.45, (x) => x * x);
  if (i !== PICK) p = [p[0] + (p[0] - P0[0]) * away * 1.6, p[1] + (p[1] - P0[1]) * away * 1.6, p[2] + away * 3400];
  return p;
};
export const pickPos = (t: number): V3 => {
  const base = cardPos(PICK, Math.min(t, NET.select));
  const sel = ramp(t, NET.select, NET.select + 0.3, (x) => back(x, 1.3));
  return mix3(base, [P0[0], P0[1] + 40, P0[2] + 900], sel);
};

const THUMBS = [IMG.cnc, IMG.line, IMG.pack, IMG.factory, IMG.insp, IMG.ware, IMG.cmp, IMG.inspWare, 'film/fair_booth.webp'];
const VER = new Set(Array.from({length: NT}, (_, i) => i).filter((i) => SHORT.includes(i) || rnd(i * 13.3) > 0.55));
const NN = 150;
const NODE: V3[] = Array.from({length: NN}, (_, i) => {
  const a = (rnd(i * 3.9) - 0.5) * 3.2, e = (rnd(i * 6.1) - 0.5) * 1.8, r = 900 + rnd(i * 1.3) * 3000;
  return [P0[0] + Math.sin(a) * Math.cos(e) * r, P0[1] + Math.sin(e) * r, P0[2] + Math.cos(a) * Math.cos(e) * r];
});
// each card links to its 2 nearest nodes
const CLINK = Array.from({length: NT}, (_, i) => {
  const c = cardHome(i);
  return NODE.map((n, j) => [j, Math.hypot(n[0] - c[0], n[1] - c[1], n[2] - c[2])] as [number, number]).sort((a, b) => a[1] - b[1]).slice(0, 2).map((x) => x[0]);
});

const STEPS: [string, number][] = [
  ['Search', NET.search],
  ['Verify', NET.verify],
  ['Compare', NET.compare],
  ['Select', NET.select],
];

const Tile: React.FC<{i: number; t: number}> = ({i, t}) => {
  const w = lerp(TW, 250, ramp(t, flyT(i), flyT(i) + 0.42, ease.inOut));
  const h = lerp(TH, 330, ramp(t, flyT(i), flyT(i) + 0.42, ease.inOut));
  const c = i % COLS, r = Math.floor(i / COLS);
  const face = ramp(t, flyT(i) + 0.12, flyT(i) + 0.4);
  const scanned = ramp(t, NET.search + 0.03 * (i % 9), NET.search + 0.2 + 0.03 * (i % 9));
  const ver = VER.has(i) ? ramp(t, NET.verify + rnd(i) * 0.2, NET.verify + 0.12 + rnd(i) * 0.2) : 0;
  const isPick = i === PICK;
  const sel = isPick ? ramp(t, NET.select, NET.select + 0.25) : 0;
  const cmp = SHORT.includes(i) ? ramp(t, NET.compare + 0.15, NET.compare + 0.45) : 0;
  const border = isPick && sel > 0 ? `rgba(240,211,138,${0.6 + 0.4 * sel})` : ver > 0 ? `rgba(240,211,138,${0.25 + 0.35 * ver})` : `rgba(246,238,222,${0.12 + 0.35 * scanned * (1 - ramp(t, NET.verify, NET.verify + 0.2))})`;
  return (
    <div style={{width: w, height: h, position: 'relative', borderRadius: 16 * face, overflow: 'hidden', border: face > 0.05 ? `${isPick && sel > 0 ? 3 : 1.5}px solid ${border}` : undefined, boxShadow: isPick && sel > 0 ? `0 0 ${80 * sel}px rgba(226,182,80,${0.55 * sel})` : face > 0.3 ? '0 24px 50px rgba(0,0,0,0.5)' : undefined, background: '#0d0e11'}}>
      {/* the hall fragment it came from */}
      {face < 1 && <div style={{position: 'absolute', inset: 0, backgroundImage: `url(${staticFile(L + 'hall_far.webp')})`, backgroundSize: `${FAR.w}px ${FAR.h}px`, backgroundPosition: `${-c * TW}px ${-r * TH}px`, opacity: 1 - face, filter: 'saturate(0.7) brightness(0.85)', transform: `scale(${w / TW}, ${h / TH})`, transformOrigin: '0 0', width: TW, height: TH}} />}
      {face > 0 && (
        <div style={{position: 'absolute', inset: 0, opacity: face}}>
          <Img src={staticFile(THUMBS[i % THUMBS.length])} style={{width: '100%', height: '60%', objectFit: 'cover', objectPosition: `${30 + rnd(i) * 40}% 50%`, filter: 'saturate(0.7) brightness(0.88)'}} />
          <div style={{padding: '12px 14px'}}>
            <div style={{fontFamily: FONT.la, fontSize: 11, letterSpacing: '0.3em', fontWeight: 700, color: 'rgba(246,238,222,0.7)'}}>{`SUPPLIER ${String(i + 1).padStart(2, '0')}`}</div>
            {[0.86, 0.58].map((ww, k) => (
              <div key={k} style={{height: 6, width: `${ww * 100}%`, borderRadius: 3, background: 'rgba(246,238,222,0.12)', marginTop: 10}} />
            ))}
            {cmp > 0 && (
              <div style={{display: 'flex', gap: 5, alignItems: 'flex-end', height: 34, marginTop: 10, opacity: cmp}}>
                {[0.5, 0.8, 0.65, 0.9].map((v, k) => (
                  <div key={k} style={{width: 18, height: 34 * v * (isPick ? 1 : 0.55 + 0.4 * rnd(i * 5 + k)) * cmp, background: isPick ? C.gold : 'rgba(246,238,222,0.35)', borderRadius: 2}} />
                ))}
              </div>
            )}
          </div>
          {ver > 0 && (
            <div style={{position: 'absolute', right: 10, top: 10, width: 34, height: 34, borderRadius: 17, background: 'rgba(8,8,10,0.82)', border: `1.5px solid ${C.gold}`, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: ver, transform: `scale(${0.6 + 0.4 * ver})`}}>
              <svg width={18} height={18} viewBox="0 0 24 24">
                <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke={C.goldLight} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
          {isPick && sel > 0 && (
            <>
              <div style={{position: 'absolute', left: 12, top: 14, width: 8, height: 8, borderRadius: 4, background: C.red, boxShadow: '0 0 8px rgba(232,64,47,0.9)', opacity: sel}} />
              <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 46, background: `linear-gradient(90deg, ${C.goldDark}, ${C.gold})`, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: sel}}>
                <div style={{fontFamily: FONT.la, fontSize: 15, letterSpacing: '0.4em', fontWeight: 800, color: '#0b0b0c'}}>BEST FIT</div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export const ShotHallNet: React.FC<{t: number}> = ({t}) => {
  const cam = hallCam(t);
  const sel = ramp(t, NET.select, NET.select + 0.25);
  const thr = ramp(t, NET.through[0], NET.through[1], ease.in);
  const pk = project(cam, pickPos(t));
  const scan = ramp(t, NET.search, NET.verify, ease.inOut);
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse 85% 60% at 50% 50%, #121827 0%, ${C.ink} 78%)`, overflow: 'hidden', isolation: 'isolate'}}>
      {/* hall depth layers (the far one is replaced by its own tiles at the burst) */}
      {HALL_LAYERS.map((l, i) => {
        if (i === 0 && t >= NET.burst) return null;
        const c = cover(HALL0, l.z, ASPECT);
        const pr = project(cam, c.p);
        if (pr.d < 30) return null;
        const o = nearFade(pr.d, 40, 260) * (i === 0 ? 1 : 1 - ramp(t, NET.burst + 0.05, NET.burst + 0.4));
        if (o <= 0.01) return null;
        return (
          <div key={l.src} style={{position: 'absolute', left: 0, top: 0, width: c.w, height: c.h, transform: `translate(${pr.x - c.w / 2}px, ${pr.y - c.h / 2}px) scale(${pr.s})`, zIndex: Math.round(100000 - pr.d), opacity: o}}>
            <Img src={staticFile(L + l.src)} style={{width: c.w, height: c.h, display: 'block', filter: 'saturate(0.68) contrast(1.08) brightness(0.82) sepia(0.05)'}} />
          </div>
        );
      })}
      {/* links + nodes (canvas) */}
      {t >= NET.burst && (
        <div style={{position: 'absolute', inset: 0, zIndex: 1}}>
          <CanvasLayer
            draw={(ctx) => {
              const P = NODE.map((n) => project(cam, n));
              const cut = ramp(t, NET.select - 0.02, NET.select + 0.2);
              ctx.lineWidth = 1;
              for (let i = 0; i < NT; i++) {
                const g = ramp(t, flyT(i) + 0.3, flyT(i) + 0.6);
                if (g <= 0) continue;
                const cp = project(cam, cardPos(i, t));
                if (cp.d < 40) continue;
                const keep = i === PICK ? 1 : 1 - cut;
                for (const j of CLINK[i]) {
                  const q = P[j];
                  if (q.d < 40) continue;
                  const al = (i === PICK ? 0.5 * sel + 0.18 : 0.16) * g * keep;
                  if (al < 0.01) continue;
                  ctx.strokeStyle = i === PICK && sel > 0 ? `rgba(240,211,138,${al})` : `rgba(246,238,222,${al})`;
                  ctx.beginPath();
                  ctx.moveTo(cp.x, cp.y);
                  ctx.lineTo(cp.x + (q.x - cp.x) * g * (1 - cut * 0.6 * (i === PICK ? 0 : 1)), cp.y + (q.y - cp.y) * g * (1 - cut * 0.6 * (i === PICK ? 0 : 1)));
                  ctx.stroke();
                }
              }
              ctx.globalCompositeOperation = 'lighter';
              const iv = glowSprite(IVORY_RGBA, 0.2);
              P.forEach((p, i) => {
                if (p.d < 40) return;
                const born = NET.burst + 0.15 + rnd(i * 4.4) * 0.45;
                if (t < born) return;
                const r = 6 * Math.max(0.4, p.s * 1.3) * (t - born < 0.12 ? 1.8 : 1);
                ctx.globalAlpha = clamp((0.45 + 0.4 * Math.sin(t * 6 + i)) * (1 - 0.75 * cut));
                ctx.drawImage(iv, p.x - r * 2, p.y - r * 2, r * 4, r * 4);
              });
              // signature line: threads the shortlist, then commits to the chosen supplier
              if (t > NET.compare) {
                const sp = SHORT.map((i) => project(cam, cardPos(i, Math.min(t, NET.select))));
                const pts = [{x: -40, y: 1250}, sp[1], sp[2], {x: pk.x, y: pk.y}];
                ctx.globalAlpha = 1;
                ctx.globalCompositeOperation = 'source-over';
                goldLine(ctx, pts, ramp(t, NET.compare, NET.select, ease.inOut), 1 - ramp(t, NET.select + 0.2, NET.select + 0.5), 2.2);
                ctx.globalCompositeOperation = 'lighter';
              }
              // SEARCH: a scan wave travelling through the network
              if (scan > 0 && scan < 1) {
                const R = scan * 1400;
                ctx.globalAlpha = 0.55 * (1 - scan);
                ctx.strokeStyle = 'rgba(246,238,222,0.9)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.ellipse(CX, CY, R, R * 0.62, 0, 0, Math.PI * 2);
                ctx.stroke();
              }
              // SELECT: gold pulse + orbit traces around the chosen card + particle release
              if (sel > 0) {
                ctx.globalAlpha = 1;
                for (let k = 0; k < 3; k++) {
                  ctx.save();
                  ctx.translate(pk.x, pk.y);
                  ctx.rotate(-0.3 + k * 0.3);
                  ctx.strokeStyle = `rgba(240,211,138,${0.5 * sel * (1 - thr)})`;
                  ctx.lineWidth = 1.6;
                  const a0 = t * (k % 2 ? -2.2 : 2.6);
                  ctx.beginPath();
                  ctx.ellipse(0, 0, (300 + k * 70) * sel * pk.s * 1.4, (90 + k * 26) * sel * pk.s * 1.4, 0, a0, a0 + Math.PI * 1.2);
                  ctx.stroke();
                  ctx.restore();
                }
                const pulse = ramp(t, NET.select, NET.select + 0.5);
                ctx.strokeStyle = `rgba(240,211,138,${0.7 * (1 - pulse)})`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(pk.x, pk.y, 120 + pulse * 700, 0, Math.PI * 2);
                ctx.stroke();
                const gs = glowSprite(GOLD_RGBA, 0.18);
                const k = t - NET.select;
                for (let i = 0; i < 44; i++) {
                  const a = rnd(i * 2.3) * Math.PI * 2, sp = 300 + rnd(i * 7) * 700;
                  const dd = sp * (1 - Math.exp(-k * 3));
                  ctx.globalAlpha = clamp(1 - k * 1.4) * 0.8;
                  const r = 3 + rnd(i) * 5;
                  ctx.drawImage(gs, pk.x + Math.cos(a) * dd - r, pk.y + Math.sin(a) * dd - r, r * 2, r * 2);
                }
              }
              ctx.globalAlpha = 1;
              ctx.globalCompositeOperation = 'source-over';
            }}
          />
        </div>
      )}
      {/* tiles → supplier cards */}
      {t >= NET.burst - 0.001 &&
        Array.from({length: NT}, (_, i) => {
          const p = cardPos(i, t);
          const pr = project(cam, p);
          if (pr.d < 30) return null;
          const f = ramp(t, flyT(i), flyT(i) + 0.42);
          const w = lerp(TW, 250, ramp(t, flyT(i), flyT(i) + 0.42, ease.inOut));
          const h = lerp(TH, 330, ramp(t, flyT(i), flyT(i) + 0.42, ease.inOut));
          const isPick = i === PICK;
          const dimV = VER.has(i) ? 0 : 0.6 * ramp(t, NET.verify + 0.1, NET.verify + 0.3);
          const dimC = SHORT.includes(i) ? 0 : 0.5 * ramp(t, NET.compare, NET.compare + 0.3);
          const o = nearFade(pr.d, 40, isPick ? 120 : 260) * (1 - dimV) * (1 - dimC) * (isPick ? 1 : 1 - ramp(t, NET.select + 0.1, NET.select + 0.45));
          if (o < 0.01) return null;
          const rotY = isPick ? lerp((rnd(i) - 0.5) * 50 * f, 0, ramp(t, NET.compare, NET.select + 0.2, ease.inOut)) : (rnd(i) - 0.5) * 50 * f;
          return (
            <div key={i} style={{position: 'absolute', left: 0, top: 0, width: w, height: h, transform: `translate(${pr.x - w / 2}px, ${pr.y - h / 2}px) scale(${pr.s}) perspective(1600px) rotateY(${rotY}deg) rotateZ(${(rnd(i * 3) - 0.5) * 14 * f * (isPick ? 1 - sel : 1)}deg)`, zIndex: Math.round(100000 - pr.d), opacity: o}}>
              <Tile i={i} t={t} />
            </div>
          );
        })}
      {/* process tracker — small, Latin, gold = active, tiny red = live */}
      {t >= NET.search - 0.15 && (
        <div style={{position: 'absolute', top: 290, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 34, zIndex: 400000, opacity: ramp(t, NET.search - 0.15, NET.search + 0.05) * (1 - thr)}}>
          {STEPS.map(([s, ts], k) => {
            const on = t >= ts - 0.02;
            const active = on && (k === 3 || t < STEPS[k + 1][1] - 0.02);
            const land = ramp(t, ts - 0.02, ts + 0.18, (x) => back(x, 1.8));
            return (
              <div key={s} style={{display: 'flex', alignItems: 'center', gap: 8, transform: `scale(${active ? lerp(1.35, 1.12, land) : 1})`, opacity: on ? (active ? 1 : 0.55) : 0.25}}>
                {active && <div style={{width: 6, height: 6, borderRadius: 3, background: C.red}} />}
                <div style={{fontFamily: FONT.la, fontSize: 17, fontWeight: active ? 800 : 600, letterSpacing: '0.34em', textTransform: 'uppercase', color: active ? C.goldLight : 'rgba(246,238,222,0.9)'}}>{s}</div>
              </div>
            );
          })}
        </div>
      )}
      {/* "inside the market" whisper in the hall */}
      {t > HALL.start + 0.1 && t < NET.burst + 0.3 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 360, display: 'flex', justifyContent: 'center', zIndex: 400000, opacity: ramp(t, HALL.start + 0.1, HALL.start + 0.3) * (1 - ramp(t, NET.burst, NET.burst + 0.25))}}>
          <Micro text="Inside the market" />
        </div>
      )}
      {/* through the card: warm light on the other side */}
      {thr > 0 && <AbsoluteFill style={{zIndex: 500000, background: `radial-gradient(circle at ${CX}px ${CY}px, rgba(255,236,196,${0.5 * thr * thr}) 0%, rgba(240,200,120,${0.25 * thr}) 30%, rgba(0,0,0,0) 70%)`, mixBlendMode: 'screen'}} />}
    </AbsoluteFill>
  );
};
