import React from 'react';

export type IconDef = {
  /** silhouette shapes (fill/stroke = currentColor) used for the extruded body */
  body: React.ReactNode;
  /** front face, fully shaded; receives a unique id prefix for its gradients */
  face: (id: string) => React.ReactNode;
};

const mix = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(',')})`;
};

/**
 * A real 3D object out of SVG: the silhouette is stacked `layers` times along Z
 * (light → dark side colour), the shaded face sits in front. Rotating the wrapper
 * reveals the thickness. `shine` (0…1) sweeps a specular band across the face.
 */
export const Icon3D: React.FC<{
  id: string;
  def: IconDef;
  size: number;
  rx?: number;
  ry?: number;
  rz?: number;
  depth?: number;
  layers?: number;
  side?: [string, string];
  shine?: number;
}> = ({id, def, size, rx = 0, ry = 0, rz = 0, depth = 22, layers = 12, side = ['#E2D6BB', '#A88C5A'], shine = -1}) => (
  <div style={{width: size, height: size, perspective: 1100}}>
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        transformStyle: 'preserve-3d',
        transform: `rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)`,
      }}
    >
      {Array.from({length: layers}, (_, i) => {
        const t = (i + 1) / layers;
        return (
          <svg
            key={i}
            viewBox="0 0 200 200"
            width={size}
            height={size}
            style={{position: 'absolute', inset: 0, transform: `translateZ(${(-depth * t).toFixed(2)}px)`, color: mix(side[0], side[1], t), overflow: 'visible'}}
          >
            {def.body}
          </svg>
        );
      })}
      <svg viewBox="0 0 200 200" width={size} height={size} style={{position: 'absolute', inset: 0, transform: 'translateZ(0.6px)', overflow: 'visible'}}>
        <defs>
          <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x="-20" y="-20" width="240" height="240">
            <g style={{color: 'white'}}>{def.body}</g>
          </mask>
          <linearGradient id={`${id}-sh`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FFFFFF" stopOpacity={0} />
            <stop offset="0.42" stopColor="#FFFFFF" stopOpacity={0} />
            <stop offset="0.5" stopColor="#FFFFFF" stopOpacity={0.85} />
            <stop offset="0.58" stopColor="#FFFFFF" stopOpacity={0} />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
          </linearGradient>
        </defs>
        {def.face(id)}
        {shine >= 0 && shine <= 1 && (
          <rect
            x={-200 + shine * 400}
            y={-200 + shine * 400}
            width={200}
            height={200}
            fill={`url(#${id}-sh)`}
            mask={`url(#${id}-m)`}
            style={{mixBlendMode: 'screen'}}
          />
        )}
      </svg>
    </div>
  </div>
);
