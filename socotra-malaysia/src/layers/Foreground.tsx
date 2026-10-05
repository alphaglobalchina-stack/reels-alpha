import React from 'react';
import {COLORS, WORLD} from '../data';
import {CameraState} from '../lib/camera';
import {rand} from '../lib/math';
import {deepen, paletteAt, rgba} from './Atmosphere';
import {viewWindow, WindowSvg} from './WindowSvg';

// Fast layer (parallax 1.35): small champagne motes and soft bokeh that drift past the lens.
// Kept mostly to the left/right thirds so they never sit on top of copy.
const motes = Array.from({length: 64}, (_, i) => {
  const side = rand(i + 5) > 0.5;
  const edge = rand(i + 15) * 230;
  const bokeh = i % 4 === 0;
  return {
    x: side ? 1080 - edge : edge,
    y: -1300 + rand(i + 25) * 14000,
    r: bokeh ? 16 + rand(i + 35) * 22 : 2.5 + rand(i + 45) * 5,
    o: bokeh ? 0.22 + rand(i + 55) * 0.14 : 0.45 + rand(i + 65) * 0.35,
    bokeh,
    ph: rand(i + 75) * 6.28,
    sp: 0.6 + rand(i + 85) * 0.8,
  };
});

// FRONT bokeh: big defocused discs right at the lens, only at the left / right edges (never on copy).
// One every ~1400 px of foreground space, so 1–2 are in frame at any time.
const bigBokeh = Array.from({length: 10}, (_, i) => {
  const left = i % 2 === 0 ? rand(i + 7100) > 0.25 : rand(i + 7100) > 0.75;
  return {
    x: left ? rand(i + 7200) * 120 : 960 + rand(i + 7300) * 120,
    y: -1700 + i * 1400 + rand(i + 7400) * 500,
    r: 50 + rand(i + 7500) * 50,
    o: 0.1 + rand(i + 7600) * 0.06, // <= 0.16
    c: i % 4,
    ph: rand(i + 7700) * 6.28,
  };
});

export const Foreground: React.FC<{frame: number; cam: CameraState}> = ({frame, cam}) => {
  const p = WORLD.fgParallax;
  const win = viewWindow(540 + (cam.x - 540) * p, WORLD.parallaxRef + (cam.y - WORLD.parallaxRef) * p, 1 + (cam.zoom - 1) * p, 200);
  const tints = paletteAt(frame).map((c) => deepen(c, 1.6));
  const t = frame / 30;
  return (
  <WindowSvg win={win}>
    <defs>
      {tints.map((c, i) => (
        <radialGradient key={i} id={`fg-big-${i}`}>
          <stop offset="0" stopColor={rgba(c, 1)} stopOpacity={0.55} />
          <stop offset="0.78" stopColor={COLORS.champagne} stopOpacity={0.75} />
          <stop offset="0.92" stopColor={COLORS.champagne} stopOpacity={1} />
          <stop offset="1" stopColor={COLORS.champagne} stopOpacity={0} />
        </radialGradient>
      ))}
      <radialGradient id="fg-bokeh">
        <stop offset="0" stopColor={COLORS.white} stopOpacity={0.9} />
        <stop offset="0.45" stopColor={COLORS.champagne} stopOpacity={0.7} />
        <stop offset="1" stopColor={COLORS.champagne} stopOpacity={0} />
      </radialGradient>
      <radialGradient id="fg-mote">
        <stop offset="0" stopColor={COLORS.white} stopOpacity={1} />
        <stop offset="0.5" stopColor={COLORS.champagne} stopOpacity={0.9} />
        <stop offset="1" stopColor={COLORS.champagneDeep} stopOpacity={0} />
      </radialGradient>
    </defs>
    {bigBokeh.filter((b) => b.y + b.r + 40 > win.y && b.y - b.r - 40 < win.y + win.h).map((b, i) => (
      <circle
        key={`big${i}`}
        cx={(b.x + Math.sin(t * 0.55 + b.ph) * 16).toFixed(1)}
        cy={(b.y + Math.cos(t * 0.42 + b.ph) * 22).toFixed(1)}
        r={(b.r * (1 + 0.06 * Math.sin(t * 0.8 + b.ph))).toFixed(1)}
        fill={`url(#fg-big-${b.c})`}
        opacity={(b.o * (0.8 + 0.2 * Math.sin(t * 1.1 + b.ph))).toFixed(3)}
      />
    ))}
    {motes.filter((m) => m.y + 60 > win.y && m.y - 60 < win.y + win.h).map((m, i) => {
      const t = (frame / 30) * m.sp + m.ph;
      return (
        <circle
          key={i}
          cx={m.x + Math.sin(t) * 14}
          cy={m.y + Math.cos(t * 0.8) * 20}
          r={m.r * (1 + 0.12 * Math.sin(t * 1.7))}
          fill={m.bokeh ? 'url(#fg-bokeh)' : 'url(#fg-mote)'}
          opacity={m.o * (0.75 + 0.25 * Math.sin(t * 2.1))}
        />
      );
    })}
  </WindowSvg>
  );
};
