import React from 'react';
import {COLORS, WORLD} from '../data';
import {CameraState} from '../lib/camera';
import {rand} from '../lib/math';
import {viewWindow, WindowSvg} from './WindowSvg';

// Slow layer (parallax 0.4): soft pearl / champagne light pools, hairline orbits, faint route arcs.
// Coordinates live in the background's own space (y ≈ 2000 … 8400).
const blobs = Array.from({length: 14}, (_, i) => ({
  x: -200 + rand(i + 1) * 1480,
  y: 2000 + i * 460 + rand(i + 40) * 200,
  r: 380 + rand(i + 80) * 360,
  kind: i % 3,
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
  return (
    <WindowSvg win={win}>
      <defs>
        <radialGradient id="bg-w">
          <stop offset="0" stopColor={COLORS.white} stopOpacity={0.95} />
          <stop offset="1" stopColor={COLORS.white} stopOpacity={0} />
        </radialGradient>
        <radialGradient id="bg-g">
          <stop offset="0" stopColor={COLORS.warmGrey} stopOpacity={0.85} />
          <stop offset="1" stopColor={COLORS.warmGrey} stopOpacity={0} />
        </radialGradient>
        <radialGradient id="bg-c">
          <stop offset="0" stopColor={COLORS.champagne} stopOpacity={0.42} />
          <stop offset="1" stopColor={COLORS.champagne} stopOpacity={0} />
        </radialGradient>
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
