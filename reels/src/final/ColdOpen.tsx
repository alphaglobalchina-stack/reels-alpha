import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {C, FONT, IMG} from '../film/brand';
import {back, Cam, clamp, CX, CY, ease, lerp, mix3, project, ramp, rnd, V3} from '../film/lib';
import {CanvasLayer, glowSprite, Plane} from '../film/ui';
import {goldLine, IVORY_RGBA} from './kit';
import {COLD} from './plan';

/**
 * SILENT COLD OPEN (0–3 s): hundreds of possible suppliers → the ALPHA-gold line →
 * filtering → RIGHT MATCH → the card becomes a container's doors → CLACK CLACK →
 * the doors open onto Guangzhou.
 */
const LABELS = ['Factory', 'Supplier', 'OEM', 'MOQ', 'Price', 'Spec', 'Lead time'];
const THUMBS = [IMG.cnc, IMG.line, IMG.pack, IMG.factory, IMG.insp, IMG.ware, IMG.cmp, IMG.inspWare, 'film/fair_booth.webp', 'film/fair_hall.webp'];
const NCARD = 96;
// the line's path through space (world), and the cards it evaluates on the way
const PATH: V3[] = [
  [-900, 700, 300],
  [-420, 260, 900],
  [260, -80, 1500],
  [-180, -320, 2150],
  [330, 120, 2750],
  [-120, 40, 3300],
  [0, 0, 3800], // the right match
];
const FINAL_Z = 3800;
const TOUCH = [1, 2, 3, 4, 5].map((k) => ({k, t: lerp(COLD.line + 0.1, COLD.silence - 0.08, Math.pow(k / 5, 0.75))}));
const MICRO = ['Verify', 'Compare', 'Check', 'Compare', 'Verify'];

const CARDS: {p: V3; label: string; thumb: string; rot: number; reject: number; touch?: number}[] = Array.from({length: NCARD}, (_, i) => {
  const p: V3 = [(rnd(i * 3.1) - 0.5) * 3200, (rnd(i * 5.7) - 0.5) * 3600, 300 + rnd(i * 7.3) * 6200];
  return {p, label: LABELS[i % LABELS.length], thumb: THUMBS[i % THUMBS.length], rot: (rnd(i * 9.1) - 0.5) * 40, reject: COLD.line + 0.15 + Math.pow(rnd(i * 2.9), 0.7) * (COLD.silence - COLD.line - 0.15)};
});
// cards that sit on the path get evaluated by the line
TOUCH.forEach(({k, t}, j) => {
  CARDS[j] = {p: [PATH[k][0] + 150, PATH[k][1] - 40, PATH[k][2] + 60], label: LABELS[(j * 3) % 7], thumb: THUMBS[j + 2], rot: (j % 2 ? 1 : -1) * 14, reject: t + 0.14, touch: t};
});
const FINAL = NCARD - 1;
CARDS[FINAL] = {p: [0, 0, FINAL_Z], label: 'Supplier', thumb: IMG.factory, rot: 0, reject: 99};
// a few cards that brush past the lens during the reveal
for (let j = 0; j < 6; j++) CARDS[10 + j].p = [(j % 2 ? 1 : -1) * (260 + j * 60), (j - 2.5) * 300, 380 + j * 160];

const lineProg = (t: number) => ramp(t, COLD.line, COLD.silence, (x) => Math.pow(x, 1.6));
const along = (k: number): V3 => {
  const segs = PATH.length - 1;
  const f = Math.min(segs - 1e-6, k * segs);
  const i = Math.floor(f);
  return mix3(PATH[i], PATH[i + 1], f - i);
};
export const coldCam = (t: number): Cam => {
  const drift = ramp(t, 0, COLD.line, ease.out);
  const start: V3 = [lerp(120, -80, drift), lerp(-40, 200, drift), lerp(-700, -300, drift)];
  const head = along(lineProg(t));
  const chase: V3 = [head[0] * 0.75, head[1] * 0.75, head[2] - 760];
  const k = ramp(t, COLD.line, COLD.line + 0.25, ease.inOut);
  const lockPos: V3 = [0, 0, FINAL_Z - 560];
  const settle = ramp(t, COLD.silence - 0.06, COLD.lock, ease.out);
  const rec = t > COLD.lock && t < COLD.lock + 0.4 ? -36 * Math.sin(Math.min(1, (t - COLD.lock) / 0.05) * Math.PI / 2) * Math.exp(-(t - COLD.lock) * 10) : 0;
  const p = mix3(mix3(start, chase, k), lockPos, settle);
  return {pos: [p[0], p[1], p[2] + rec], yaw: lerp(0.12, 0, settle) * k + 0.04 * (1 - k), roll: lerp(-0.06, 0, settle)};
};

