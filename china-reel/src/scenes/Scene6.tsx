import React from 'react';
import {Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS, OUTRO, SCENE_STRIDE} from '../config';
import {AnimatedText} from '../components/AnimatedText';
import {SceneShell} from '../components/SceneShell';

const BASE = 12;

const PlusIcon: React.FC<{size: number}> = ({size}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.2} strokeLinecap="round">
    <path d="M12 4v16M4 12h16" />
  </svg>
);

export const Scene6: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const logoIn = spring({frame: frame - BASE, fps, config: {damping: 14, stiffness: 100}});
  const btnIn = spring({frame: frame - BASE - 34, fps, config: {damping: 12}});
  // نبض متكرر كل 24 إطار (0.8 ثانية)
  const phase = ((frame - BASE - 40) % 24 + 24) % 24 / 24;
  const pulse = frame < BASE + 40 ? 1 : 1 + 0.09 * Math.sin(phase * Math.PI);
  const ring = frame < BASE + 40 ? 0 : phase;
  // السهم ينبض نحو الزر (للأسفل)
  const bob = Math.abs(Math.sin(((frame - BASE - 40) / 24) * Math.PI)) * 22;

  return (
    <SceneShell image={OUTRO.image} fallback={OUTRO.fallback} startFrame={5 * SCENE_STRIDE} flashAt={BASE} panDirection={-1}>
      <div className="flex w-full flex-col items-center" style={{gap: 30}}>
        <div
          style={{
            position: 'relative',
            width: 880,
            height: 340,
            borderRadius: 56,
            background: '#fff',
            overflow: 'hidden',
            boxShadow: `0 0 0 6px ${COLORS.gold}, 0 30px 80px rgba(0,0,0,0.6)`,
            opacity: logoIn,
            transform: `scale(${interpolate(logoIn, [0, 1], [0.6, 1])})`,
          }}
        >
          {/* الشعار الأصلي مربع بهوامش بيضاء كبيرة، فنكبّره ونقصّ الهوامش داخل البطاقة */}
          <Img src={staticFile(OUTRO.logo)} style={{position: 'absolute', width: 1400, height: 1400, left: (880 - 1400) / 2 + 28, top: (340 - 1400) / 2 + 4, maxWidth: 'none'}} />
        </div>

        {OUTRO.accountName && (
          <div dir="ltr" style={{fontFamily: 'Cairo', fontWeight: 700, fontSize: 48, color: COLORS.gold}}>
            {OUTRO.accountName}
          </div>
        )}

        <AnimatedText text={OUTRO.title} delay={BASE + 14} fontSize={112} style={{textShadow: '0 6px 30px rgba(0,0,0,0.7)'}} />

        <div style={{height: 130, marginBottom: 14, transform: `translateY(${bob}px)`, opacity: btnIn, color: COLORS.gold, filter: 'drop-shadow(0 0 16px rgba(255,222,0,0.8))'}}>
          <svg width={104} height={130} viewBox="0 0 120 150" fill="none" stroke="currentColor" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round">
            <path d="M60 14v100M20 82l40 44 40-44" />
          </svg>
        </div>

        <div className="relative" style={{transform: `scale(${pulse * interpolate(btnIn, [0, 1], [0.5, 1])})`, opacity: btnIn}}>
          <div
            style={{
              position: 'absolute',
              inset: -6,
              borderRadius: 999,
              border: `5px solid ${COLORS.gold}`,
              opacity: (1 - ring) * 0.9,
              transform: `scale(${1 + ring * 0.35})`,
            }}
          />
          <div
            dir="rtl"
            className="flex items-center justify-center"
            style={{
              gap: 22,
              padding: '28px 96px',
              borderRadius: 999,
              background: `linear-gradient(180deg, #ff4a2e, ${COLORS.red})`,
              color: COLORS.cream,
              fontFamily: 'Cairo',
              fontWeight: 900,
              fontSize: 80,
              boxShadow: `0 0 50px rgba(222,41,16,0.7), 0 10px 0 #8f1a08`,
            }}
          >
            <PlusIcon size={72} />
            {OUTRO.buttonText}
          </div>
        </div>
      </div>
    </SceneShell>
  );
};
