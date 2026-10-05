import React from 'react';
import {COLORS, WORLD} from '../data';
import {CameraState} from '../lib/camera';
import {rand} from '../lib/math';
import {deepen, paletteAt, rgba} from './Atmosphere';
import {viewWindow, WindowSvg} from './WindowSvg';

// Slow layer (parallax 0.4): soft light pools, large soft palette-tinted bokeh (BACK depth),
// hairline orbits, faint dots. Coordinates live in the background's own space (y ≈ 2000 … 8400).
const blobs = Array.from({length: 14}, (_, i) => ({
  x: -200 + rand(i + 1) * 1480,
  y: 2000 + i * 460 + rand(i + 40) * 200,
  r: 380 + rand(i + 80) * 360,
  kind: i % 3,
}));

// BACK bokeh: 22 big soft discs spread over the range the background actually scrolls through
const bokeh = Array.from({length: 22}, (_, i) => ({
  x: -40 + rand(i + 5100) * 1160,
  y: 2150 + (i / 22) * 5700 + rand(i + 5200) * 260,
  r: 40 + rand(i + 5300) * 80,
  o: 0.08 + rand(i + 5400) * 0.14,
  c: (i * 3) % 4,
  ph: rand(i + 5500) * 6.28,
  px: 7 + rand(i + 5600) * 6, // drift periods, s
  py: 8 + rand(i + 5700) * 6,
  amp: 18 + rand(i + 5800) * 22,
}));

const rings = Array.from({length: 7}, (_, i) => ({
  x: rand(i + 200) > 0.5 ? 1180 + rand(i + 9) * 200 : -100 - rand(i + 19) * 200,
  y: 2300 + i * 900 + rand(i + 300) * 300,
  r: 520 + rand(i + 400) * 420,
  dashed: i % 2 === 0,
}));

const dots = Array.from({length: 90}, (_, i) => ({
  x: -300 + rand(i + 900) * 1680,
  y: 1900 + rand(i + 1900) * 6600,
  r: 1.6 + rand(i + 2900) * 2.2,
}));

export const Background: React.FC<{frame: number; cam: CameraState}> = ({frame, cam}) => {
  const breathe = Math.sin(frame / 70) * 18;
  const p = WORLD.bgParallax;
  const win = viewWindow(540 + (cam.x - 540) * p, WORLD.parallaxRef + (cam.y - WORLD.parallaxRef) * p, 1 + (cam.zoom - 1) * p, 420);
  const near = (y: number, r: number) => y + r > win.y && y - r < win.y + win.h;
  const pal = paletteAt(frame);
  const tints = pal.map((c) => deepen(c, 2.0));
  const t = frame / 30;
  return (
    <WindowSvg win={win}>
      <defs>
        {/* light pools stay translucent so the pastel mesh underneath keeps showing through */}
        <radialGradient id="bg-w">
          <stop offset="0" stopColor={COLORS.white} stopOpacity={0.5} />
          <stop offset="1" stopColor={COLORS.white} stopOpacity={0} />
        </radialGradient>
        <radialGradient id="bg-g">
          <stop offset="0" stopColor={rgba(pal[1], 1)} stopOpacity={0.5} />
          <stop offset="1" stopColor={rgba(pal[1], 1)} stopOpacity={0} />
        </radialGradient>
        <radialGradient id="bg-c">
          <stop offset="0" stopColor={COLORS.champagne} stopOpacity={0.42} />
          <stop offset="1" stopColor={COLORS.champagne} stopOpacity={0} />
        </radialGradient>
        {tints.map((c, i) => (
          <radialGradient key={i} id={`bg-bk-${i}`}>
            <stop offset="0" stopColor={rgba(c, 1)} stopOpacity={1} />
            <stop offset="0.55" stopColor={rgba(c, 1)} stopOpacity={0.88} />
            <stop offset="0.82" stopColor={rgba(c, 1)} stopOpacity={0.45} />
            <stop offset="1" stopColor={rgba(c, 1)} stopOpacity={0} />
          </radialGradient>
        ))}
      </defs>
      {blobs.map((b, i) =>
        near(b.y, b.r + 40) ? (
          <circle
            key={i}
            cx={b.x + Math.sin(frame / 90 + i) * 14}
            cy={b.y + breathe * (i % 2 ? 1 : -1)}
            r={b.r}
            fill={`url(#bg-${['w', 'g', 'c'][b.kind]})`}
          />
        ) : null,
      )}
      {bokeh.map((b, i) =>
        near(b.y, b.r + b.amp + 10) ? (
          <circle
            key={`bk${i}`}
            cx={(b.x + Math.sin((t * 6.283) / b.px + b.ph) * b.amp).toFixed(1)}
            cy={(b.y + Math.cos((t * 6.283) / b.py + b.ph * 1.7) * b.amp).toFixed(1)}
            r={(b.r * (1 + 0.05 * Math.sin(t * 0.9 + b.ph))).toFixed(1)}
            fill={`url(#bg-bk-${b.c})`}
            opacity={(b.o * (0.85 + 0.15 * Math.sin(t * 1.3 + b.ph * 2))).toFixed(3)}
          />
        ) : null,
      )}
      {rings.filter((r) => near(r.y, r.r + 10)).map((r, i) => (
        <circle
          key={i}
          cx={r.x}
          cy={r.y}
          r={r.r}
          fill="none"
          stroke={COLORS.champagneDeep}
          strokeOpacity={0.22}
          strokeWidth={1.4}
          strokeDasharray={r.dashed ? '2 14' : undefined}
          strokeLinecap="round"
        />
      ))}
      {dots.filter((d) => near(d.y, 10)).map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={COLORS.champagneDeep} opacity={0.16} />
      ))}
    </WindowSvg>
  );
};
