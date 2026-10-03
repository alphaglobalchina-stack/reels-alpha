import React, {createContext, useContext} from 'react';
import {AbsoluteFill} from 'remotion';

/**
 * A tiny CSS-3D "camera" for Remotion.
 *
 * The world is a preserve-3d div under a `perspective: P` parent. The camera is the point `c`
 * that sits on the screen plane; the eye is P pixels behind it. Rotations pivot around `c`,
 * so animating rx/ry orbits the eye around whatever sits at `c`.
 * An object at eye-space depth ez renders at scale P / (P - ez): ez = 0 is natural size,
 * ez -> P is the eye itself.
 */
export const P = 1600;
export const W = 1080;
export const H = 1920;

export type Cam = {x: number; y: number; z: number; rx: number; ry: number; rz: number; focus: number; aperture: number};
export type Key = Partial<Cam> & {t: number};

const PROPS: (keyof Cam)[] = ['x', 'y', 'z', 'rx', 'ry', 'rz', 'focus', 'aperture'];
const DEFAULT: Cam = {x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, focus: P, aperture: 0.012};

/** Cubic Hermite through keys with Catmull-Rom tangents: velocity never jumps, so motion never stops dead. */
const hermite = (ts: number[], vs: number[], t: number) => {
  const n = ts.length;
  if (n === 1) return vs[0];
  const slope = (i: number) => {
    if (i <= 0) return (vs[1] - vs[0]) / (ts[1] - ts[0]);
    if (i >= n - 1) return (vs[n - 1] - vs[n - 2]) / (ts[n - 1] - ts[n - 2]);
    return (vs[i + 1] - vs[i - 1]) / (ts[i + 1] - ts[i - 1]);
  };
  if (t <= ts[0]) return vs[0] + slope(0) * (t - ts[0]);
  if (t >= ts[n - 1]) return vs[n - 1] + slope(n - 1) * (t - ts[n - 1]);
  let i = 0;
  while (t > ts[i + 1]) i++;
  const h = ts[i + 1] - ts[i];
  const u = (t - ts[i]) / h;
  const m0 = slope(i) * h, m1 = slope(i + 1) * h;
  const u2 = u * u, u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * vs[i] + (u3 - 2 * u2 + u) * m0 + (-2 * u3 + 3 * u2) * vs[i + 1] + (u3 - u2) * m1;
};

/** Every property is splined on its own keys (a key may set only some of them). */
export const camAt = (keys: Key[], t: number): Cam => {
  const out = {...DEFAULT};
  for (const p of PROPS) {
    const ks = keys.filter((k) => k[p] !== undefined);
    if (!ks.length) continue;
    out[p] = hermite(ks.map((k) => k.t), ks.map((k) => k[p] as number), t);
  }
  return out;
};

const rad = (d: number) => (d * Math.PI) / 180;

/** World point -> eye space, matching CSS `rotateZ rotateX rotateY translate3d(-c)`. */
export const toEye = (cam: Cam, p: [number, number, number]) => {
  let x = p[0] - cam.x, y = p[1] - cam.y, z = p[2] - cam.z;
  const ry = rad(cam.ry), rx = rad(cam.rx), rz = rad(cam.rz);
  // rotateY
  let x1 = x * Math.cos(ry) + z * Math.sin(ry);
  let z1 = -x * Math.sin(ry) + z * Math.cos(ry);
  x = x1; z = z1;
  // rotateX
  let y1 = y * Math.cos(rx) - z * Math.sin(rx);
  z1 = y * Math.sin(rx) + z * Math.cos(rx);
  y = y1; z = z1;
  // rotateZ
  x1 = x * Math.cos(rz) - y * Math.sin(rz);
  y1 = x * Math.sin(rz) + y * Math.cos(rz);
  return [x1, y1, z] as [number, number, number];
};

export const project = (cam: Cam, p: [number, number, number]) => {
  const [x, y, z] = toEye(cam, p);
  const s = P / Math.max(1, P - z);
  return {x: W / 2 + x * s, y: H / 2 + y * s, s, ez: z};
};

const CamCtx = createContext<Cam>(DEFAULT);
export const useCam = () => useContext(CamCtx);

/** A 3D world seen through `cam`. */
export const World: React.FC<{cam: Cam; children: React.ReactNode; style?: React.CSSProperties}> = ({cam, children, style}) => (
  <CamCtx.Provider value={cam}>
    <AbsoluteFill style={{perspective: P, perspectiveOrigin: '50% 50%', overflow: 'hidden', ...style}}>
      <div
        style={{
          position: 'absolute',
          left: W / 2,
          top: H / 2,
          width: 0,
          height: 0,
          transformStyle: 'preserve-3d',
          transform: `rotateZ(${cam.rz}deg) rotateX(${cam.rx}deg) rotateY(${cam.ry}deg) translate3d(${-cam.x}px, ${-cam.y}px, ${-cam.z}px)`,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  </CamCtx.Provider>
);

/**
 * A layer floating in the world. Its centre sits at `p`; it gets depth-of-field blur from its
 * distance to the camera's focus plane and fades out as it nears the eye (zoom-through).
 */
export const L: React.FC<{
  p: [number, number, number];
  r?: [number, number, number];
  scale?: number;
  opacity?: number;
  dof?: boolean;
  maxBlur?: number;
  nearFade?: number;
  backface?: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({p, r = [0, 0, 0], scale = 1, opacity = 1, dof = true, maxBlur = 14, nearFade = 420, backface = true, children, style}) => {
  const cam = useCam();
  const {ez} = project(cam, p);
  const dist = P - ez; // distance from the eye
  if (dist < 40 || opacity <= 0.002) return null;
  const near = Math.min(1, Math.max(0, (dist - 60) / nearFade));
  const blur = dof ? Math.min(maxBlur, Math.abs(dist - cam.focus) * cam.aperture) : 0;
  const o = opacity * near;
  if (o <= 0.002) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        transformStyle: 'preserve-3d',
        transformOrigin: '0 0',
        backfaceVisibility: backface ? 'visible' : 'hidden',
        transform: `translate3d(${p[0]}px, ${p[1]}px, ${p[2]}px) rotateX(${r[0]}deg) rotateY(${r[1]}deg) rotateZ(${r[2]}deg) scale(${scale}) translate(-50%, -50%)`,
        opacity: o,
      }}
    >
      <div style={{whiteSpace: 'nowrap', filter: blur > 0.4 ? `blur(${blur.toFixed(2)}px)` : undefined, ...style}}>{children}</div>
    </div>
  );
};
