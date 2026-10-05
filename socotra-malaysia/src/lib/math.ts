export const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smoothstep = (e0: number, e1: number, x: number) => {
  const t = clamp((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - clamp(t), 3);
export const easeInOutSine = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * clamp(t));
export const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(t)));

/** Quintic Hermite (zero acceleration at both ends) — C2 smooth position. */
export const quintic = (u: number, p0: number, p1: number, v0: number, v1: number) => {
  const u2 = u * u;
  const u3 = u2 * u;
  const u4 = u3 * u;
  const u5 = u4 * u;
  const h1 = u - 6 * u3 + 8 * u4 - 3 * u5;
  const h4 = -4 * u3 + 7 * u4 - 3 * u5;
  const h5 = 10 * u3 - 15 * u4 + 6 * u5;
  const d1 = 1 - 18 * u2 + 32 * u3 - 15 * u4;
  const d4 = -12 * u2 + 28 * u3 - 15 * u4;
  const d5 = 30 * u2 - 60 * u3 + 30 * u4;
  const D = p1 - p0;
  return {p: p0 + h1 * v0 + h4 * v1 + h5 * D, dp: d1 * v0 + d4 * v1 + d5 * D};
};

/** Fritsch–Carlson monotone cubic interpolation (no overshoot). */
export const monotoneCubic = (xs: number[], ys: number[]) => {
  const n = xs.length;
  const d: number[] = [];
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const s = a * a + b * b;
    if (s > 9) {
      const t = 3 / Math.sqrt(s);
      m[i] = t * a * d[i];
      m[i + 1] = t * b * d[i];
    }
  }
  return (x: number) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (i < n - 2 && x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i];
    const t = (x - xs[i]) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      (2 * t3 - 3 * t2 + 1) * ys[i] +
      (t3 - 2 * t2 + t) * h * m[i] +
      (-2 * t3 + 3 * t2) * ys[i + 1] +
      (t3 - t2) * h * m[i + 1]
    );
  };
};

/** Deterministic pseudo-random in [0,1). */
export const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
};
