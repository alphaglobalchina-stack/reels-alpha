import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ATMOSPHERE, COLORS, VIDEO, WORLD} from '../data';
import {cameraAt, CameraState} from '../lib/camera';
import {clamp, easeOutCubic, lerp, rand, smoothstep} from '../lib/math';

// Living background, screen space:
//   MeshGradient — huge pastel blobs over the pearl base (palette cross-fades by frame)
//   LightRays    — 3 soft diagonal shafts of warm light sweeping slowly across
//   LensGlints   — anamorphic streak + star + ghosts when the camera lands on a station
// Plus the shared palette helpers used by Background / Foreground bokeh.

export type RGB = [number, number, number];

const TAU = Math.PI * 2;

const hex = (h: string): RGB => {
  const v = parseInt(h.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
};

const PEARL = hex(COLORS.pearl);

/** No green, ever: the green channel never exceeds max(red, blue), so the hue stays outside 60°–180°. */
export const noGreen = ([r, g, b]: RGB): RGB => [r, Math.min(g, Math.max(r, b) - 1), b];

export const rgba = (c: RGB, a: number) =>
  `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${clamp(a).toFixed(3)})`;

/** Push a pastel further away from pearl (k > 1) so a faint disc still reads on the light base. */
export const deepen = (c: RGB, k: number): RGB =>
  noGreen([0, 1, 2].map((i) => clamp(PEARL[i] + (c[i] - PEARL[i]) * k, 0, 255)) as RGB);

// The palettes differ a lot in strength (pale sky ≈ 40 RGB units away from pearl, champagne gold ≈ 83),
// so the sky section looked paler and the gold one creamier. Pull every colour 60 % of the way towards
// one common distance from pearl: same hues, even "life" across the reel, gold stays calm.
const CHROMA_TARGET = ATMOSPHERE.chromaTarget;
const equalize = (c: RGB, target = CHROMA_TARGET): RGB => {
  const m = Math.hypot(c[0] - PEARL[0], c[1] - PEARL[1], c[2] - PEARL[2]);
  return m < 1 ? c : deepen(c, lerp(1, target / m, 0.6));
};

type PaletteName = keyof typeof ATMOSPHERE.palettes;
const PALETTES = Object.fromEntries(
  (Object.keys(ATMOSPHERE.palettes) as PaletteName[]).map((k) => [k, ATMOSPHERE.palettes[k].map((h) => equalize(hex(h)))]),
) as Record<PaletteName, RGB[]>;

/** Which two palettes are mixed at a frame, and how far (smoothstep between ATMOSPHERE.keys). */
const paletteMix = (frame: number): {a: PaletteName; b: PaletteName; t: number} => {
  const keys = ATMOSPHERE.keys;
  let a = keys[0];
  let b = keys[0];
  if (frame >= keys[keys.length - 1][0]) {
    a = b = keys[keys.length - 1];
  } else if (frame > keys[0][0]) {
    for (let i = 0; i < keys.length - 1; i++) {
      if (frame <= keys[i + 1][0]) {
        a = keys[i];
        b = keys[i + 1];
        break;
      }
    }
  }
  return {a: a[1], b: b[1], t: a === b ? 0 : smoothstep(a[0], b[0], frame)};
};

const mixRGB = (c: RGB, d: RGB, t: number): RGB => noGreen([lerp(c[0], d[0], t), lerp(c[1], d[1], t), lerp(c[2], d[2], t)]);

/** The 4 pastel colours at a frame: smoothstep cross-fade (RGB) between ATMOSPHERE.keys. */
export const paletteAt = (frame: number): RGB[] => {
  const {a, b, t} = paletteMix(frame);
  const pb = PALETTES[b];
  return PALETTES[a].map((c, i) => mixRGB(c, pb[i], t));
};

// ───────────────────────────── mesh gradient ─────────────────────────────
// Palette slot per blob. In the "sky" palette slots 0 / 3 are pale blue, 1 lavender, 2 peach, and
// no palette ever puts a yellow next to a blue in the same slot set, so overlaps never mix to green.
// Pale blue and peach are near-complementary: the big peach blob (index 2) sits between the blue
// blobs and cancelled them to a flat grey. In "sky" that blob takes lavender instead (it also
// cross-fades lavender blush → lavender from the warm palette, never through grey).
const SLOT_OVERRIDE: Partial<Record<PaletteName, Record<number, number>>> = ATMOSPHERE.slotOverride;
// Cool pastels over the warm pearl base read much greyer than warm ones at the same distance, so the
// mesh blobs (only) get a little more chroma in "sky".
const MESH_CHROMA: Partial<Record<PaletteName, number>> = ATMOSPHERE.meshChroma;
const MESH_PALETTES = Object.fromEntries(
  (Object.keys(ATMOSPHERE.palettes) as PaletteName[]).map((k) => [k, ATMOSPHERE.palettes[k].map((h) => equalize(hex(h), MESH_CHROMA[k]))]),
) as Record<PaletteName, RGB[]>;
const BLOBS = [
  {x: 150, y: 250, r: 780, c: 0, o: 1.0},
  {x: 990, y: 560, r: 700, c: 1, o: 0.95},
  {x: 250, y: 1030, r: 900, c: 2, o: 1.0},
  {x: 910, y: 1360, r: 760, c: 3, o: 0.95},
  {x: 180, y: 1770, r: 720, c: 1, o: 0.9},
  {x: 760, y: 1990, r: 920, c: 0, o: 1.0},
].map((b, i) => ({
  ...b,
  // Lissajous drift, periods 6–14 s
  ax: 95 + rand(i + 11) * 70,
  ay: 90 + rand(i + 21) * 70,
  px: 6 + rand(i + 31) * 8,
  py: 6 + rand(i + 41) * 8,
  ps: 7 + rand(i + 51) * 6,
  phx: rand(i + 61) * TAU,
  phy: rand(i + 71) * TAU,
  depth: 0.022 + rand(i + 81) * 0.014, // camera-linked offset factor (feels like a far plane)
}));

/** Colour of one mesh blob at a frame (palette cross-fade with the per-palette slot overrides). */
const blobColor = (frame: number, blob: number, slot: number): RGB => {
  const {a, b, t} = paletteMix(frame);
  const ca = MESH_PALETTES[a][SLOT_OVERRIDE[a]?.[blob] ?? slot];
  const cb = MESH_PALETTES[b][SLOT_OVERRIDE[b]?.[blob] ?? slot];
  return mixRGB(ca, cb, t);
};

export const MeshGradient: React.FC<{frame: number; cam: CameraState}> = ({frame, cam}) => {
  const t = frame / VIDEO.fps;
  const camDx = -(cam.x - 540);
  const camDy = -(cam.y - WORLD.parallaxRef); // ±4500 world px → ±100–160 px on screen
  const zk = 1 + (cam.zoom - 1) * 0.25;
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      {BLOBS.map((b, i) => {
        const x = 540 + (b.x - 540 + b.ax * Math.sin((TAU * t) / b.px + b.phx) + camDx * b.depth) * zk;
        const y = 960 + (b.y - 960 + b.ay * Math.sin((TAU * t) / b.py + b.phy) + camDy * b.depth) * zk;
        const r = b.r * zk * (1 + 0.06 * Math.sin((TAU * t) / b.ps + b.phy));
        const c = blobColor(frame, i, b.c);
        const a = ATMOSPHERE.blobOpacity * b.o;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x - r,
              top: y - r,
              width: 2 * r,
              height: 2 * r,
              background: `radial-gradient(circle closest-side, ${rgba(c, a)} 0%, ${rgba(c, a * 0.86)} 24%, ${rgba(c, a * 0.52)} 50%, ${rgba(c, a * 0.2)} 74%, ${rgba(c, 0)} 100%)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ───────────────────────────── light rays ─────────────────────────────
const RAY = hex(ATMOSPHERE.rayColor);
// warm shoulder tint
const CHAMP: RGB = hex(COLORS.rayTint);
// A normal-blend warm white adds only ~4 luminance levels on the pearl base (lost in H.264). So each
// shaft also gets faint warm-shadow edges (reads by contrast) and a narrow additive core
// ('plus-lighter'): ≈ +4…7 levels core vs. surroundings, ≈ −2…−4 on the edges (stays under +10).
const RAY_SHADE: RGB = hex(COLORS.rayShade);
const RAY_SHADE_OPACITY = ATMOSPHERE.rayShadeOpacity;
const RAY_CORE_OPACITY = ATMOSPHERE.rayCoreOpacity;
const RAYS = [
  {w: 240, angle: 30, period: 7.8, phase: 0.1, o: 1.0},
  {w: 170, angle: 33, period: 8.8, phase: 0.48, o: 0.75},
  {w: 280, angle: 27, period: 6.6, phase: 0.8, o: 0.6},
];

export const LightRays: React.FC<{frame: number; cam: CameraState}> = ({frame, cam}) => {
  const t = frame / VIDEO.fps;
  const H = 2600;
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      {RAYS.map((r, i) => {
        const u = (t / r.period + r.phase) % 1;
        const ang = r.angle + cam.roll * 0.5;
        const rad = (ang * Math.PI) / 180;
        // horizontal half-reach of the slanted band across the full frame height
        const reach = 960 * Math.tan(rad) + r.w / 2 / Math.cos(rad) + 40;
        const x0 = -reach + u * (1080 + 2 * reach);
        const env = Math.pow(Math.sin(Math.PI * u), 0.6);
        const a = ATMOSPHERE.rayOpacity * r.o * env;
        if (a < 0.004) return null;
        const k = r.o * env;
        const sh = RAY_SHADE_OPACITY * k;
        const core = RAY_CORE_OPACITY * k;
        const box: React.CSSProperties = {position: 'absolute', top: 960 - H / 2, height: H, transform: `rotate(${ang.toFixed(3)}deg)`};
        return (
          <React.Fragment key={i}>
            <div
              style={{
                ...box,
                left: x0 - r.w / 2,
                width: r.w,
                background: `linear-gradient(90deg, ${rgba(RAY_SHADE, 0)} 0%, ${rgba(RAY_SHADE, sh)} 6%, ${rgba(RAY_SHADE, sh * 0.5)} 12%, ${rgba(CHAMP, a * 0.5)} 21%, ${rgba(CHAMP, a * 0.9)} 33%, ${rgba(RAY, a)} 50%, ${rgba(CHAMP, a * 0.9)} 67%, ${rgba(CHAMP, a * 0.5)} 79%, ${rgba(RAY_SHADE, sh * 0.5)} 88%, ${rgba(RAY_SHADE, sh)} 94%, ${rgba(RAY_SHADE, 0)} 100%)`,
              }}
            />
            <div
              style={{
                ...box,
                left: x0 - r.w * 0.25,
                width: r.w * 0.5,
                mixBlendMode: 'plus-lighter',
                background: `linear-gradient(90deg, ${rgba(RAY, 0)} 0%, ${rgba(RAY, core * 0.6)} 28%, ${rgba(RAY, core)} 50%, ${rgba(RAY, core * 0.6)} 72%, ${rgba(RAY, 0)} 100%)`,
              }}
            />
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};

// ───────────────────────────── lens glints ─────────────────────────────
const GLINT_LEN = 16; // frames
const GLINT_LEAD = 2; // starts 2 frames before the landing frame, peaks ~1 frame after it
// Screen position of the glint source at its landing frame: upper band (y 260–700), off the main copy.
const GLINT_SPOT: Record<number, [number, number]> = ATMOSPHERE.glintSpots;

// k = position along source → frame centre (0 = source, 1 = centre). Ghosts that would fall on the central
// copy zone are faded to ~20 % (see periph) so they never smudge text or the dark price disc.
const GHOSTS = [
  {k: -0.32, size: 18, hex: false, color: hex('#E3CC98'), o: 0.18},
  {k: 0.3, size: 34, hex: true, color: hex('#F1C7AE'), o: 0.2},
  {k: 1.65, size: 64, hex: false, color: hex('#D8CCF0'), o: 0.16},
  {k: 2.45, size: 100, hex: true, color: hex('#E8D3A4'), o: 0.13},
];
const periph = (x: number, y: number) => 0.2 + 0.8 * smoothstep(330, 560, Math.hypot(x - 540, (y - 930) * 0.72));

const hexPts = (cx: number, cy: number, r: number, rot: number) =>
  Array.from({length: 6}, (_, i) => {
    const a = rot + (i * Math.PI) / 3;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(' ');

const starPath = (n: number, long: number, short: number, inner: number) => {
  const pts: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / n;
    const tip = i % 2 === 0 ? ((i / 2) % 2 === 0 ? long : short) : inner;
    pts.push(`${(tip * Math.cos(a)).toFixed(2)},${(tip * Math.sin(a)).toFixed(2)}`);
  }
  return `M${pts.join(' L')} Z`;
};
const STAR6 = starPath(6, 64, 30, 2.6);
const STAR4 = starPath(4, 40, 40, 2.2);

export const LensGlints: React.FC<{frame: number; cam: CameraState}> = ({frame, cam}) => {
  const g = ATMOSPHERE.glints.find((f) => frame >= f - GLINT_LEAD && frame <= f - GLINT_LEAD + GLINT_LEN);
  if (g === undefined) return null;
  const t = frame - (g - GLINT_LEAD);
  const env = t < 3 ? easeOutCubic(t / 3) : 1 - smoothstep(3, GLINT_LEN, t);
  if (env < 0.003) return null;
  const prog = t / GLINT_LEN;
  // the light source is attached to the world: it slides with the camera's residual drift
  const c0 = cameraAt(g);
  const [bx, by] = GLINT_SPOT[g] ?? [760, 330];
  const sx = bx - (cam.x - c0.x) * cam.zoom;
  const sy = by - (cam.y - c0.y) * cam.zoom;
  const L = 720 * (0.8 + 0.3 * prog); // anamorphic streak stretches as it fades
  const dx = 540 - sx;
  const dy = 960 - sy;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <svg width={VIDEO.width} height={VIDEO.height} style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
        <defs>
          <radialGradient id="gl-halo">
            <stop offset="0" stopColor={COLORS.champagneLight} stopOpacity={1} />
            <stop offset="0.3" stopColor={COLORS.champagne} stopOpacity={0.6} />
            <stop offset="1" stopColor={COLORS.champagne} stopOpacity={0} />
          </radialGradient>
          <radialGradient id="gl-core">
            <stop offset="0" stopColor="#FFFFFF" stopOpacity={1} />
            <stop offset="0.45" stopColor={ATMOSPHERE.rayColor} stopOpacity={0.9} />
            <stop offset="1" stopColor={COLORS.champagne} stopOpacity={0} />
          </radialGradient>
          <radialGradient id="gl-glow">
            <stop offset="0" stopColor="#FFFFFF" stopOpacity={1} />
            <stop offset="0.35" stopColor={COLORS.champagneLight} stopOpacity={0.75} />
            <stop offset="1" stopColor={COLORS.champagne} stopOpacity={0} />
          </radialGradient>
          {GHOSTS.map((gh, i) => (
            <radialGradient key={i} id={`gl-ghost-${i}`}>
              <stop offset="0" stopColor={rgba(gh.color, 1)} stopOpacity={0.18} />
              <stop offset="0.62" stopColor={rgba(gh.color, 1)} stopOpacity={0.42} />
              <stop offset="0.88" stopColor={rgba(gh.color, 1)} stopOpacity={1} />
              <stop offset="1" stopColor={rgba(gh.color, 1)} stopOpacity={0} />
            </radialGradient>
          ))}
        </defs>
        {/* ghosts along the line source → frame centre */}
        {GHOSTS.map((gh, i) => {
          const gx = sx + dx * gh.k;
          const gy = sy + dy * gh.k;
          const s = gh.size * (0.85 + 0.25 * prog);
          const o = gh.o * env * periph(gx, gy);
          return gh.hex ? (
            <polygon key={i} points={hexPts(gx, gy, s, 0.26 + prog * 0.15)} fill={`url(#gl-ghost-${i})`} opacity={o} />
          ) : (
            <circle key={i} cx={gx} cy={gy} r={s} fill={`url(#gl-ghost-${i})`} opacity={o} />
          );
        })}
        {/* anamorphic horizontal streak: wide warm halo + thin bright core */}
        <ellipse cx={sx} cy={sy} rx={L / 2} ry={30} fill="url(#gl-halo)" opacity={0.42 * env} />
        <ellipse cx={sx} cy={sy} rx={(L / 2) * 0.92} ry={3.4} fill="url(#gl-core)" opacity={0.5 * env} />
        {/* tiny star burst at the source */}
        <circle cx={sx} cy={sy} r={44 + 14 * prog} fill="url(#gl-glow)" opacity={0.7 * env} />
        <g transform={`translate(${sx.toFixed(1)} ${sy.toFixed(1)}) rotate(${(frame * 1.6).toFixed(1)}) scale(${(0.7 + 0.35 * env).toFixed(3)})`}>
          <path d={STAR6} fill={COLORS.champagne} opacity={0.55 * env} transform="scale(1.25)" />
          <path d={STAR6} fill="#FFFFFF" opacity={0.95 * env} />
          <path d={STAR4} fill="#FFFFFF" opacity={0.6 * env} transform="rotate(45) scale(0.7)" />
        </g>
      </svg>
    </AbsoluteFill>
  );
};
