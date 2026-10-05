import React from 'react';
import {COUNTERS, FONTS} from '../data';
import {clamp, smoothstep} from '../lib/math';

/**
 * Counting digits that are NEVER clipped: no rolling strip, no overflow:hidden, no masks.
 * Every frame shows whole glyphs only.
 *
 * A column is driven by a continuous value `c` (e.g. the price's thousands column = value / 1000)
 * and shows floor(c) mod 10.
 *  - slow change (< FAST_RATE digit/frame): the outgoing digit is gone within the first frame of
 *    the change (opacity (1-p)^4 ≤ 0.07), the incoming one is solid at once (opacity ≥ 0.85) and
 *    only settles from just below (≤ 0.06 em drift) — never a grey double-exposed digit;
 *  - fast change: hard per-frame switches (each frame one complete digit).
 * The column width is fixed, so nothing shifts while counting.
 */

export const FAST_RATE = COUNTERS.fastRate; // digit / frame
export const FADE_FRAMES = COUNTERS.fadeFrames; // settle length (frames, incl. the first frame of the change)
const DRIFT_EM = COUNTERS.driftEm;

const mod10 = (n: number) => ((n % 10) + 10) % 10;

export type ColumnState = {
  /** continuous column value at this frame */
  c: number;
  /** |dc/dframe| at the last digit change (or now, when no change is in progress) */
  rate: number;
  /** frames since the shown digit appeared (Infinity when settled) */
  since: number;
  /** digit shown before the last change */
  prev: number;
};

/**
 * Exact column state from a value function: finds the sub-frame moment of the last digit change
 * (so a crossfade is never cut short when the value lands and stops) and the rate at that moment.
 */
export const columnAt = (valueAt: (f: number) => number, frame: number, unit = 1): ColumnState => {
  const col = (f: number) => valueAt(f) / unit;
  const c = col(frame);
  const d = Math.floor(c + 1e-9);
  // left-sided: the speed the value arrived with (a value that lands and stops at the change
  // must not count as slow just because it is constant afterwards)
  const rateAt = (f: number) => Math.abs(col(f) - col(f - 0.25)) * 4;
  // walk back in 1/8 frame steps over the fade window
  const step = 1 / 8;
  let lo = NaN;
  for (let t = frame - step; t >= frame - FADE_FRAMES - 1; t -= step) {
    if (Math.floor(col(t) + 1e-9) !== d) {
      lo = t;
      break;
    }
  }
  if (Number.isNaN(lo)) return {c, rate: rateAt(frame), since: Infinity, prev: mod10(d - 1)};
  // bisection: lo = old digit, hi = current digit
  let hi = Math.min(frame, lo + step);
  for (let i = 0; i < 14; i++) {
    const m = (lo + hi) / 2;
    if (Math.floor(col(m) + 1e-9) !== d) lo = m;
    else hi = m;
  }
  return {c, rate: rateAt(hi), since: frame - hi, prev: mod10(Math.floor(col(lo) + 1e-9))};
};

export const CountDigit: React.FC<{
  c: number;
  rate: number;
  since?: number;
  prev?: number;
  size: number;
  width: number;
  color?: string;
  weight?: number;
  digitStyle?: React.CSSProperties;
  style?: React.CSSProperties;
}> = ({c, rate, since, prev, size, width, color, weight = 700, digitStyle, style}) => {
  const d = mod10(Math.floor(c + 1e-9));
  const s = since ?? (rate > 1e-6 ? (c - Math.floor(c + 1e-9)) / rate : Infinity);
  const p = rate >= FAST_RATE ? 1 : smoothstep(0, 1, clamp((s + 1) / FADE_FRAMES));
  const h = size * 1.12;
  const glyph = (digit: number, opacity: number, dy: number, key: string) => (
    <span
      key={key}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width,
        height: h,
        lineHeight: `${h}px`,
        textAlign: 'center',
        fontFamily: FONTS.latin,
        fontWeight: weight,
        fontSize: size,
        fontVariantNumeric: 'tabular-nums',
        color,
        opacity,
        transform: dy ? `translateY(${(dy * size).toFixed(2)}px)` : undefined,
        ...digitStyle,
      }}
    >
      {digit}
    </span>
  );
  return (
    <span style={{display: 'inline-block', position: 'relative', width, height: h, flex: 'none', verticalAlign: 'top', ...style}}>
      {/* outgoing vanishes within one frame, incoming is solid at once → one clear digit per frame */}
      {p < 1 && Math.pow(1 - p, 4) > 0.004 && glyph(prev ?? mod10(d - 1), Math.pow(1 - p, 4), -DRIFT_EM * p, 'out')}
      {glyph(d, p < 1 ? 0.85 + 0.15 * p : 1, p < 1 ? DRIFT_EM * (1 - p) : 0, 'in')}
    </span>
  );
};