// screen rect of the final card when locked (also the container's starting geometry)
const CARD_W = 260, CARD_H = 340;
const LOCK_S = 1250 / 560;
export const CARD_SCREEN = {w: CARD_W * LOCK_S, h: CARD_H * LOCK_S};
const CONT = {w: 880, h: 1010}; // container doors on screen once morphed

/** rect of the container opening on screen (city is clipped to it while the doors open). */
export const openingRect = (t: number) => {
  const m = ramp(t, COLD.morph, COLD.clack1, ease.inOut);
  const thr = ramp(t, COLD.through, COLD.end, (x) => x * x * x);
  const s = 1 + 5.5 * thr;
  const w = lerp(CARD_SCREEN.w, CONT.w, m) * s, h = lerp(CARD_SCREEN.h, CONT.h, m) * s;
  return {x: CX - w / 2, y: CY - h / 2, w, h, s, thr};
};

const Card: React.FC<{i: number; t: number}> = ({i, t}) => {
  const c = CARDS[i];
  const rej = ramp(t, c.reject, c.reject + 0.28);
  const touched = c.touch !== undefined && t >= c.touch - 0.02 ? ramp(t, c.touch - 0.02, c.touch + 0.08) * (1 - rej) : 0;
  const isFinal = i === FINAL;
  const lock = isFinal ? ramp(t, COLD.lock - 0.02, COLD.lock + 0.12) : 0;
  return (
    <div style={{width: CARD_W, height: CARD_H, borderRadius: 14, overflow: 'hidden', position: 'relative', background: 'linear-gradient(170deg, #1a1c21, #0c0d10)', border: `1.5px solid ${touched > 0 ? `rgba(240,211,138,${0.5 + 0.5 * touched})` : isFinal ? `rgba(240,211,138,${0.3 + 0.7 * lock})` : 'rgba(246,238,222,0.16)'}`, filter: rej > 0 ? `grayscale(${rej}) brightness(${1 - 0.7 * rej})` : undefined, boxShadow: '0 20px 40px rgba(0,0,0,0.5)'}}>
      <Img src={staticFile(c.thumb)} style={{width: CARD_W, height: 190, objectFit: 'cover', objectPosition: `${30 + rnd(i) * 40}% 50%`, filter: 'saturate(0.55) brightness(0.8)'}} />
      <div style={{padding: '14px 16px'}}>
        <div style={{fontFamily: FONT.la, fontSize: 13, letterSpacing: '0.34em', fontWeight: 700, color: isFinal || touched > 0 ? C.goldLight : 'rgba(246,238,222,0.8)', textTransform: 'uppercase'}}>{c.label}</div>
        {[0.82, 0.56, 0.68].map((w, k) => (
          <div key={k} style={{height: 5, width: `${w * 100}%`, borderRadius: 3, background: 'rgba(246,238,222,0.13)', marginTop: 11}} />
        ))}
      </div>
    </div>
  );
};

