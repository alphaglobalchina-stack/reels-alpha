import {CAMERA, THREAD, VIDEO} from '../data';
import {catmullRom, Curve} from './spline';
import {clamp, monotoneCubic, quintic, smoothstep} from './math';

// ───────────── camera path ─────────────
export const camCurve: Curve = catmullRom(CAMERA.points, 3);

type Key = {f: number; s: number; v: number};
type Stop = {id: string; s: number; zoom: number; arrive: number; leave: number};

const stops: Stop[] = [];
const keys: Key[] = [];
CAMERA.points.forEach((p, i) => {
  if (p.arrive === undefined) return;
  const s = camCurve.controlS[i];
  const leave = p.leave ?? p.arrive;
  const v = p.drift ?? 0;
  stops.push({id: p.id, s, zoom: p.zoom ?? 1, arrive: p.arrive, leave});
  if (leave === p.arrive) {
    keys.push({f: p.arrive, s, v});
  } else {
    const half = (v * (leave - p.arrive)) / 2;
    keys.push({f: p.arrive, s: s - half, v});
    keys.push({f: leave, s: s + half, v});
  }
});
// the very first key is the start of the move: it begins exactly at the start point
keys[0].s = stops[0].s;

const evalKeys = (f: number) => {
  if (f <= keys[0].f) return {s: keys[0].s + keys[0].v * (f - keys[0].f), v: keys[0].v};
  const last = keys[keys.length - 1];
  if (f >= last.f) return {s: last.s + last.v * (f - last.f), v: last.v};
  let k = 0;
  while (f > keys[k + 1].f) k++;
  const a = keys[k];
  const b = keys[k + 1];
  const T = b.f - a.f;
  const {p, dp} = quintic((f - a.f) / T, a.s, b.s, a.v * T, b.v * T);
  return {s: p, v: dp / T};
};

export type CameraState = {
  x: number;
  y: number;
  zoom: number;
  roll: number; // deg
  tiltX: number; // deg
  tiltY: number; // deg
  speed: number; // world px / frame
  s: number;
};

const zoomAt = (s: number) => {
  if (s <= stops[0].s) return stops[0].zoom;
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i];
    const b = stops[i + 1];
    if (s <= b.s) return a.zoom + (b.zoom - a.zoom) * smoothstep(a.s, b.s, s);
  }
  return stops[stops.length - 1].zoom;
};

const finalHold = stops[stops.length - 1].arrive;

export const cameraAt = (frame: number): CameraState => {
  const {s, v} = evalKeys(frame);
  const p = camCurve.pointAt(s);
  const ang = camCurve.angleAt(s); // direction of travel
  const dx = Math.cos(ang);
  const dy = Math.sin(ang);
  const speed = Math.abs(v);
  const sn = clamp(speed / 70);
  // heading relative to "straight up" (we travel upward through the world)
  const heading = (Math.atan2(dx, -dy) * 180) / Math.PI;
  const settle = 1 - smoothstep(finalHold - 26, finalHold, frame); // perfectly level on the last frame
  const roll = clamp(heading * 0.22 * (0.35 + 0.65 * sn), -CAMERA.maxRoll, CAMERA.maxRoll) * settle;
  const vx = dx * v;
  const vy = dy * v;
  const tiltX = clamp(-vy * 0.06, -CAMERA.maxTilt, CAMERA.maxTilt) * settle; // pitch: top recedes while climbing
  const tiltY = clamp(vx * 0.09, -CAMERA.maxTilt, CAMERA.maxTilt) * settle;
  const zoom = zoomAt(s) * (1 - 0.09 * sn);
  return {x: p.x, y: p.y, zoom, roll, tiltX, tiltY, speed, s};
};

/** World → screen (ignores the small 3D tilt). */
export const toScreen = (cam: CameraState, wx: number, wy: number) => {
  const r = (cam.roll * Math.PI) / 180;
  const dx = (wx - cam.x) * cam.zoom;
  const dy = (wy - cam.y) * cam.zoom;
  return {
    x: VIDEO.width / 2 + dx * Math.cos(r) - dy * Math.sin(r),
    y: VIDEO.height / 2 + dx * Math.sin(r) + dy * Math.cos(r),
  };
};

export const stopById = (id: string) => stops.find((s) => s.id === id)!;

// ───────────── thread ─────────────
export const threadCurve: Curve = catmullRom(THREAD.points, 4);
export const threadS = (id: string) => {
  const i = THREAD.points.findIndex((p) => p.id === id);
  if (i < 0) throw new Error(`thread anchor ${id}`);
  return threadCurve.controlS[i];
};

const headFn = monotoneCubic(
  THREAD.head.map(([f]) => f),
  THREAD.head.map(([, id, off]) => threadS(id) + off),
);

/** Arc length of the glowing head of the thread at a frame. */
export const threadHead = (frame: number) => clamp(headFn(frame), 0, threadCurve.length);
