/**
 * Hand-built vector shapes for Reel 2. Every shape uses only absolute M/L/C/Z
 * commands, so `place()` can move/scale it and MorphSVG can blend any pair.
 */

const f = (n: number) => +n.toFixed(2);

/** Scale then translate every coordinate pair of a path. */
export const place = (d: string, s: number, tx: number, ty: number) => {
  let i = 0;
  return d.replace(/-?\d*\.?\d+(?:e-?\d+)?/g, (n) => String(f(i++ % 2 === 0 ? +n * s + tx : +n * s + ty)));
};

export const poly = (pts: [number, number][]) => `M${pts.map(([x, y]) => `${f(x)} ${f(y)}`).join(' L')} Z`;

const K = 0.5523;
export const circlePath = (cx: number, cy: number, r: number) => {
  const k = r * K;
  return `M${f(cx)} ${f(cy - r)} C${f(cx + k)} ${f(cy - r)} ${f(cx + r)} ${f(cy - k)} ${f(cx + r)} ${f(cy)} C${f(cx + r)} ${f(cy + k)} ${f(cx + k)} ${f(cy + r)} ${f(cx)} ${f(cy + r)} C${f(cx - k)} ${f(cy + r)} ${f(cx - r)} ${f(cy + k)} ${f(cx - r)} ${f(cy)} C${f(cx - r)} ${f(cy - k)} ${f(cx - k)} ${f(cy - r)} ${f(cx)} ${f(cy - r)} Z`;
};

export const rectPath = (x: number, y: number, w: number, h: number, r: number) => {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  const k = r * (1 - K);
  return [
    `M${f(x + r)} ${f(y)}`,
    `L${f(x + w - r)} ${f(y)}`,
    `C${f(x + w - k)} ${f(y)} ${f(x + w)} ${f(y + k)} ${f(x + w)} ${f(y + r)}`,
    `L${f(x + w)} ${f(y + h - r)}`,
    `C${f(x + w)} ${f(y + h - k)} ${f(x + w - k)} ${f(y + h)} ${f(x + w - r)} ${f(y + h)}`,
    `L${f(x + r)} ${f(y + h)}`,
    `C${f(x + k)} ${f(y + h)} ${f(x)} ${f(y + h - k)} ${f(x)} ${f(y + h - r)}`,
    `L${f(x)} ${f(y + r)}`,
    `C${f(x)} ${f(y + k)} ${f(x + k)} ${f(y)} ${f(x + r)} ${f(y)}`,
    'Z',
  ].join(' ');
};

// ── Monoline display numerals (box 200 × 300, drawn as thick round strokes) ────────
export const DIGIT_W = 200;
export const DIGIT_H = 300;
export const DIGITS: Record<string, string> = {
  '0': 'M100 22 C158 22 178 84 178 150 C178 216 158 278 100 278 C42 278 22 216 22 150 C22 84 42 22 100 22 Z',
  '1': 'M56 76 L118 22 L118 278',
  '2': 'M32 86 C40 44 68 22 104 22 C146 22 172 50 172 90 C172 140 118 186 32 278 L178 278',
  '3': 'M34 54 C56 32 80 22 104 22 C146 22 170 46 170 80 C170 118 140 142 96 142 C144 142 176 170 176 212 C176 252 146 278 100 278 C70 278 44 268 24 246',
  '4': 'M146 278 L146 22 L22 196 L186 196',
};

// ── Morphing icon silhouettes (box 400 × 400, filled, evenodd) ──────────────────────
const gear = () => {
  const pts: [number, number][] = [];
  const n = 10;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    const s = (Math.PI * 2) / n;
    const at = (ang: number, r: number): [number, number] => [200 + Math.cos(ang) * r, 200 + Math.sin(ang) * r];
    pts.push(at(a - s * 0.5, 132), at(a - s * 0.27, 136), at(a - s * 0.17, 172), at(a + s * 0.17, 172), at(a + s * 0.27, 136));
  }
  return `${poly(pts)} ${circlePath(200, 200, 56)}`;
};

const chip = () => {
  const a = 116, b = 284, out = 40, w = 9;
  const pins = [150, 183, 217, 250];
  const pts: [number, number][] = [[a, a]];
  pins.forEach((p) => pts.push([p - w, a], [p - w, a - out], [p + w, a - out], [p + w, a]));
  pts.push([b, a]);
  pins.forEach((p) => pts.push([b, p - w], [b + out, p - w], [b + out, p + w], [b, p + w]));
  pts.push([b, b]);
  [...pins].reverse().forEach((p) => pts.push([p + w, b], [p + w, b + out], [p - w, b + out], [p - w, b]));
  pts.push([a, b]);
  [...pins].reverse().forEach((p) => pts.push([a, p + w], [a - out, p + w], [a - out, p - w], [a, p - w]));
  return `${poly(pts)} ${rectPath(158, 158, 84, 84, 10)}`;
};

export const ICONS = {
  gear: gear(),
  chip: chip(),
  bolt: 'M236 28 L104 226 L190 226 L160 372 L298 164 L210 164 L254 28 Z',
  sofa:
    'M40 196 C40 172 56 160 76 160 L92 160 L92 122 C92 100 106 88 128 88 L272 88 C294 88 308 100 308 122 L308 160 L324 160 C344 160 360 172 360 196 L360 292 L334 292 L334 326 L306 326 L306 292 L94 292 L94 326 L66 326 L66 292 L40 292 Z M118 206 L282 206 L282 232 L118 232 Z',
  gift:
    'M64 168 L168 168 C120 158 98 112 128 94 C158 78 190 118 200 160 C210 118 242 78 272 94 C302 112 280 158 232 168 L336 168 L336 232 L314 232 L314 344 L86 344 L86 232 L64 232 Z M188 180 L212 180 L212 344 L188 344 Z',
  vase:
    'M156 46 L244 46 L244 70 L230 82 C230 120 324 150 324 242 C324 312 272 352 200 352 C128 352 76 312 76 242 C76 150 170 120 170 82 L156 70 Z M92 222 L308 222 L306 244 L94 244 Z',
  shirt: 'M138 58 L172 58 C180 86 220 86 228 58 L262 58 L354 112 L322 186 L286 170 L286 348 L114 348 L114 170 L78 186 L46 112 Z',
  apple:
    'M200 124 C232 98 302 98 322 164 C342 234 300 334 250 344 C226 348 216 334 200 334 C184 334 174 348 150 344 C100 334 58 234 78 164 C98 98 168 98 200 124 Z M206 112 C200 70 230 44 268 44 C268 86 242 112 206 112 Z',
  heart:
    'M200 344 C120 284 48 232 48 160 C48 108 88 74 134 74 C164 74 190 92 200 116 C210 92 236 74 266 74 C312 74 352 108 352 160 C352 232 280 284 200 344 Z',
  square: rectPath(50, 50, 300, 300, 26),
};

export const ICON_SEQ: string[] = [
  ICONS.gear, ICONS.chip, ICONS.bolt,
  ICONS.sofa, ICONS.gift, ICONS.vase,
  ICONS.shirt, ICONS.apple, ICONS.heart,
];
