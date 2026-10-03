import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS, SceneConfig} from '../config';
import {AnimatedText} from './AnimatedText';
import {Counter} from './Counter';

type Props = {
  scene: SceneConfig;
  /** إطار بداية الحركة (بعد انتهاء الـ Wipe) */
  base: number;
  titleSize?: number;
  numberSize?: number;
  /** عنصر إضافي تحت الرقم (مثل خط السرعة) */
  extra?: React.ReactNode;
};

/** تخطيط الحقيقة: وسم صغير ← عنوان ← رقم كبير/نص مميز ← وحدة ← وصف. */
export const FactLayout: React.FC<Props> = ({scene, base, titleSize = 118, numberSize = 330, extra}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const titleWords = scene.title.split(/\s+/).length;
  const numStart = base + 8 + titleWords * 3;

  const tag = spring({frame: frame - base, fps, config: {damping: 18}});
  const line = spring({frame: frame - base - 6, fps, config: {damping: 20, stiffness: 90}});
  const unitIn = spring({frame: frame - numStart - 40, fps, config: {damping: 16}});

  return (
    <div className="flex w-full flex-col items-center" style={{gap: 28}}>
      {scene.tag && (
        <div
          dir="rtl"
          style={{
            fontFamily: 'Cairo',
            fontWeight: 700,
            fontSize: 44,
            color: COLORS.black,
            background: COLORS.gold,
            padding: '6px 34px',
            borderRadius: 999,
            opacity: tag,
            transform: `translateY(${interpolate(tag, [0, 1], [-30, 0])}px)`,
          }}
        >
          {scene.tag}
        </div>
      )}

      <AnimatedText text={scene.title} delay={base + 4} fontSize={titleSize} style={{textShadow: '0 6px 30px rgba(0,0,0,0.7)'}} />

      <div style={{height: 8, width: `${interpolate(line, [0, 1], [0, 340])}px`, background: COLORS.red, borderRadius: 4, boxShadow: '0 0 20px rgba(222,41,16,0.9)'}} />

      {scene.number && (
        <div className="flex flex-col items-center" style={{gap: 6}}>
          <Counter to={scene.number.value} prefix={scene.number.prefix} startFrame={numStart} durationInFrames={70} fontSize={numberSize} />
          <div
            dir="rtl"
            style={{
              fontFamily: 'Cairo',
              fontWeight: 900,
              fontSize: 72,
              color: COLORS.cream,
              opacity: unitIn,
              transform: `translateY(${interpolate(unitIn, [0, 1], [24, 0])}px)`,
              textShadow: '0 4px 20px rgba(0,0,0,0.7)',
            }}
          >
            {scene.number.unit}
          </div>
        </div>
      )}

      {scene.highlight && (
        <div className="relative flex flex-col items-center" style={{marginTop: 30}}>
          <AnimatedText
            text={scene.highlight}
            delay={numStart}
            fontSize={140}
            color={COLORS.gold}
            style={{textShadow: '0 0 40px rgba(255,222,0,0.35), 0 8px 30px rgba(0,0,0,0.7)', lineHeight: 1.3}}
          />
        </div>
      )}

      {extra}

      {scene.caption && (
        <div
          dir="rtl"
          style={{
            fontFamily: 'Cairo',
            fontWeight: 700,
            fontSize: 46,
            color: COLORS.cream,
            opacity: 0.9 * unitIn,
            marginTop: 8,
            textShadow: '0 3px 14px rgba(0,0,0,0.8)',
          }}
        >
          {scene.caption}
        </div>
      )}
    </div>
  );
};
