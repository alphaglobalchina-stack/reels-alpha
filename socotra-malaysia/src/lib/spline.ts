export type Pt = {x: number; y: number};

export type Curve = {
  xs: Float64Array;
  ys: Float64Array;
  s: Float64Array; // cumulative arc length per sample
  length: number;
  controlS: number[]; // arc length at each control point
  d: string; // SVG path
  pointAt: (s: number) => Pt;
  angleAt: (s: number) => number; // radians, direction of travel
};

/** Centripetal Catmull-Rom (alpha 0.5) through all points, sampled every ~step px. */
export const catmullRom = (points: Pt[], step = 4, alpha = 0.5): Curve => {
  const n = points.length;
  const first = points[0];
  const last = points[n - 1];
  const ext: Pt[] = [
    {x: 2 * first.x - points[1].x, y: 2 * first.y - points[1].y},
    ...points,
    {x: 2 * last.x - points[n - 2].x, y: 2 * last.y - points[n - 2].y},
  ];
  const dist = (a: Pt, b: Pt) => Math.max(1e-4, Math.hypot(b.x - a.x, b.y - a.y));
  const X: number[] = [];
  const Y: number[] = [];
  const controlIdx: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const [p0, p1, p2, p3] = [ext[i], ext[i + 1], ext[i + 2], ext[i + 3]];
    const t0 = 0;
    const t1 = t0 + Math.pow(dist(p0, p1), alpha);
    const t2 = t1 + Math.pow(dist(p1, p2), alpha);
    const t3 = t2 + Math.pow(dist(p2, p3), alpha);
    const m = Math.max(2, Math.ceil(dist(p1, p2) / step));
    controlIdx.push(X.length);
    for (let j = 0; j < m; j++) {
      const t = t1 + ((t2 - t1) * j) / m;
      const mix = (a: Pt, b: Pt, ta: number, tb: number): Pt => {
        const w = (t - ta) / (tb - ta);
        return {x: a.x + (b.x - a.x) * w, y: a.y + (b.y - a.y) * w};
      };
      const A1 = mix(p0, p1, t0, t1);
      const A2 = mix(p1, p2, t1, t2);
      const A3 = mix(p2, p3, t2, t3);
      const B1 = mix(A1, A2, t0, t2);
      const B2 = mix(A2, A3, t1, t3);
      const C = mix(B1, B2, t1, t2);
      X.push(C.x);
      Y.push(C.y);
    }
  }
  controlIdx.push(X.length);
  X.push(last.x);
  Y.push(last.y);

  const xs = Float64Array.from(X);
  const ys = Float64Array.from(Y);
  const s = new Float64Array(xs.length);
  for (let i = 1; i < xs.length; i++) s[i] = s[i - 1] + Math.hypot(xs[i] - xs[i - 1], ys[i] - ys[i - 1]);
  const length = s[s.length - 1];

  const locate = (q: number) => {
    const v = Math.min(length, Math.max(0, q));
    let lo = 0;
    let hi = s.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (s[mid] <= v) lo = mid;
      else hi = mid;
    }
    const span = s[hi] - s[lo] || 1;
    return {i: lo, w: (v - s[lo]) / span};
  };
  const pointAt = (q: number): Pt => {
    const {i, w} = locate(q);
    const j = Math.min(i + 1, xs.length - 1);
    return {x: xs[i] + (xs[j] - xs[i]) * w, y: ys[i] + (ys[j] - ys[i]) * w};
  };
  const angleAt = (q: number) => {
    const a = pointAt(q - 6);
    const b = pointAt(q + 6);
    return Math.atan2(b.y - a.y, b.x - a.x);
  };
  let d = `M${xs[0].toFixed(1)} ${ys[0].toFixed(1)}`;
  for (let i = 1; i < xs.length; i++) d += `L${xs[i].toFixed(1)} ${ys[i].toFixed(1)}`;
  return {xs, ys, s, length, controlS: controlIdx.map((i) => s[i]), d, pointAt, angleAt};
};
