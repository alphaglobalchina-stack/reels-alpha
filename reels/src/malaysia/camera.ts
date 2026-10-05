import {Easing} from 'remotion';
import {CAMERA, FOCUS, Key, Rect, T} from './data';

const EASE = {
  io: Easing.bezier(0.7, 0, 0.3, 1), // fast travel, soft landing — the "cinematic" move
  soft: Easing.bezier(0.42, 0, 0.58, 1), // slow drift while holding on a card
  o: Easing.bezier(0.16, 1, 0.3, 1),
};

export type Cam = {cx: number; cy: number; z: number; roll: number};

/** Camera at a (fractional) frame. Pure function of time → deterministic renders. */
export const camAt = (frame: number): Cam => {
  const k = CAMERA;
  if (frame <= k[0].f) return k[0];
  if (frame >= k[k.length - 1].f) return k[k.length - 1];
  let i = 0;
  while (frame > k[i + 1].f) i++;
  const a: Key = k[i];
  const b: Key = k[i + 1];
  const u = (frame - a.f) / (b.f - a.f);
  const e = EASE[b.ease ?? 'io'](u);
  const bell = Math.sin(Math.PI * u); // 0 at both stations, 1 mid-flight
  const lerp = (p: number, q: number) => p + (q - p) * e;
  return {
    cx: lerp(a.cx, b.cx) + (b.arc ?? 0) * bell,
    cy: lerp(a.cy, b.cy),
    // zoom: log-space interpolation keeps the perceived zoom speed even
    z: Math.exp(lerp(Math.log(a.z), Math.log(b.z))) * (1 - (b.breathe ?? 0) * Math.sin(Math.PI * e)),
    roll: lerp(a.roll, b.roll),
  };
};

/** Pitch / yaw (deg) from the camera's on-screen velocity: the board leans into the move. */
export const tiltAt = (frame: number) => {
  const p = camAt(frame - 1);
  const n = camAt(frame + 1);
  const c = camAt(frame);
  const vy = ((n.cy - p.cy) / 2) * c.z; // screen px / frame
  const vx = ((n.cx - p.cx) / 2) * c.z;
  const endFade = frame >= T.zoomOut[0] ? 0 : 1;
  const clampDeg = (d: number, m: number) => Math.max(-m, Math.min(m, d));
  return {
    pitch: clampDeg(vy * 0.055, 7) * endFade,
    yaw: clampDeg(-vx * 0.05, 5) * endFade,
    speed: Math.hypot(vx, vy),
  };
};

/** Board point → screen point (2D part of the camera; used for DOF and the end lift). */
export const project = (c: Cam, x: number, y: number) => {
  const r = (c.roll * Math.PI) / 180;
  const dx = (x - c.cx) * c.z;
  const dy = (y - c.cy) * c.z;
  return {
    x: FOCUS.x + dx * Math.cos(r) - dy * Math.sin(r),
    y: FOCUS.y + dx * Math.sin(r) + dy * Math.cos(r),
  };
};

/** Simulated depth of field: blur (in board px) for a card, by its distance from the focus point. */
export const dofBlur = (c: Cam, rect: Rect, extra = 0) => {
  const p = project(c, rect.x + rect.w / 2, rect.y + rect.h / 2);
  const halfDiag = (Math.hypot(rect.w, rect.h) / 2) * c.z;
  const d = Math.max(0, Math.hypot((p.x - FOCUS.x) * 0.8, p.y - FOCUS.y) - halfDiag * 0.55);
  const screenBlur = Math.min(3.2, Math.max(0, (d - 420) / 220)) + extra;
  return screenBlur / Math.max(c.z, 0.2); // filter radius is in local (board) units
};
