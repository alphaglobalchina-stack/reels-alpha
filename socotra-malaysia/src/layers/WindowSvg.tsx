import React from 'react';

export type Win = {x: number; y: number; w: number; h: number};

/** Visible world window (with margin for roll / tilt) around a camera centre. */
export const viewWindow = (cx: number, cy: number, zoom: number, margin = 260): Win => {
  const hw = 540 / zoom + margin + 120;
  const hh = 960 / zoom + margin;
  return {x: Math.floor(cx - hw), y: Math.floor(cy - hh), w: Math.ceil(hw * 2), h: Math.ceil(hh * 2)};
};

/**
 * An <svg> whose viewport only covers `win` (children keep using world coordinates).
 * Keeps the rasterised area small even though the world is ~11 000 px tall.
 */
export const WindowSvg: React.FC<{win: Win; children: React.ReactNode; style?: React.CSSProperties}> = ({win, children, style}) => (
  <svg
    width={win.w}
    height={win.h}
    viewBox={`${win.x} ${win.y} ${win.w} ${win.h}`}
    style={{position: 'absolute', left: win.x, top: win.y, overflow: 'hidden', ...style}}
  >
    {children}
  </svg>
);
