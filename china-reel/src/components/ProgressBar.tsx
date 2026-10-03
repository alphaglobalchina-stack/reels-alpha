import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';

/** شريط تقدّم ذهبي رفيع في أعلى الشاشة يمتلئ على كامل مدة الفيديو. */
export const ProgressBar: React.FC = () => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const p = interpolate(frame, [0, durationInFrames - 1], [0, 1], {extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', top: 56, left: 60, right: 60, height: 8, borderRadius: 4, background: 'rgba(245,240,230,0.18)', overflow: 'hidden'}}>
      <div
        style={{
          width: `${p * 100}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #FFDE00, #FFF1A0)',
          boxShadow: '0 0 16px rgba(255,222,0,0.8)',
          borderRadius: 4,
        }}
      />
    </div>
  );
};
