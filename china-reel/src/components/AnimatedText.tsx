import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

type Props = {
  text: string;
  /** إطار بداية أول كلمة */
  delay?: number;
  /** تأخير كل كلمة (إطار) */
  perWord?: number;
  fontSize: number;
  color?: string;
  weight?: number;
  family?: string;
  dir?: 'rtl' | 'ltr';
  lineHeight?: number;
  style?: React.CSSProperties;
};

/** نص يدخل كلمة كلمة بـ spring مع blur يختفي. dir=rtl ⇒ أول كلمة تظهر من اليمين. */
export const AnimatedText: React.FC<Props> = ({
  text,
  delay = 0,
  perWord = 3,
  fontSize,
  color = '#F5F0E6',
  weight = 900,
  family = 'Cairo',
  dir = 'rtl',
  lineHeight = 1.25,
  style,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  // "\n" في النص يفرض سطرًا جديدًا (لتوازن العنوان)؛ الكلمات تُرقَّم تسلسليًا عبر الأسطر.
  const lines = text.split('\n').map((l) => l.split(' ').filter(Boolean));
  let counter = 0;

  return (
    <div
      dir={dir}
      lang={dir === 'rtl' ? 'ar' : 'en'}
      className="flex flex-col items-center"
      style={{fontFamily: family, fontWeight: weight, fontSize, lineHeight, color, ...style}}
    >
      {lines.map((words, li) => (
        <div key={li} className="flex flex-wrap justify-center" style={{columnGap: fontSize * 0.28}}>
          {words.map((w, wi) => {
            const i = counter++;
            const p = spring({frame: frame - delay - i * perWord, fps, config: {damping: 14, stiffness: 120, mass: 0.8}});
            const blur = interpolate(p, [0, 1], [18, 0], {extrapolateRight: 'clamp'});
            const opacity = interpolate(p, [0, 0.6], [0, 1], {extrapolateRight: 'clamp'});
            return (
              <span
                key={wi}
                style={{
                  display: 'inline-block',
                  opacity,
                  transform: `translateY(${interpolate(p, [0, 1], [60, 0])}px) scale(${interpolate(p, [0, 1], [0.85, 1])})`,
                  filter: `blur(${blur}px)`,
                }}
              >
                {w}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};
