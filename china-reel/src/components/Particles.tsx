import React from 'react';
import {AbsoluteFill, random, useCurrentFrame, useVideoConfig} from 'remotion';

type Props = {count?: number; frameOffset?: number};

/** جسيمات ذهبية ناعمة تطفو للأعلى. frameOffset يجعلها متصلة بين المشاهد. */
export const Particles: React.FC<Props> = ({count = 26, frameOffset = 0}) => {
  const frame = useCurrentFrame() + frameOffset;
  const {width, height} = useVideoConfig();

  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {Array.from({length: count}).map((_, i) => {
        const size = 4 + random(`s${i}`) * 10;
        const speed = 1.2 + random(`v${i}`) * 2.4; // px/frame
        const span = height + size * 4;
        const y = height + size * 2 - ((frame * speed + random(`o${i}`) * span) % span);
        const x = random(`x${i}`) * width + Math.sin(frame / (20 + random(`f${i}`) * 25) + i) * 30;
        const twinkle = 0.5 + 0.5 * Math.sin(frame / 9 + i * 1.7);
        const opacity = (0.25 + 0.55 * random(`a${i}`)) * (0.55 + 0.45 * twinkle);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: size,
              height: size,
              borderRadius: '50%',
              background: 'radial-gradient(circle, #FFF6B0 0%, #FFDE00 45%, rgba(255,222,0,0) 75%)',
              boxShadow: `0 0 ${size * 2}px rgba(255,222,0,0.7)`,
              opacity,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
