import React from 'react';
import {C, FONT} from './brand';
import {clamp, ramp} from './lib';
import {phrases, words} from './timing';

/**
 * Karaoke subtitle panel — one phrase at a time, current word glows gold.
 * Words are separate inline spans (never split inside a word, Arabic shaping intact).
 * Phrases whose words are already on screen as hero type are listed in HIDE.
 */
const HIDE = new Set<number>([0, 18, 19, 20, 21]);

export const Subtitles: React.FC<{t: number; y?: number}> = ({t, y = 1508}) => {
  const idx = phrases.findIndex((p, i) => {
    const next = phrases[i + 1];
    const until = next ? Math.min(next.start - 0.08, p.end + 0.6) : p.end + 0.6;
    return t >= p.start - 0.12 && t < until;
  });
  if (idx < 0 || HIDE.has(idx)) return null;
  const p = phrases[idx];
  const next = phrases[idx + 1];
  const until = next ? Math.min(next.start - 0.08, p.end + 0.6) : p.end + 0.6;
  const inP = ramp(t, p.start - 0.12, p.start + 0.16);
  const outP = ramp(t, until - 0.16, until);
  const o = clamp(inP - outP);
  const ws = p.words.map((i) => words[i]);
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: y,
        display: 'flex',
        justifyContent: 'center',
        transform: `translateY(-50%) translateY(${(1 - inP) * 14}px)`,
        opacity: o,
        zIndex: 900000,
      }}
    >
      <div
        dir="rtl"
        style={{
          padding: '16px 34px 20px',
          borderRadius: 22,
          background: 'linear-gradient(180deg, rgba(14,15,18,0.62), rgba(8,9,11,0.74))',
          border: '1px solid rgba(233,207,143,0.30)',
          boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
          backdropFilter: 'blur(14px)',
          maxWidth: 940,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          columnGap: 14,
          rowGap: 2,
        }}
      >
        {ws.map((w, k) => {
          const nextStart = ws[k + 1]?.start ?? w.end + 0.25;
          const active = t >= w.start - 0.04 && t < nextStart - 0.02;
          const said = t >= w.start - 0.04;
          const glow = active ? 1 - ramp(t, w.start, nextStart + 0.3) * 0.35 : 0;
          return (
            <span
              key={w.i}
              style={{
                fontFamily: w.text.match(/[A-Z]/) ? FONT.la : FONT.ar,
                fontWeight: 700,
                fontSize: 44,
                lineHeight: 1.45,
                whiteSpace: 'nowrap',
                color: active ? C.goldLight : said ? 'rgba(255,255,255,0.96)' : 'rgba(255,255,255,0.46)',
                textShadow: active ? `0 0 ${18 * glow}px rgba(240,200,110,${0.55 * glow})` : 'none',
              }}
            >
              {w.text}
            </span>
          );
        })}
      </div>
    </div>
  );
};
