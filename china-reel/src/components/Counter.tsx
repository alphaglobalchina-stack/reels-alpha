import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';

type Props = {
  to: number;
  from?: number;
  startFrame?: number;
  durationInFrames?: number;
  prefix?: string;
  fontSize: number;
  color?: string;
  style?: React.CSSProperties;
};

const fmt = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/** عدّاد من 0 إلى القيمة بـ interpolate + easing. يُعرض دائمًا LTR بخط Bebas Neue. */
export const Counter: React.FC<Props> = ({to, from = 0, startFrame = 0, durationInFrames = 70, prefix = '', fontSize, color = '#FFDE00', style}) => {
  const frame = useCurrentFrame();
  const value = interpolate(frame, [startFrame, startFrame + durationInFrames], [from, to], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const opacity = interpolate(frame, [startFrame, startFrame + 8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div
      dir="ltr"
      style={{
        fontFamily: 'Bebas Neue',
        fontSize,
        lineHeight: 0.95,
        color,
        opacity,
        letterSpacing: 2,
        fontVariantNumeric: 'tabular-nums',
        textShadow: `0 0 40px rgba(255,222,0,0.35), 0 8px 30px rgba(0,0,0,0.6)`,
        unicodeBidi: 'isolate',
        ...style,
      }}
    >
      {prefix}
      {fmt(value)}
    </div>
  );
};
