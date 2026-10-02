import {Easing, interpolate, spring} from 'remotion';

export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
export const easeIn = Easing.bezier(0.5, 0, 0.9, 0.4);

/** 0→1 over [start, start+dur] with an easing curve (never linear). */
export const prog = (frame: number, start: number, dur: number, easing: (t: number) => number = easeOut) =>
  interpolate(frame, [start, start + dur], [0, 1], {
    easing,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export const pop = (frame: number, fps: number, delay = 0, damping = 14, stiffness = 120) =>
  spring({frame: frame - delay, fps, config: {damping, stiffness, mass: 0.8}});

/** Deterministic pseudo-random in [0,1) — renders must be repeatable. */
export const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Catmull-Rom → cubic bezier path through points. */
export const smoothPath = (pts: [number, number][], tension = 0.5, close = false) => {
  const n = pts.length;
  const p = (i: number) => (close ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  const last = close ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = p(i - 1), p1 = p(i), p2 = p(i + 1), p3 = p(i + 2);
    const c1x = p1[0] + ((p2[0] - p0[0]) * tension) / 3 * 2 * 0.5;
    const c1y = p1[1] + ((p2[1] - p0[1]) * tension) / 3 * 2 * 0.5;
    const c2x = p2[0] - ((p3[0] - p1[0]) * tension) / 3 * 2 * 0.5;
    const c2y = p2[1] - ((p3[1] - p1[1]) * tension) / 3 * 2 * 0.5;
    d += ` C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return close ? d + 'Z' : d;
};

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
