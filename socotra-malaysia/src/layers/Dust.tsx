import React from 'react';
import {COLORS, VIDEO, WORLD} from '../data';
import {CameraState} from '../lib/camera';
import {rand} from '../lib/math';
import {viewWindow, WindowSvg} from './WindowSvg';

// Mid depth (world layer, parallax 1.0): tiny SHARP champagne / gold specks floating in the air
// between the thread and the stations. Spread over the whole world height, windowed to the view.
const TINTS = [COLORS.champagneDeep, COLORS.gold, '#D6BC86', COLORS.threadCore];
const N = 600;

const sparkle = (x: number, y: number, s: number) => {
  const w = s * 0.16;
  return `M${x} ${y - s} L${x + w} ${y - w} L${x + s} ${y} L${x + w} ${y + w} L${x} ${y + s} L${x - w} ${y + w} L${x - s} ${y} L${x - w} ${y - w} Z`;
};

const SPECKS = Array.from({length: N}, (_, i) => {
  const s = 7000 + i * 13;
  const size = rand(s + 1);
  return {
    x: -80 + rand(s) * 1240,
    y: -1000 + rand(s + 2) * (WORLD.height + 1500),
    r: 1.2 + size * size * 1.8, // 1.2 – 3 px, mostly small
    o: 0.35 + rand(s + 3) * 0.4, // 0.35 – 0.75
    c: TINTS[Math.floor(rand(s + 4) * TINTS.length)],
    ph: rand(s + 5) * Math.PI * 2,
    sp: 0.35 + rand(s + 6) * 0.55, // rad / s
    amp: 6 + rand(s + 7) * 12, // px
    rise: 0.1 + rand(s + 8) * 0.28, // slow upward float, px / frame
    tw: 1.4 + rand(s + 9) * 2.6, // twinkle, rad / s
    star: rand(s + 10) < 0.07,
  };
});

export const Dust: React.FC<{frame: number; cam: CameraState}> = ({frame, cam}) => {
  const win = viewWindow(cam.x, cam.y, cam.zoom, 120);
  const t = frame / VIDEO.fps;
  const y0 = win.y - 12;
  const y1 = win.y + win.h + 12;
  return (
    <WindowSvg win={win}>
      {SPECKS.map((p, i) => {
        const y = p.y - p.rise * frame + Math.cos(t * p.sp * 0.8 + p.ph * 1.3) * p.amp;
        if (y < y0 || y > y1) return null;
        const x = p.x + Math.sin(t * p.sp + p.ph) * p.amp;
        const o = p.o * (0.7 + 0.3 * Math.sin(t * p.tw + p.ph * 2));
        return p.star ? (
          <path key={i} d={sparkle(+x.toFixed(1), +y.toFixed(1), p.r * 3.2)} fill={p.c} opacity={o.toFixed(3)} />
        ) : (
          <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r={p.r.toFixed(2)} fill={p.c} opacity={o.toFixed(3)} />
        );
      })}
    </WindowSvg>
  );
};
