import React from 'react';
import {FONTS} from '../data';

/**
 * One rolling digit column. `value` is continuous: 0 → n rolls the strip through every digit,
 * values above 9 keep spinning (used to make all price columns land together).
 * Width never changes, so nothing in the layout jumps while counting.
 */
export const DigitColumn: React.FC<{
  value: number;
  size: number;
  color?: string;
  width?: number;
  style?: React.CSSProperties;
  digitStyle?: React.CSSProperties;
}> = ({value, size, color, width, style, digitStyle}) => {
  const h = size * 1.12;
  const turns = Math.floor(value / 10) + 2;
  const digits = Array.from({length: turns * 10 + 1}, (_, i) => i % 10);
  const moving = Math.abs(value - Math.round(value)) > 0.001;
  return (
    <span
      style={{
        display: 'inline-block',
        position: 'relative',
        width: width ?? size * 0.66,
        height: h,
        overflow: 'hidden',
        verticalAlign: 'top',
        // soft edges while the strip rolls; razor sharp once it rests
        WebkitMaskImage: moving ? 'linear-gradient(180deg, transparent 0%, #000 16%, #000 84%, transparent 100%)' : undefined,
        ...style,
      }}
    >
      <span style={{position: 'absolute', left: 0, right: 0, top: 0, transform: `translateY(${(-value * h).toFixed(2)}px)`}}>
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
              ...digitStyle,
            }}
          >
            {d}
          </span>
        ))}
      </span>
    </span>
  );
};
