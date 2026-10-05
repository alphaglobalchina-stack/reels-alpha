import React from 'react';
import {CameraState, toScreen} from '../lib/camera';
import {clamp} from '../lib/math';

/** Is the world band [top, bottom] anywhere near the frame? (cheap culling) */
export const inView = (cam: CameraState, top: number, bottom: number, margin = 500) => {
  const half = 960 / cam.zoom + margin;
  return bottom > cam.y - half && top < cam.y + half;
};

/** Very light depth-of-field: the further from the optical centre, the softer. */
export const dofBlur = (cam: CameraState, wx: number, wy: number) => {
  const p = toScreen(cam, wx, wy);
  const d = Math.hypot((p.x - 540) * 0.6, p.y - 910);
  return clamp((d - 600) / 700) * 3.2;
};

/**
 * Wraps a station: culls it when far away and applies the depth blur on a box that is only as
 * big as the station (a blur on a 10 900 px tall box would be very expensive).
 * Children are positioned in world coordinates.
 */
export const Station: React.FC<{
  cam: CameraState;
  top: number;
  bottom: number;
  focus: {x: number; y: number};
  blur?: boolean;
  children: React.ReactNode;
}> = ({cam, top, bottom, focus, blur = true, children}) => {
  if (!inView(cam, top, bottom)) return null;
  const b = blur ? dofBlur(cam, focus.x, focus.y) : 0;
  const fade = blur ? clamp((b - 1.2) / 2) : 0; // far-away stations also recede in contrast
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top,
        width: 1080,
        height: bottom - top,
        filter: b > 0.08 ? `blur(${b.toFixed(2)}px)` : undefined,
        opacity: 1 - 0.5 * fade,
      }}
    >
      <div style={{position: 'absolute', left: 0, top: -top, width: 0, height: 0}}>{children}</div>
    </div>
  );
};
