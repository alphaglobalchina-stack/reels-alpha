import React from 'react';
import {FONTS} from '../data';

/**
 * One rolling digit column. `value` is continuous: 0 → n rolls the strip through every digit,
 * values above 9 keep spinning (used to make all price columns land together).
 * Width never changes, so nothing in the layout jumps while counting.
 */
export const DigitColumn: React.FC<{value: number; size: number; color?: string; width?: number; style?: React.CSSProperties}> = ({
  value,
  size,
  color,
  width,
  style,
}) => {
  const h = size * 1.12;
  const turns = Math.floor(value / 10) + 2;
  const digits = Array.from({length: turns * 10 + 1}, (_, i) => i % 10);
  return (
    <span
      style={{
        display: 'inline-block',
        position: 'relative',
        width: width ?? size * 0.66,
        height: h,
        overflow: 'hidden',
        verticalAlign: 'top',
        ...style,
      }}
    >
      <span style={{position: 'absolute', left: 0, right: 0, top: 0, transform: `translateY(${-value * h}px)`}}>
        {digits.map((d, i) => (
          <span
            key={i}
            style={{
              display: 'block',
              height: h,
              lineHeight: `${h}px`,
              textAlign: 'center',
              fontFamily: FONTS.latin,
              fontWeight: 700,
              fontSize: size,
              color,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {d}
          </span>
        ))}
      </span>
    </span>
  );
};
