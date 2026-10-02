import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {goldGradient, theme} from '../theme';
import {easeInOut, easeOut, pop, prog} from '../lib/anim';
import {CtaContent} from '../types';
import {ArabicText, LtrText} from './ArabicText';
import {LineIcon} from './LineIcon';
import {LogoLockup} from './Logo';
import {SwooshUnderline} from './Swoosh';

const ROW_H = 118;

/**
 * Shared closing card (last ~3 s of every reel): logo → swoosh underline → CTA pill →
 * contact lines with icons (numbers stay LTR) → legal small print.
 * Everything sits between the Instagram safe zones (y 250 … 1600).
 */
export const CtaCard: React.FC<{cta: CtaContent}> = ({cta}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pill = pop(frame, fps, 22, 12, 130);
  const pulse = 1 + 0.025 * Math.sin(frame / 5);
  const shine = prog(frame, 40, 30, easeInOut);
  const out = prog(frame, 0, 10, easeOut);

  return (
    <AbsoluteFill style={{alignItems: 'center', opacity: out}}>
      <div style={{position: 'absolute', top: 285}}>
        <LogoLockup t={frame} size={0.95} />
      </div>
      <div style={{position: 'absolute', top: 700}}>
        <SwooshUnderline start={16} width={560} thickness={20} dur={20} />
      </div>

      {/* CTA pill */}
      <div
        style={{
          position: 'absolute',
          top: 790,
          transform: `scale(${(0.6 + 0.4 * pill) * pulse})`,
          opacity: Math.min(1, pill * 1.5),
          padding: '14px 58px 20px',
          borderRadius: 999,
          background: goldGradient,
          boxShadow: `0 0 ${50 + 20 * Math.sin(frame / 6)}px ${theme.colors.gold}66`,
          overflow: 'hidden',
        }}
      >
        <ArabicText size={52} weight={800} color={theme.colors.black}>
          {cta.headline}
        </ArabicText>
        <div
          style={{
            position: 'absolute', top: 0, bottom: 0, left: `${-30 + shine * 150}%`, width: '22%',
            background: 'linear-gradient(100deg, transparent, rgba(255,255,255,0.55), transparent)',
            transform: 'skewX(-20deg)',
          }}
        />
      </div>

      {cta.founder && (
        <div style={{position: 'absolute', top: 945, opacity: prog(frame, 30, 12, easeOut)}}>
          <ArabicText size={34} weight={700} color={theme.colors.goldLight}>
            {cta.founder}
          </ArabicText>
        </div>
      )}

      {/* contact lines */}
      <div style={{position: 'absolute', top: 1020, width: 900, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        {cta.contacts.map((c, i) => {
          const d = 34 + i * 9;
          const p = pop(frame, fps, d, 15, 120);
          const draw = prog(frame, d + 2, 16, easeInOut);
          return (
            <div
              key={i}
              dir="rtl"
              style={{
                height: ROW_H,
                width: 760,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 28,
                direction: 'rtl',
                opacity: Math.min(1, p * 1.6),
                transform: `translateX(${(1 - p) * 140}px)`,
                borderBottom: i < cta.contacts.length - 1 ? `1px solid ${theme.colors.gold}33` : 'none',
              }}
            >
              <div
                style={{
                  width: 84, height: 84, borderRadius: 42, flex: 'none',
                  border: `2px solid ${theme.colors.gold}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(201,151,28,0.08)',
                }}
              >
                <LineIcon name={c.icon} size={46} progress={draw} strokeWidth={1.6} />
              </div>
              <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0}}>
                {c.label && (
                  <ArabicText size={28} weight={700} color={theme.colors.goldLight} lineHeight={1.2}>
                    {c.label}
                  </ArabicText>
                )}
                <LtrText size={c.label ? 44 : 42} weight={600}>{c.value}</LtrText>
              </div>
            </div>
          );
        })}
      </div>

      {/* legal small print */}
      <div style={{position: 'absolute', top: 1522, opacity: prog(frame, 70, 14, easeOut) * 0.85, textAlign: 'center'}}>
        {cta.legal.split(' — ').map((line, i) => (
          <div
            key={i}
            style={{
              fontFamily: i === 0 ? theme.fonts.latin : theme.fonts.cjk,
              fontSize: 23,
              letterSpacing: i === 0 ? 1 : 3,
              color: theme.colors.goldLight,
              lineHeight: 1.6,
              opacity: 0.85,
            }}
          >
            {line}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
