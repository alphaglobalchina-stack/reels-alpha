import {smoothPath} from './anim';

export type LL = [number, number]; // [lon, lat]

// Very rough, deliberately minimal outlines (lon, lat) — enough for a dotted motif.
export const CHINA: LL[] = [
  [73.5, 39.5], [75, 37], [78.5, 35.5], [79, 32.5], [81, 30], [84, 28.5], [88, 27.8], [92, 27.8], [96, 28.3], [98.7, 27.5],
  [98.5, 24.5], [99, 22.5], [101.5, 21.3], [102.5, 22.5], [105.5, 23.2], [106.7, 22], [108, 21.5], [109.7, 21.3], [110.5, 20.4],
  [111, 21.5], [113, 22], [114.2, 22.3], [116.5, 23], [119, 25], [120, 26.5], [121.5, 28.5], [122, 30.5], [121.5, 31.5],
  [120.8, 32.6], [119.5, 34.5], [120.5, 36.5], [122.5, 37.2], [119, 37.5], [118, 38.5], [117.7, 39], [119.5, 39.8], [121.5, 40.8],
  [121.5, 39], [124, 40], [126, 41], [128, 42], [130.5, 42.5], [131, 44], [133, 45], [134.5, 48.3], [132.5, 47.5], [130.8, 48.5],
  [127.5, 49.8], [125.5, 53], [122.5, 53.4], [120, 52.5], [118.5, 50], [116.5, 49.8], [115.5, 47.8], [112, 45.2], [111, 43.5],
  [105, 41.8], [100, 42.5], [97, 42.7], [95.5, 44.5], [91, 45.2], [90.5, 47.5], [87.5, 49.2], [85.5, 47.2], [83, 47], [82.5, 45],
  [80.5, 45], [80.2, 42.8], [78, 41.2], [75.5, 40.5],
];
export const HAINAN: LL[] = [[108.7, 19.2], [110.5, 20], [111, 19.4], [110, 18.2], [108.7, 18.6]];
export const ARABIA: LL[] = [
  [34.9, 29.5], [36.5, 26], [39, 22], [41, 19], [42.7, 16], [43.2, 13], [45, 12.8], [48, 14], [52, 16], [55, 17.2], [57.5, 19.5],
  [59.8, 22.4], [58.5, 23.7], [56.4, 26.2], [55.5, 25.2], [54, 24.2], [51.6, 24.5], [51.3, 25.9], [50.8, 24.8], [50.2, 26.5],
  [49.5, 27.5], [48.5, 29.9], [47, 29], [44, 29.2], [39, 32], [36, 32],
];
export const INDIA: LL[] = [
  [66.5, 25.3], [68, 23.8], [70, 21], [72.8, 19.5], [73.5, 16], [75, 12.5], [76.5, 9.5], [77.5, 8.1], [79.2, 9.2], [80.2, 12.5],
  [80, 15.5], [82, 17], [85, 19.5], [87, 21.5], [89, 22], [91, 23], [92, 26], [88, 27.5], [84, 28.5], [81, 30.5], [79, 32.5],
  [75, 34], [74, 36.5], [71.5, 37], [71, 34], [69, 31], [66, 29.5], [63, 29.5], [61, 29.8], [62, 26],
];
export const INDOCHINA: LL[] = [
  [98.5, 23], [99, 20], [97.5, 17], [98.3, 15], [98.5, 12], [99.2, 9], [100.2, 6.5], [101.5, 3], [103.5, 1.5], [104.2, 1.4],
  [103.5, 3], [102.5, 5.5], [101, 6.8], [100.4, 9.5], [99.5, 11], [100, 13], [102, 12.3], [103, 10.5], [105, 8.7], [106.5, 10],
  [107.5, 11], [109.3, 12], [109.2, 14], [108.2, 16.2], [106.5, 18.3], [105.8, 19.8], [106.7, 22], [105.5, 23.2], [102.5, 22.5],
  [101.5, 21.3], [99, 22.5],
];

export const GUANGZHOU: LL = [113.3, 23.1];
export const GULF: LL = [53.5, 25.6];

// Sea route Guangzhou → Strait of Malacca → south of India → Strait of Hormuz → Gulf.
export const SEA_ROUTE: LL[] = [
  [113.6, 22.4], [112.4, 18], [110, 13], [107, 8.5], [105.2, 4.5], [104.6, 1.0], [101.6, 2.2], [98, 5.6], [93, 6.2], [87, 6],
  [81.5, 5.2], [77.5, 6.2], [72.5, 8.5], [66.5, 13], [61.5, 19], [59, 23.5], [57.1, 26.2], [55, 26.8], [53.5, 26.6],
];

export const pointInPoly = (x: number, y: number, poly: LL[]) => {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};

export type Projection = (p: LL) => [number, number];


/** Equirectangular projection into a box whose top-left is lon0/lat1. */
export const project = (lon0: number, lat1: number, sx: number, sy: number): Projection => ([lon, lat]) => [(lon - lon0) * sx, (lat1 - lat) * sy];

/** One SVG path made of dots: "M x y h0" with a round linecap = a dot per move. */
export const dotsPath = (poly: LL[], proj: Projection, step: number, skip: LL[][] = []) => {
  let minX = 999, maxX = -999, minY = 999, maxY = -999;
  poly.forEach(([x, y]) => {
    minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  });
  let d = '';
  let row = 0;
  for (let y = Math.floor(minY / step) * step; y <= maxY; y += step, row++) {
    const off = row % 2 ? step / 2 : 0; // staggered grid
    for (let x = Math.floor(minX / step) * step + off; x <= maxX; x += step) {
      if (!pointInPoly(x, y, poly)) continue;
      if (skip.some((s) => pointInPoly(x, y, s))) continue;
      const [px, py] = proj([x, y]);
      d += `M${px.toFixed(1)} ${py.toFixed(1)}h0.01`;
    }
  }
  return d;
};

export const outlinePath = (poly: LL[], proj: Projection) => smoothPath(poly.map(proj), 0.5, true);
