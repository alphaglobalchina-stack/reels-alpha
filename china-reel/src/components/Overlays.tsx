import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';

/** تدرج داكن فوق الصورة ليبرز النص */
export const DarkOverlay: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        'linear-gradient(180deg, rgba(10,10,10,0.72) 0%, rgba(10,10,10,0.38) 38%, rgba(10,10,10,0.55) 62%, rgba(10,10,10,0.92) 100%)',
    }}
  />
);

/** Vignette خفيف على الحواف */
export const Vignette: React.FC = () => (
  <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)', pointerEvents: 'none'}} />
);

/** Flash أبيض خفيف لمدة إطارين يبدأ عند `at` */
export const Flash: React.FC<{at?: number; frames?: number; strength?: number}> = ({at = 0, frames = 2, strength = 0.55}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [at, at + frames], [strength, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (frame < at) return null;
  return <AbsoluteFill style={{background: '#fff', opacity, pointerEvents: 'none'}} />;
};
