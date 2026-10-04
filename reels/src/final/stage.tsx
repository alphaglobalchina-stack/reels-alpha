import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {Cam, F, H, nearFade, project, V3, W} from '../film/lib';
import {Extruded} from './kit';

/** Aspect ratios of the depth-layered photos (assets/film/layers/<name>_{far,mid,near}.webp). */
export const ASPECT: Record<string, number> = {
  cmp: 0.558, line: 0.558, insp: 0.558, cnc: 1.34, pack: 0.805, factory: 1.787, ware: 0.8, booth: 1, hall: 941 / 1672, exterior: 1,
};
export const GRADE = 'saturate(0.7) contrast(1.08) brightness(0.84) sepia(0.05) hue-rotate(-5deg)';

/** world size of a plane that covers the frame (with overscan) from a camera at the origin */
export const coverSize = (z: number, aspect: number, over = 1.3) => {
  const sw = aspect < W / H ? W * over : H * over * aspect;
  return {w: (sw * z) / F, h: (sw / aspect * z) / F};
};

export type Item = {key: string; p: V3; render: (s: number, d: number) => React.ReactNode; w: number; h: number; near?: number; opacity?: number; rotY?: number; rotX?: number};

/** Depth-sorted world: every item is projected with the same camera and z-ordered by distance. */
export const Stage: React.FC<{cam: Cam; items: Item[]; bg?: string; children?: React.ReactNode}> = ({cam, items, bg, children}) => (
  <AbsoluteFill style={{background: bg, overflow: 'hidden', isolation: 'isolate'}}>
    {items.map((it) => {
      const pr = project(cam, it.p);
      const near = it.near ?? 40;
      if (pr.d < near * 0.6) return null;
      const o = (it.opacity ?? 1) * nearFade(pr.d, near, near * 5);
      if (o < 0.005) return null;
      return (
        <div key={it.key} style={{position: 'absolute', left: 0, top: 0, width: it.w, height: it.h, transform: `translate(${pr.x - it.w / 2}px, ${pr.y - it.h / 2}px) scale(${pr.s}) perspective(1600px) rotateX(${it.rotX ?? 0}deg) rotateY(${it.rotY ?? 0}deg)`, zIndex: Math.round(100000 - pr.d), opacity: o}}>
          {it.render(pr.s, pr.d)}
        </div>
      );
    })}
    {children}
  </AbsoluteFill>
);

/** the three depth layers of a photo as Stage items (planes sized to cover from the origin) */
export const photoLayers = (name: string, zFar: number, zMid: number, zNear: number, opts: {x?: number; y?: number; over?: number; opacity?: number; grade?: string; skipNear?: boolean} = {}): Item[] => {
  const a = ASPECT[name];
  const out: Item[] = [];
  const layers: [string, number][] = [['far', zFar], ['mid', zMid], ...(opts.skipNear ? [] : [['near', zNear] as [string, number]])];
  for (const [k, z] of layers) {
    const c = coverSize(z, a, opts.over ?? 1.3);
    out.push({
      key: `${name}_${k}`,
      p: [opts.x ?? 0, opts.y ?? 0, z],
      w: c.w,
      h: c.h,
      opacity: opts.opacity,
      render: () => <Img src={staticFile(`film/layers/${name}_${k}.webp`)} style={{width: c.w, height: c.h, display: 'block', filter: opts.grade ?? GRADE}} />,
    });
  }
  return out;
};

/** an extruded Arabic hero word as a Stage item (lives in depth with the photo layers) */
export const wordItem = (key: string, text: string, p: V3, size: number, o: {rotY?: number; rotX?: number; face?: 'ivory' | 'gold'; sheen?: number; opacity?: number; scale?: number}): Item => ({
  key,
  p,
  w: size * 3.2,
  h: size * 1.4,
  opacity: o.opacity,
  render: () => (
    <div style={{width: size * 3.2, height: size * 1.4, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${o.scale ?? 1})`, filter: 'drop-shadow(0 24px 34px rgba(0,0,0,0.55))'}}>
      <Extruded text={text} size={size} rotY={o.rotY ?? 0} rotX={o.rotX ?? 0} face={o.face ?? 'ivory'} sheen={o.sheen ?? -1} depth={0.13} slices={12} />
    </div>
  ),
});
