import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, FONT} from '../film/brand';
import {Cam, clamp, H, lerp, noise1, ramp, rnd, V3, W} from '../film/lib';
import {CanvasLayer, glowSprite} from '../film/ui';

export const IVORY_RGBA = 'rgba(246,238,222,1)';

/** Look-at camera in the shared projection convention (y down, z forward). */
export const lookAt = (pos: V3, target: V3, roll = 0, f?: number): Cam => {
  const dx = target[0] - pos[0], dy = target[1] - pos[1], dz = target[2] - pos[2];
  return {pos, yaw: Math.atan2(dx, dz), pitch: Math.atan2(dy, Math.hypot(dx, dz)), roll, f};
};

/** Short camera recoil after an impact: a quick push back that settles. */
export const recoil = (t: number, at: number, amp = 60) => {
  const k = t - at;
  if (k < 0 || k > 0.5) return 0;
  return -amp * Math.sin(Math.min(1, k / 0.06) * Math.PI / 2) * Math.exp(-k * 9);
};

/**
 * Monumental extruded Arabic: a front face (ivory or gold) over stacked depth slices,
 * rendered in real CSS 3-D so perspective rotation reveals the sides.
 */
export const Extruded: React.FC<{
  text: string;
  size: number;
  rotX?: number;
  rotY?: number;
  depth?: number;
  slices?: number;
  face?: 'ivory' | 'gold';
  sheen?: number; // 0..1 light sweep position
  weight?: number;
}> = ({text, size, rotX = 0, rotY = 0, depth = 0.11, slices = 12, face = 'ivory', sheen = -1, weight = 900}) => {
  const step = (size * depth) / slices;
  const base: React.CSSProperties = {fontFamily: FONT.ar, fontSize: size, fontWeight: weight, lineHeight: 1.15, whiteSpace: 'nowrap', letterSpacing: 0, direction: 'rtl', textAlign: 'center'};
  const faceBg =
    face === 'gold'
      ? `linear-gradient(100deg, #8A6512 0%, #C9971C 25%, #F3DC9A ${lerp(30, 70, clamp(sheen))}%, #C9971C 75%, #8A6512 100%)`
      : `linear-gradient(170deg, #FFFDF7 0%, #F1E9D8 45%, #D9CCB0 100%)`;
  return (
    <div style={{perspective: 1500, perspectiveOrigin: '50% 50%'}}>
      <div style={{position: 'relative', transformStyle: 'preserve-3d', transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`}}>
        {Array.from({length: slices}, (_, i) => {
          const k = slices - i; // back → front
          const tone = 1 - k / slices;
          const col = face === 'gold' ? `rgb(${Math.round(60 + 90 * tone)},${Math.round(44 + 66 * tone)},${Math.round(10 + 20 * tone)})` : `rgb(${Math.round(42 + 95 * tone)},${Math.round(38 + 84 * tone)},${Math.round(30 + 62 * tone)})`;
          return (
            <div key={i} style={{...base, position: i === 0 ? 'relative' : 'absolute', inset: 0, color: col, transform: `translateZ(${-k * step}px)`}}>
              {text}
            </div>
          );
        })}
        <div
          style={{
            ...base,
            position: 'absolute',
            inset: 0,
            backgroundImage: faceBg,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            WebkitTextStroke: face === 'gold' ? '1px rgba(255,236,190,0.6)' : '1.5px rgba(226,186,96,0.75)',
            transform: 'translateZ(0.5px)',
          }}
        >
          {text}
        </div>
        {sheen >= 0 && sheen <= 1 && (
          <div
            style={{
              ...base,
              position: 'absolute',
              inset: 0,
              backgroundImage: `linear-gradient(105deg, rgba(255,255,255,0) ${sheen * 120 - 30}%, rgba(255,250,232,0.85) ${sheen * 120 - 15}%, rgba(255,255,255,0) ${sheen * 120}%)`,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              transform: 'translateZ(1px)',
              mixBlendMode: 'screen',
            }}
          >
            {text}
          </div>
        )}
      </div>
    </div>
  );
};

/** Small tracked Latin micro-label with a hairline (never large). */
export const Micro: React.FC<{text: string; color?: string; dot?: boolean; size?: number}> = ({text, color = 'rgba(246,238,222,0.86)', dot, size = 17}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
    {dot && <div style={{width: 7, height: 7, borderRadius: 4, background: C.red, boxShadow: '0 0 8px rgba(232,64,47,0.8)'}} />}
    <div style={{fontFamily: FONT.la, fontSize: size, fontWeight: 600, letterSpacing: '0.42em', color, textTransform: 'uppercase', whiteSpace: 'nowrap'}}>{text}</div>
  </div>
);

/** Ambient dust in ivory (gold only reserved for meaning). */
export const IvoryDust: React.FC<{t: number; amount?: number}> = ({t, amount = 0.6}) => (
  <CanvasLayer
    draw={(ctx) => {
      ctx.globalCompositeOperation = 'lighter';
      const s = glowSprite(IVORY_RGBA, 0.18);
      for (let i = 0; i < 90; i++) {
        const dpt = 0.25 + rnd(i * 3.1) * 0.75;
        const x = (((rnd(i * 7.7) * W + t * (12 + dpt * 30) * (rnd(i) > 0.5 ? 1 : -0.7) + noise1(t * 0.3 + i, i) * 40) % (W + 80)) + W + 80) % (W + 80) - 40;
        const y = (((rnd(i * 1.9) * H - t * (10 + dpt * 24) + noise1(t * 0.25 + i * 2, i + 3) * 50) % (H + 80)) + H + 80) % (H + 80) - 40;
        const r = 2 + dpt * 7;
        ctx.globalAlpha = clamp(amount * (0.12 + dpt * 0.35) * (0.6 + 0.4 * Math.sin(t * 2 + i)));
        ctx.drawImage(s, x - r, y - r, r * 2, r * 2);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }}
  />
);

/** Cool graphite grade over imagery so gold reads as meaning, not decoration. */
export const Grade: React.FC<{k?: number}> = ({k = 1}) => (
  <AbsoluteFill style={{background: `linear-gradient(180deg, rgba(10,14,24,${0.35 * k}) 0%, rgba(10,14,24,${0.05 * k}) 35%, rgba(10,14,24,${0.08 * k}) 60%, rgba(8,9,12,${0.55 * k}) 100%)`, pointerEvents: 'none'}} />
);

export const rampHold = (t: number, a: number, b: number) => ramp(t, a, b);
export {C};

/**
 * The signature ALPHA-gold line — one visual DNA through the whole film. Draws a polyline
 * up to `prog` (0..1 of its length) with a soft glow, a fine core and a bright head.
 */
export const goldLine = (ctx: CanvasRenderingContext2D, pts: {x: number; y: number}[], prog: number, alpha = 1, width = 3, head = true) => {
  if (pts.length < 2 || prog <= 0 || alpha <= 0) return;
  const seg: number[] = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    seg.push(d);
    total += d;
  }
  let remain = total * Math.min(1, prog);
  const path: {x: number; y: number}[] = [pts[0]];
  for (let i = 1; i < pts.length && remain > 0; i++) {
    const d = seg[i - 1];
    if (d <= remain) {
      path.push(pts[i]);
      remain -= d;
    } else {
      const k = remain / d;
      path.push({x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * k, y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * k});
      remain = 0;
    }
  }
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const stroke = (w: number, c: string) => {
    ctx.strokeStyle = c;
    ctx.lineWidth = w;
    ctx.beginPath();
    path.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.stroke();
  };
  ctx.globalCompositeOperation = 'lighter';
  stroke(width * 6, `rgba(226,170,70,${0.08 * alpha})`);
  stroke(width * 2.4, `rgba(236,190,90,${0.22 * alpha})`);
  ctx.globalCompositeOperation = 'source-over';
  stroke(width, `rgba(244,214,140,${0.95 * alpha})`);
  if (head && prog < 1) {
    const h = path[path.length - 1];
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(h.x, h.y, 0, h.x, h.y, 26);
    g.addColorStop(0, `rgba(255,248,226,${alpha})`);
    g.addColorStop(0.4, `rgba(240,200,120,${0.45 * alpha})`);
    g.addColorStop(1, 'rgba(240,200,120,0)');
    ctx.fillStyle = g;
    ctx.fillRect(h.x - 26, h.y - 26, 52, 52);
  }
  ctx.restore();
};
