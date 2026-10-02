import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {goldGradient, theme} from '../theme';
import {easeOut, pop, prog} from '../lib/anim';

type Common = {
  size?: number;
  weight?: 400 | 700 | 800;
  color?: string;
  gold?: boolean;
  align?: 'right' | 'center' | 'left';
  lineHeight?: number;
  style?: React.CSSProperties;
};

const goldText: React.CSSProperties = {
  backgroundImage: goldGradient,
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
  WebkitTextFillColor: 'transparent',
};

/**
 * RTL Arabic text. Never apply letter-spacing to Arabic (it breaks the letter joins)
 * and never split a word into per-letter elements.
 */
export const ArabicText: React.FC<Common & {children: React.ReactNode}> = ({
  children,
  size = 56,
  weight = 700,
  color = theme.colors.white,
  gold,
  align = 'center',
  lineHeight = 1.4,
  style,
}) => (
  <div
    dir="rtl"
    lang="ar"
    style={{
      fontFamily: theme.fonts.arabic,
      fontSize: size,
      fontWeight: weight,
      lineHeight,
      textAlign: align,
      direction: 'rtl',
      unicodeBidi: 'isolate',
      letterSpacing: 0,
      color,
      ...(gold ? goldText : {}),
      ...style,
    }}
  >
    {children}
  </div>
);

/** Numbers / emails / URLs: always left-to-right, even inside an RTL layout. */
export const LtrText: React.FC<{
  children: React.ReactNode;
  size?: number;
  weight?: 500 | 600 | 700 | 800;
  color?: string;
  gold?: boolean;
  style?: React.CSSProperties;
}> = ({children, size = 40, weight = 600, color = theme.colors.white, gold, style}) => (
  <span
    dir="ltr"
    style={{
      display: 'inline-block',
      direction: 'ltr',
      unicodeBidi: 'isolate',
      fontFamily: theme.fonts.latin,
      fontSize: size,
      fontWeight: weight,
      color,
      lineHeight: 1.3,
      ...(gold ? goldText : {}),
      ...style,
    }}
  >
    {children}
  </span>
);

/**
 * Kinetic typography: one word at a time (scale + blur in). Words are the unit —
 * a word is never split, so Arabic shaping stays intact. First word sits on the right.
 */
export const KineticWords: React.FC<
  Common & {
    lines: string[];
    start?: number;
    stagger?: number;
    highlightLast?: boolean;
    gap?: number;
  }
> = ({lines, start = 0, stagger = 9, highlightLast = true, gap = 0.28, size = 120, weight = 800, color, ...rest}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const all = lines.flatMap((l) => l.split(' ').filter(Boolean));
  let idx = 0;
  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: size * 0.06}}>
      {lines.map((line, li) => (
        <div
          key={li}
          dir="rtl"
          style={{display: 'flex', flexDirection: 'row', justifyContent: 'center', gap: size * gap, direction: 'rtl'}}
        >
          {line
            .split(' ')
            .filter(Boolean)
            .map((w) => {
              const i = idx++;
              const d = start + i * stagger;
              const s = pop(frame, fps, d, 13, 110);
              const o = prog(frame, d, 8, easeOut);
              const blur = (1 - prog(frame, d, 14, easeOut)) * 26;
              const last = highlightLast && i === all.length - 1;
              return (
                <div
                  key={i}
                  style={{
                    opacity: o,
                    transform: `scale(${0.55 + 0.45 * s}) translateY(${(1 - s) * 40}px)`,
                    filter: `blur(${blur}px)`,
                    willChange: 'transform, filter',
                  }}
                >
                  <ArabicText size={size} weight={weight} color={color} gold={last} {...rest} lineHeight={1.25}>
                    {w}
                  </ArabicText>
                </div>
              );
            })}
        </div>
      ))}
    </div>
  );
};
