import React from 'react';
import {C, FONT} from '../film/brand';
import {clamp, ramp} from '../film/lib';
import {phrases, words} from '../v2/t2';

/**
 * Reading subtitles (hybrid system, layer B). Calm, phrase-level, max two lines, RTL,
 * never splitting words. Words already present as hero typography are de-emphasised;
 * one key word per card may turn gold. A hairline shows progress. A barely-there glass
 * plate appears only where the picture is bright.
 */
const DIAC = /[ً-ْٰـ.,،…]/g;
const n = (s: string) => s.replace(DIAC, '');

type Card = {lines: number[]; gold?: string; dim?: string[]; glass?: boolean};
const CARDS: Card[] = [
  {lines: [0], gold: 'بالفرص', dim: ['الصين']},
  {lines: [1, 2], dim: ['المورد', 'الصحيح']},
  {lines: [3], gold: 'قوانزو'},
  {lines: [4], dim: ['السوق'], glass: true},
  {lines: [5], gold: 'المناسبة', glass: true},
];

export const SubsV3: React.FC<{t: number; y?: number; end: number}> = ({t, y = 1478, end}) => {
  const span = CARDS.map((c, i) => {
    const first = words[phrases[c.lines[0]].words[0]];
    const lastP = phrases[c.lines[c.lines.length - 1]];
    const next = CARDS[i + 1] ? words[phrases[CARDS[i + 1].lines[0]].words[0]].start : end + 1;
    return {a: first.start - 0.14, b: Math.min(next - 0.1, lastP.end + 0.5)};
  });
  const idx = span.findIndex((s) => t >= s.a && t < s.b);
  if (idx < 0) return null;
  const card = CARDS[idx];
  const {a, b} = span[idx];
  const o = clamp(ramp(t, a, a + 0.22) - ramp(t, b - 0.18, b));
  const ws = card.lines.flatMap((li) => phrases[li].words.map((wi) => words[wi]));
  const p0 = ws[0].start, p1 = ws[ws.length - 1].end + 0.1;
  const prog = ramp(t, p0, p1, (x) => x);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: y, display: 'flex', justifyContent: 'center', transform: `translateY(-50%) translateY(${(1 - ramp(t, a, a + 0.3)) * 8}px)`, opacity: o, zIndex: 900000}}>
      <div
        dir="rtl"
        style={{
          maxWidth: 900,
          padding: card.glass ? '12px 26px 16px' : '6px 10px 10px',
          borderRadius: 14,
          background: card.glass ? 'rgba(10,12,16,0.30)' : 'transparent',
          backdropFilter: card.glass ? 'blur(10px)' : undefined,
          border: card.glass ? '1px solid rgba(246,238,222,0.07)' : '1px solid transparent',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0,
        }}
      >
        {card.lines.map((li) => (
          <div key={li} style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: 12}}>
            {phrases[li].words.map((wi) => {
              const w = words[wi];
              const said = t >= w.start - 0.03;
              const nextStart = words[wi + 1]?.start ?? w.end + 0.3;
              const current = said && t < nextStart;
              const isGold = card.gold && n(w.text) === card.gold && said;
              const isDim = card.dim?.some((d) => n(w.text) === d);
              const base = isDim ? 0.62 : 1;
              const op = said ? base : 0.42 * base;
              return (
                <span
                  key={wi}
                  style={{
                    fontFamily: FONT.ar,
                    fontWeight: 600,
                    fontSize: 40,
                    lineHeight: 1.55,
                    whiteSpace: 'nowrap',
                    color: isGold ? C.goldLight : current ? '#FFFFFF' : '#EFEAE0',
                    opacity: op,
                    textShadow: '0 2px 14px rgba(0,0,0,0.85), 0 0 2px rgba(0,0,0,0.6)',
                  }}
                >
                  {w.text}
                </span>
              );
            })}
          </div>
        ))}
        <div style={{alignSelf: 'stretch', height: 1, marginTop: 4, background: 'rgba(246,238,222,0.12)', position: 'relative', direction: 'rtl'}}>
          <div style={{position: 'absolute', right: 0, top: 0, height: 1, width: `${prog * 100}%`, background: 'rgba(246,238,222,0.45)'}} />
          <div style={{position: 'absolute', right: `calc(${prog * 100}% - 3px)`, top: -2, width: 5, height: 5, borderRadius: 3, background: C.gold, opacity: prog > 0 && prog < 1 ? 1 : 0}} />
        </div>
      </div>
    </div>
  );
};