/** card field + gold line (under the city) */
export const ColdField: React.FC<{t: number}> = ({t}) => {
  const cam = coldCam(t);
  const reveal = ramp(t, COLD.reveal, COLD.reveal + 0.4, ease.out);
  const fieldOut = ramp(t, COLD.morph, COLD.open, ease.inOut);
  if (t >= COLD.end) return null;
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse 80% 60% at 50% 50%, #131927 0%, ${C.ink} 75%)`, overflow: 'hidden', isolation: 'isolate'}}>
      {/* haze */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 60% 45% at 50% 45%, rgba(200,210,230,0.07), rgba(0,0,0,0) 70%)', opacity: reveal}} />
      {CARDS.map((c, i) => {
        if (i === FINAL && t >= COLD.morph) return null; // the container takes over
        const rej = ramp(t, c.reject, c.reject + 0.28, (x) => x * x);
        const p: V3 = [c.p[0] * (1 + rej * 0.3), c.p[1] * (1 + rej * 0.3), c.p[2] + rej * 2800];
        const o = reveal * (1 - rej) * (i === FINAL ? 1 : 1 - fieldOut);
        if (o < 0.01) return null;
        const focus = t < COLD.line ? 1500 : t < COLD.silence ? 900 : 560;
        return (
          <Plane key={i} cam={cam} p={p} w={CARD_W} h={CARD_H} rotY={c.rot * (1 - ramp(t, COLD.silence - 0.1, COLD.lock) * (i === FINAL ? 1 : 0))} rotZ={(rnd(i * 4) - 0.5) * 8 * (i === FINAL ? 1 - ramp(t, COLD.silence - 0.1, COLD.lock) : 1)} opacity={o} focus={focus} dof={i === FINAL && t > COLD.silence ? 0 : 9} near={50}>
            <Card i={i} t={t} />
          </Plane>
        );
      })}
      <CanvasLayer
        draw={(ctx) => {
          // ambient motes
          ctx.globalCompositeOperation = 'lighter';
          const iv = glowSprite(IVORY_RGBA, 0.2);
          for (let i = 0; i < 70; i++) {
            const pr = project(cam, [(rnd(i * 1.3) - 0.5) * 3000, (rnd(i * 2.1) - 0.5) * 3600, 200 + rnd(i * 3.7) * 6000]);
            if (pr.d < 40) continue;
            const r = 3 * Math.max(0.5, pr.s * 1.4);
            ctx.globalAlpha = 0.35 * reveal * (1 - fieldOut);
            ctx.drawImage(iv, pr.x - r * 2, pr.y - r * 2, r * 4, r * 4);
          }
          ctx.globalAlpha = 1;
          ctx.globalCompositeOperation = 'source-over';
          // the ALPHA-gold line, chased by the camera
          const lp = lineProg(t);
          if (lp > 0 && t < COLD.morph + 0.05) {
            const pts = PATH.map((p) => project(cam, p)).filter((p) => p.d > 30);
            goldLine(ctx, pts, lp, 1 - ramp(t, COLD.lock, COLD.morph), 3);
          }
        }}
      />
      {/* micro labels where the line evaluates suppliers */}
      {TOUCH.map(({k, t: tt}, j) => {
        const o = ramp(t, tt - 0.02, tt + 0.06) * (1 - ramp(t, tt + 0.16, tt + 0.3));
        if (o <= 0) return null;
        const pr = project(cam, [PATH[k][0] + 150, PATH[k][1] - 260, PATH[k][2] + 60]);
        return (
          <div key={j} style={{position: 'absolute', left: pr.x, top: pr.y, transform: 'translate(-50%,-50%)', opacity: o, zIndex: 300000, fontFamily: FONT.la, fontSize: 17, fontWeight: 700, letterSpacing: '0.4em', color: C.goldLight, textTransform: 'uppercase'}}>
            {MICRO[j]}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/** container doors + frame + lock (above the city) */
export const ColdDoors: React.FC<{t: number}> = ({t}) => {
  if (t < COLD.silence - 0.1 || t >= COLD.end) return null;
  const r = openingRect(t);
  const m = ramp(t, COLD.morph, COLD.clack1, ease.inOut);
  const lock = ramp(t, COLD.lock - 0.02, COLD.lock + 0.14, (x) => back(x, 1.6));
  const open = ramp(t, COLD.open, COLD.through + 0.2, (x) => 1 - Math.pow(1 - x, 2.2));
  const bar = (k: number) => ramp(t, k < 2 ? COLD.clack1 - 0.1 : COLD.clack2 - 0.1, k < 2 ? COLD.clack1 : COLD.clack2, (x) => back(x, 2.2));
  const frame = lerp(2, 26, m) * r.s;
  const visible = t >= COLD.lock - 0.02;
  if (!visible) return null;
  const doorW = r.w / 2;
  const Door: React.FC<{side: -1 | 1}> = ({side}) => (
    <div
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: doorW,
        left: side < 0 ? 0 : doorW,
        transformOrigin: side < 0 ? '0% 50%' : '100% 50%',
        transform: `rotateY(${side < 0 ? -108 * open : 108 * open}deg)`,
        backfaceVisibility: 'visible',
      }}
    >
      {/* card face → corrugated steel */}
      <div style={{position: 'absolute', inset: 0, background: `linear-gradient(170deg, #1d2129, #0e1015)`, opacity: 1}} />
      <div style={{position: 'absolute', inset: 0, opacity: m, backgroundImage: `repeating-linear-gradient(90deg, rgba(255,255,255,0.055) 0px, rgba(255,255,255,0.055) ${6 * r.s}px, rgba(0,0,0,0.22) ${10 * r.s}px, rgba(0,0,0,0.22) ${16 * r.s}px, rgba(255,255,255,0.0) ${22 * r.s}px)`}} />
      <div style={{position: 'absolute', inset: 0, opacity: 0.5 * m, background: `linear-gradient(${side < 0 ? 100 : 80}deg, rgba(240,211,138,0.10), rgba(0,0,0,0) 40%, rgba(0,0,0,0.35))`}} />
      {/* locking bars: two per door, snap into place */}
      {[0, 1].map((j) => {
        const k = side < 0 ? j : j + 2;
        const b = bar(k);
        const x = (side < 0 ? [0.3, 0.72] : [0.28, 0.7])[j] * doorW;
        return (
          <div key={j} style={{position: 'absolute', left: x - 7 * r.s, top: 30 * r.s, bottom: 30 * r.s, width: 14 * r.s, opacity: clamp(m * 1.5), transform: `translateY(${(1 - b) * -90 * r.s}px)`}}>
            <div style={{position: 'absolute', inset: 0, borderRadius: 7 * r.s, background: 'linear-gradient(90deg, #6f6a60, #d9d2c2 45%, #5a554c)', boxShadow: '0 0 8px rgba(0,0,0,0.6)'}} />
            {/* handle */}
            <div style={{position: 'absolute', left: -18 * r.s, top: '56%', width: 50 * r.s, height: 11 * r.s, borderRadius: 6 * r.s, background: `linear-gradient(180deg, ${C.goldLight}, ${C.goldDark})`, transformOrigin: '36% 50%', transform: `rotate(${(1 - b) * 80}deg)`}} />
            {/* cam keepers top & bottom */}
            {[0, 1].map((q) => (
              <div key={q} style={{position: 'absolute', left: -6 * r.s, width: 26 * r.s, height: 16 * r.s, top: q ? undefined : -4 * r.s, bottom: q ? -4 * r.s : undefined, background: '#2a2d33', border: `1px solid rgba(240,211,138,${0.5 * b})`, borderRadius: 3 * r.s}} />
            ))}
          </div>
        );
      })}
    </div>
  );
  return (
    <AbsoluteFill style={{pointerEvents: 'none', zIndex: 600000}}>
      <div style={{position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, perspective: 1600 * r.s}}>
        <div style={{position: 'absolute', inset: 0, transformStyle: 'preserve-3d'}}>
          <Door side={-1} />
          <Door side={1} />
        </div>
        {/* the card's UI dissolving into the steel */}
        {m < 1 && (
          <div style={{position: 'absolute', left: 0, top: 0, width: r.w, height: r.h, opacity: 1 - m, overflow: 'hidden', borderRadius: 14 * LOCK_S * (1 - m)}}>
            <Img src={staticFile(IMG.factory)} style={{width: r.w, height: r.h * 0.56, objectFit: 'cover', filter: 'saturate(0.55) brightness(0.8)'}} />
            <div style={{padding: `${16 * LOCK_S}px ${18 * LOCK_S}px`}}>
                <div style={{fontFamily: FONT.la, fontSize: 13 * LOCK_S, letterSpacing: '0.34em', fontWeight: 700, color: C.goldLight, textTransform: 'uppercase'}}>Supplier</div>
                {[0.82, 0.56, 0.68].map((w, k) => (
                  <div key={k} style={{height: 5 * LOCK_S, width: `${w * 100}%`, borderRadius: 3, background: 'rgba(246,238,222,0.18)', marginTop: 11 * LOCK_S, transform: `scaleY(${1 + 3 * m})`}} />
                ))}
            </div>
          </div>
        )}

        {/* frame: the gold outline becomes the steel container frame */}
        <div style={{position: 'absolute', inset: -frame, border: `${frame}px solid transparent`, borderImage: `linear-gradient(160deg, #2a2e36, #15171c 50%, #2a2e36) 1`, opacity: m}} />
        <div style={{position: 'absolute', inset: -frame, boxShadow: `inset 0 0 0 ${Math.max(1.5, 2 * r.s)}px rgba(240,211,138,${lerp(1, 0.55, m)}), 0 0 ${40 * (1 - m) * lock}px rgba(226,182,80,0.6)`, transform: `scale(${lerp(1.08, 1, lock)})`, opacity: lock}} />
        {/* lock corners */}
        {m < 1 &&
          [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy], q) => (
            <div key={q} style={{position: 'absolute', width: 34, height: 34, left: sx < 0 ? -18 - (1 - lock) * 40 : undefined, right: sx > 0 ? -18 - (1 - lock) * 40 : undefined, top: sy < 0 ? -18 - (1 - lock) * 40 : undefined, bottom: sy > 0 ? -18 - (1 - lock) * 40 : undefined, borderLeft: sx < 0 ? `3px solid ${C.goldLight}` : undefined, borderRight: sx > 0 ? `3px solid ${C.goldLight}` : undefined, borderTop: sy < 0 ? `3px solid ${C.goldLight}` : undefined, borderBottom: sy > 0 ? `3px solid ${C.goldLight}` : undefined, opacity: lock * (1 - m)}} />
          ))}
      </div>
      {/* RIGHT MATCH */}
      {lock > 0 && t < COLD.clack1 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: r.y + r.h + 46, display: 'flex', justifyContent: 'center', opacity: lock * (1 - ramp(t, COLD.morph + 0.05, COLD.clack1))}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
            <div style={{width: 7, height: 7, borderRadius: 4, background: C.red}} />
            <div style={{fontFamily: FONT.la, fontSize: 22, fontWeight: 800, letterSpacing: '0.46em', color: C.goldLight}}>RIGHT MATCH</div>
          </div>
        </div>
      )}
      {/* the outside of the container darkens away as we fly through */}
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 0%, rgba(4,5,7,${0.6 * r.thr}) 100%)`}} />
    </AbsoluteFill>
  );
};
