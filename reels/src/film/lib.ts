/** Deterministic motion helpers + a tiny 3-D camera shared by DOM planes and canvas layers. */

export const W = 1080;
export const H = 1920;
export const CX = W / 2;
export const CY = H / 2;

// ── easing ──────────────────────────────────────────────────────────────────
const bez = (x1: number, y1: number, x2: number, y2: number) => {
  // cubic-bezier solver (Newton + bisection fallback)
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sy = (t: number) => ((ay * t + by) * t + cy) * t;
  const dx = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const e = sx(t) - x;
      const d = dx(t);
      if (Math.abs(e) < 1e-5) break;
      if (Math.abs(d) < 1e-6) break;
      t -= e / d;
    }
    t = Math.min(1, Math.max(0, t));
    return sy(t);
  };
};
export const ease = {
  out: bez(0.16, 1, 0.3, 1), // expo-ish out — entrances
  inOut: bez(0.65, 0, 0.35, 1), // camera travel
  in: bez(0.55, 0, 0.9, 0.35), // exits / accelerating into a portal
  soft: bez(0.4, 0, 0.2, 1),
  linear: (x: number) => x,
};
/** Overshoot then settle (anticipation-free "weighty landing"). */
export const back = (x: number, s = 1.5) => {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const t = x - 1;
  return t * t * ((s + 1) * t + s) + 1;
};
/** Damped spring 0→1, premium (not bouncy). t in seconds since start. */
export const spring = (t: number, freq = 2.2, damp = 0.55) => {
  if (t <= 0) return 0;
  const w = 2 * Math.PI * freq;
  return 1 - Math.exp(-damp * w * t) * Math.cos(w * Math.sqrt(1 - damp * damp) * t);
};

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const mix3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

/** 0→1 between seconds a and b with easing. */
export const ramp = (t: number, a: number, b: number, e: (x: number) => number = ease.out) => e(clamp((t - a) / (b - a)));
/** fade in over [a, a+i], hold, fade out over [b-o, b]. */
export const win = (t: number, a: number, b: number, i = 0.3, o = 0.3) => Math.min(ramp(t, a, a + i, ease.soft), 1 - ramp(t, b - o, b, ease.soft));

/** Deterministic hash noise in [0,1). */
export const rnd = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
/** Smooth 1-D value noise, ~[-1,1]. */
export const noise1 = (x: number, seed = 0) => {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return lerp(rnd(i + seed * 101) * 2 - 1, rnd(i + 1 + seed * 101) * 2 - 1, u);
};

// ── camera ──────────────────────────────────────────────────────────────────
export type V3 = [number, number, number];
/** World: x right, y down, z forward (away from viewer). */
export type Cam = {pos: V3; yaw?: number; pitch?: number; roll?: number; f?: number};
export type Proj = {x: number; y: number; s: number; d: number; vx: number; vy: number};

export const F = 1250; // focal length in px (~75° vertical FOV)

export const project = (cam: Cam, p: V3): Proj => {
  const f = cam.f ?? F;
  let dx = p[0] - cam.pos[0];
  let dy = p[1] - cam.pos[1];
  let dz = p[2] - cam.pos[2];
  const yw = cam.yaw ?? 0, pt = cam.pitch ?? 0, rl = cam.roll ?? 0;
  if (yw) {
    const c = Math.cos(yw), s = Math.sin(yw);
    const x = c * dx - s * dz;
    dz = s * dx + c * dz;
    dx = x;
  }
  if (pt) {
    const c = Math.cos(pt), s = Math.sin(pt);
    const y = c * dy - s * dz;
    dz = s * dy + c * dz;
    dy = y;
  }
  if (rl) {
    const c = Math.cos(rl), s = Math.sin(rl);
    const x = c * dx - s * dy;
    dy = s * dx + c * dy;
    dx = x;
  }
  const d = dz;
  const s = d > 1 ? f / d : f;
  return {x: CX + dx * s, y: CY + dy * s, s, d, vx: dx, vy: dy};
};

/** Opacity factor that hides geometry as it reaches/passes the lens (fly-through). */
export const nearFade = (d: number, near = 60, far = 260) => clamp((d - near) / (far - near));

export const deg = (r: number) => (r * 180) / Math.PI;
export const rad = (d: number) => (d * Math.PI) / 180;

/** Piecewise keyframes for vectors: [[time, value], ...], eased between neighbours. */
export const keysV = (t: number, ks: [number, V3][], e: (x: number) => number = ease.inOut): V3 => {
  if (t <= ks[0][0]) return ks[0][1];
  for (let i = 0; i < ks.length - 1; i++) {
    const [a, va] = ks[i];
    const [b, vb] = ks[i + 1];
    if (t <= b) return mix3(va, vb, e(clamp((t - a) / (b - a))));
  }
  return ks[ks.length - 1][1];
};
