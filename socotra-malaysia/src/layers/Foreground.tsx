import React from 'react';
import {COLORS, WORLD} from '../data';
import {CameraState} from '../lib/camera';
import {rand} from '../lib/math';
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

export const Foreground: React.FC<{frame: number; cam: CameraState}> = ({frame, cam}) => {
  const p = WORLD.fgParallax;
  const win = viewWindow(540 + (cam.x - 540) * p, WORLD.parallaxRef + (cam.y - WORLD.parallaxRef) * p, 1 + (cam.zoom - 1) * p, 200);
  return (
  <WindowSvg win={win}>
    <defs>
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
