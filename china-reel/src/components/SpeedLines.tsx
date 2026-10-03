import React from 'react';
import {AbsoluteFill, Easing, interpolate, random, useCurrentFrame} from 'remotion';
import {COLORS} from '../config';

/** خطوط سرعة أفقية عبر الشاشة + شريط سرعة يمتلئ مع العدّاد. */
export const SpeedStreaks: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none', overflow: 'hidden'}}>
      {Array.from({length: 16}).map((_, i) => {
        const y = 930 + random(`sy${i}`) * 650;
        const len = 260 + random(`sl${i}`) * 520;
        const speed = 38 + random(`sv${i}`) * 46;
        const x = 1200 - ((frame * speed + random(`sx${i}`) * 3000) % (1080 + len + 400));
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: y,
              left: x,
              width: len,
              height: 3 + random(`sh${i}`) * 4,
              borderRadius: 4,
              background: `linear-gradient(90deg, rgba(255,222,0,0), ${COLORS.gold} 80%, #fff)`,
              opacity: 0.35 + random(`so${i}`) * 0.4,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

export const SpeedBar: React.FC<{startFrame: number; durationInFrames?: number}> = ({startFrame, durationInFrames = 70}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [startFrame, startFrame + durationInFrames], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div dir="ltr" style={{width: 760, height: 14, borderRadius: 7, background: 'rgba(245,240,230,0.2)', position: 'relative', marginTop: 18}}>
      <div style={{width: `${p * 100}%`, height: '100%', borderRadius: 7, background: `linear-gradient(90deg, ${COLORS.red}, ${COLORS.gold})`, boxShadow: '0 0 24px rgba(255,222,0,0.8)'}} />
      <div style={{position: 'absolute', top: -9, left: `calc(${p * 100}% - 16px)`, width: 32, height: 32, borderRadius: '50%', background: '#fff', boxShadow: `0 0 30px 8px ${COLORS.gold}`}} />
    </div>
  );
};
