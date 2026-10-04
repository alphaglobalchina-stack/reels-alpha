import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ease, H, ramp, W} from './lib';

/**
 * Circular portal: reveals the next scene through a growing aperture centred on the
 * shared element (node, pin, card…) the camera is flying into, with a gold rim.
 */
export const Portal: React.FC<{t: number; a: number; b: number; x: number; y: number; children: React.ReactNode; rim?: boolean}> = ({t, a, b, x, y, children, rim = true}) => {
  if (t < a) return null;
  const p = ramp(t, a, b, (v) => ease.in(v) * 0.7 + v * 0.3);
  if (p >= 1) return <>{children}</>;
  const maxR = Math.hypot(Math.max(x, W - x), Math.max(y, H - y)) + 40;
  const r = Math.max(1, p * maxR);
  return (
    <>
      <AbsoluteFill style={{clipPath: `circle(${r.toFixed(1)}px at ${x.toFixed(1)}px ${y.toFixed(1)}px)`}}>{children}</AbsoluteFill>
      {rim && (
        <AbsoluteFill style={{pointerEvents: 'none'}}>
          <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
            <defs>
              <radialGradient id="rimglow">
                <stop offset="0.86" stopColor="rgba(255,220,150,0)" />
                <stop offset="0.985" stopColor="rgba(255,220,150,0.55)" />
                <stop offset="1" stopColor="rgba(255,220,150,0)" />
              </radialGradient>
            </defs>
            <circle cx={x} cy={y} r={r * 1.04} fill="url(#rimglow)" opacity={1 - p * 0.6} />
            <circle cx={x} cy={y} r={r} fill="none" stroke="rgba(240,211,138,0.9)" strokeWidth={2.5} opacity={1 - p * 0.5} />
          </svg>
        </AbsoluteFill>
      )}
    </>
  );
};
