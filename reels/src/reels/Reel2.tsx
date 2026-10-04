import React from 'react';
import {AbsoluteFill, Html5Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import content from '../../../content/reel2.json';
import {ArabicText, LtrText} from '../components/ArabicText';
import {Backdrop} from '../components/Backdrop';
import {Globe} from '../components/Globe';
import {LineIcon} from '../components/LineIcon';
import {LogoMark, Wordmark} from '../components/Logo';
import {rand} from '../lib/anim';
import {flash, lerp, mix, morph, shake, tw} from '../lib/gs';
import {DIGITS, ICON_SEQ, circlePath, place, rectPath} from '../lib/shapes';
import {goldGradient, theme} from '../theme';

/**
 * Reel 2 — Canton Fair 140, one continuous motion piece (30 s @ 30 fps).
 * Every scene hands one element to the next (bar → dot → globe → pin → "0" →
 * date pill → 3 cards → panel → tile → booths → floor plan), and the big
 * cuts sit on the track's hits: f3, f108, f420, f693, f867 (136 BPM).
 */
export const REEL2_FRAMES = 900;

const C = theme.colors;
const RED = '#E8402F';
const RED_DARK = '#9E1F14';
const AR = theme.fonts.arabic;
const LAT = theme.fonts.latin;

type Rect = {x: number; y: number; w: number; h: number; r: number};
const lerpRect = (a: Rect, b: Rect, t: number): Rect => ({x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t), r: lerp(a.r, b.r, t)});
const rp = (r: Rect) => rectPath(r.x, r.y, r.w, r.h, r.r);

const Row: React.FC<{top: number; children: React.ReactNode; style?: React.CSSProperties}> = ({top, children, style}) => (
  <div style={{position: 'absolute', left: 0, right: 0, top, display: 'flex', justifyContent: 'center', ...style}}>{children}</div>
);

/** Word-level kinetic type (never splits Arabic words). */
const Words: React.FC<{
  f: number;
  words: string[];
  start: number;
  stagger?: number;
  size: number;
  mode?: 'pop' | 'rise';
  gold?: number[];
  color?: string;
  dur?: number;
}> = ({f, words, start, stagger = 4, size, mode = 'rise', gold = [], color = C.white, dur = 14}) => (
  <div dir="rtl" style={{display: 'flex', flexDirection: 'row', direction: 'rtl', gap: size * 0.26, justifyContent: 'center'}}>
    {words.map((w, i) => {
      const s = start + i * stagger;
      const text = (
        <ArabicText size={size} weight={800} color={color} gold={gold.includes(i)} lineHeight={1.3}>
          {w}
        </ArabicText>
      );
      if (mode === 'pop') {
        const p = tw(f, s, dur, 'back.out(2.4)');
        const o = tw(f, s, 5, 'none');
        const b = 1 - tw(f, s, dur, 'power2.out');
        return (
          <div key={i} style={{opacity: o, transform: `scale(${0.35 + 0.65 * p})`, filter: `blur(${b * 18}px)`}}>
            {text}
          </div>
        );
      }
      const p = tw(f, s, dur, 'expo.out');
      return (
        <div key={i} style={{overflow: 'hidden', padding: `${size * 0.08}px ${size * 0.04}px`}}>
          <div style={{transform: `translateY(${(1 - p) * 120}%) rotate(${(1 - p) * 6}deg)`, opacity: Math.min(1, p * 3)}}>{text}</div>
        </div>
      );
    })}
  </div>
);

/** Exit helper: up + blur + fade. */
const out = (f: number, start: number, dur = 12, dist = -90): React.CSSProperties => {
  const e = tw(f, start, dur, 'power3.in');
  return e <= 0 ? {} : {opacity: 1 - e, transform: `translateY(${e * dist}px)`, filter: `blur(${e * 12}px)`};
};

/** Vertical "slot" roll between items: item k is in view between enter[k] and enter[k+1]. */
const roll = (f: number, enter: number, next: number | null) => {
  const i = tw(f, enter, 12, 'expo.inOut');
  const o = next === null ? 0 : tw(f, next, 12, 'expo.inOut');
  const blur = (Math.sin(Math.PI * Math.min(1, i)) + Math.sin(Math.PI * o)) * 7;
  return {transform: `translateY(${(1 - i) * 100 - o * 100}%)`, opacity: Math.min(1, i * 1.5) * (1 - o * o), filter: blur > 0.3 ? `blur(${blur}px)` : undefined} as React.CSSProperties;
};

// ════════════════════════════════════════════════════════════════════════════════════
// 1. HOOK  (f0 – f108)
// ════════════════════════════════════════════════════════════════════════════════════
const BAR: Rect = {x: 285, y: 958, w: 510, h: 224, r: 30};
const BAR_C = {x: 540, y: 1070};
const DOT = circlePath(BAR_C.x, BAR_C.y, 16);

const Hook: React.FC<{f: number}> = ({f}) => {
  if (f > 110) return null;
  const h = content.hook;
  const suck = tw(f, 84, 22, 'back.in(2.4)');
  const scale = 1 - 0.99 * suck;
  const textFade = 1 - tw(f, 92, 12, 'power2.in');

  const slam = tw(f, 0, 12, 'back.out(2.6)');
  const tag = tw(f, -7, 16, 'expo.out');
  const barIn = tw(f, 34, 10, 'expo.out');
  const word = tw(f, 37, 16, 'back.out(3)');
  const toDot = tw(f, 88, 16, 'power3.inOut');
  const beat = Math.max(0, 1 - Math.abs(f - 59) / 5) + Math.max(0, 1 - Math.abs(f - 72) / 5);

  const barPath = toDot > 0 ? morph(rp(BAR), DOT, toDot) : rectPath(BAR.x + BAR.w * (1 - barIn), BAR.y, BAR.w * barIn, BAR.h, BAR.r);

  return (
    <AbsoluteFill style={{transform: `scale(${scale})`, transformOrigin: `${BAR_C.x}px ${BAR_C.y}px`}}>
      <AbsoluteFill style={{opacity: textFade, filter: `blur(${suck * 16}px)`}}>
        {/* audience tag */}
        <Row top={452}>
          <div
            style={{
              clipPath: `inset(0 0 0 ${(1 - tag) * 100}%)`,
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              direction: 'rtl',
              padding: '8px 34px 12px',
              borderRadius: 999,
              border: `2px solid ${RED}`,
              background: 'rgba(232,64,47,0.12)',
            }}
          >
            <div style={{width: 18, height: 18, borderRadius: 9, background: RED, opacity: 0.4 + 0.6 * Math.abs(Math.sin(f / 5)), boxShadow: `0 0 14px ${RED}`}} />
            <ArabicText size={42} weight={800} color="#FFD9D3">
              {h.tag}
            </ArabicText>
          </div>
        </Row>
        {/* line 1 slams in on the very first hit — legible from frame 0 */}
        <Row top={575}>
          <div style={{transform: `scale(${1.1 - 0.1 * slam})`, filter: `blur(${(1 - Math.min(1, slam)) * 3}px)`, display: 'flex', gap: 34, direction: 'rtl'}}>
            <ArabicText size={128} weight={800}>{h.line1[0]}</ArabicText>
            <ArabicText size={128} weight={800} color={RED}>{h.line1[1]}</ArabicText>
          </div>
        </Row>
        <Row top={790}>
          <Words f={f} words={h.line2} start={20} stagger={4} size={104} />
        </Row>
        {/* down chevrons — micro loop on the beat */}
        <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
          {[0, 1, 2].map((k) => {
            const on = tw(f, 56 + k * 3, 8, 'power2.out');
            const wave = 0.35 + 0.65 * Math.max(0, Math.sin((f - k * 4) / 4.2));
            const y = 1250 + k * 34 + Math.sin(f / 4.2) * 6;
            return <path key={k} d={`M500 ${y} L540 ${y + 26} L580 ${y}`} fill="none" stroke={C.goldLight} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" opacity={on * wave} />;
          })}
        </svg>
      </AbsoluteFill>
      {/* the red bar — becomes the dot that becomes the globe */}
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        <g transform={`rotate(${-3 * (1 - toDot)} ${BAR_C.x} ${BAR_C.y})`}>
          <path d={barPath} fill={RED} style={{filter: `drop-shadow(0 0 ${30 + beat * 30}px ${RED}aa)`}} />
        </g>
      </svg>
      <Row top={BAR.y + 1} style={{opacity: textFade}}>
        <div style={{transform: `scale(${(0.3 + 0.7 * word) * (1 + beat * 0.07)}) rotate(${(1 - word) * -10 - 3}deg)`, opacity: Math.min(1, word * 4)}}>
          <ArabicText size={172} weight={800} lineHeight={1.2}>{h.punch}</ArabicText>
        </div>
      </Row>
    </AbsoluteFill>
  );
};

// ════════════════════════════════════════════════════════════════════════════════════
// 2. WORLD  (f104 – f224)  dot → dotted globe → routes converge on Guangzhou → zoom in
// ════════════════════════════════════════════════════════════════════════════════════
const GZ: [number, number] = [113.26, 23.13];
const CITIES: [number, number][] = [
  [46.7, 24.7], [55.3, 25.2], [31.2, 30.0], [47.98, 29.37], [51.53, 25.29], [58.4, 23.6], [39.2, 21.5], [44.36, 33.31],
  [28.97, 41.0], [37.6, 55.75], [-7.6, 33.57], [3.38, 6.52], [36.8, -1.29], [67.0, 24.86], [72.88, 19.07], [106.85, -6.2],
];
const GLOBE = {cx: 540, cy: 1070, r: 360};

const World: React.FC<{f: number}> = ({f}) => {
  if (f < 104 || f > 224) return null;
  const w = content.world;
  const ring = f < 108 ? 0.044 : 0.044 + 0.956 * tw(f, 108, 34, 'elastic.out(1, 0.42)');
  const reveal = tw(f, 110, 30, 'power2.out');
  const rot = tw(f, 112, 86, 'power2.inOut');
  const rotate: [number, number] = [lerp(-46, -GZ[0], rot), lerp(-18, -GZ[1], rot)];
  const zoom = tw(f, 194, 28, 'expo.in');
  const arcs = CITIES.map((c, i) => ({from: c, p: tw(f, 118 + i * 3.4, 30, 'power2.inOut')}));
  const count = Math.round(w.count * tw(f, 150, 32, 'power3.out'));
  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          transform: `scale(${1 + 9 * zoom})`,
          transformOrigin: `${GLOBE.cx}px ${GLOBE.cy}px`,
          opacity: 1 - tw(f, 212, 10, 'power1.in'),
          filter: zoom > 0.05 ? `blur(${zoom * 6}px)` : undefined,
        }}
      >
        <Globe {...GLOBE} rotate={rotate} reveal={reveal} ring={ring} arcs={arcs} target={GZ} targetPulse={tw(f, 176, 10, 'back.out(2)')} frame={f} />
      </AbsoluteFill>
      <div style={{...out(f, 186, 14, -110)}}>
        <Row top={318}>
          <Words f={f} words={w.lineA} start={114} stagger={6} size={104} mode="pop" gold={[1]} />
        </Row>
        <Row top={458}>
          <Words f={f} words={w.lineB} start={128} stagger={5} size={78} gold={[3]} />
        </Row>
      </div>
      <div style={{...out(f, 188, 14, 120)}}>
        <Row top={1468} style={{opacity: tw(f, 148, 8, 'none'), transform: `scale(${0.6 + 0.4 * tw(f, 148, 16, 'back.out(2)')})`}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 26, direction: 'rtl'}}>
            <LtrText size={124} weight={800} gold style={{lineHeight: 1.05}}>{`+${count}`}</LtrText>
            <ArabicText size={60} weight={800}>{w.countLabel}</ArabicText>
          </div>
        </Row>
      </div>
    </AbsoluteFill>
  );
};

// ════════════════════════════════════════════════════════════════════════════════════
// 3. FAIR 140  (f196 – f320)  the Guangzhou pin grows into the "0" of 140
// ════════════════════════════════════════════════════════════════════════════════════
const DS = 1.3; // digit scale
const DIGIT_X = [130, 410, 690];
const DIGIT_Y = 420;
const ZERO_RING = circlePath(GLOBE.cx, GLOBE.cy, 150);
const ZERO = place(DIGITS['0'], DS, DIGIT_X[2], DIGIT_Y);
const PILL: Rect = {x: 130, y: 1100, w: 820, h: 130, r: 65};

const mixColor = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(mix(v, pb[i], t))).join(',')})`;
};

const Fair: React.FC<{f: number}> = ({f}) => {
  if (f < 196 || f > 322) return null;
  const c = content.fair;
  const grow = tw(f, 196, 26, 'expo.in');
  const toZero = tw(f, 222, 22, 'expo.inOut');
  const strokeW = 44 * DS;
  const undraw = (k: number) => tw(f, 298 + k * 3, 12, 'power3.in');
  const drift = 1.07 - 0.07 * tw(f, 222, 90, 'power1.out');

  let zeroD: string;
  let zeroW: number;
  let zeroFill = 0;
  if (f < 222) {
    zeroD = circlePath(GLOBE.cx, GLOBE.cy, lerp(11, 150, grow));
    zeroW = lerp(22, strokeW, grow);
    zeroFill = 1 - tw(f, 204, 14, 'power2.in');
  } else {
    zeroD = morph(ZERO_RING, ZERO, toZero);
    zeroW = strokeW;
  }
  const zeroColor = mixColor(RED, C.gold, tw(f, 226, 18, 'power2.inOut'));

  const letters = c.latin.split('');
  return (
    <AbsoluteFill style={{transform: `scale(${drift})`, transformOrigin: '540px 900px'}}>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        <defs>
          <linearGradient id="dg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={C.goldLight} />
            <stop offset="0.5" stopColor={C.gold} />
            <stop offset="1" stopColor={C.goldDark} />
          </linearGradient>
        </defs>
        {(['1', '4'] as const).map((d, i) => {
          const draw = tw(f, 226 + i * 6, 18, 'power3.out') * (1 - undraw(i));
          if (draw <= 0) return null;
          return (
            <path
              key={d}
              d={place(DIGITS[d], DS, DIGIT_X[i], DIGIT_Y)}
              pathLength={1}
              strokeDasharray="1 1"
              strokeDashoffset={1 - draw}
              fill="none"
              stroke="url(#dg)"
              strokeWidth={strokeW}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{filter: `drop-shadow(0 0 22px ${C.gold}66)`}}
            />
          );
        })}
        <path
          d={zeroD}
          pathLength={1}
          strokeDasharray="1 1"
          strokeDashoffset={undraw(2)}
          fill={RED}
          fillOpacity={zeroFill}
          stroke={f < 244 ? zeroColor : 'url(#dg)'}
          strokeWidth={zeroW}
          strokeLinecap="round"
          style={{filter: `drop-shadow(0 0 ${f < 230 ? 30 : 22}px ${f < 230 ? RED : C.gold}88)`}}
        />
      </svg>
      <div style={out(f, 298, 12)}>
        <Row top={318}>
          <div style={{overflow: 'hidden'}}>
            <div style={{transform: `translateY(${(1 - tw(f, 232, 14, 'expo.out')) * 110}%)`}}>
              <ArabicText size={56} weight={800} color={C.goldLight}>{c.kicker}</ArabicText>
            </div>
          </div>
        </Row>
      </div>
      <div style={out(f, 300, 12)}>
        <Row top={830}>
          <Words f={f} words={c.name} start={238} stagger={5} size={126} gold={[1]} />
        </Row>
        <Row top={1012}>
          <div style={{display: 'flex', direction: 'ltr', alignItems: 'center', gap: 22}}>
            <div style={{width: 90 * tw(f, 250, 16, 'expo.out'), height: 3, background: C.gold}} />
            <div style={{display: 'flex', direction: 'ltr'}}>
              {letters.map((ch, i) => {
                const p = tw(f, 246 + i * 1.2, 12, 'back.out(2)');
                return (
                  <span key={i} style={{display: 'inline-block', width: ch === ' ' ? 26 : undefined, fontFamily: LAT, fontWeight: 800, fontSize: 44, letterSpacing: 14, color: C.goldLight, opacity: Math.min(1, p * 2), transform: `translateY(${(1 - p) * 40}px) scale(${0.6 + 0.4 * p})`}}>
                    {ch}
                  </span>
                );
              })}
            </div>
            <div style={{width: 90 * tw(f, 250, 16, 'expo.out'), height: 3, background: C.gold}} />
          </div>
        </Row>
      </div>
      {/* pill label (the pill itself is drawn by <Shell/>) */}
      <Row top={PILL.y + 22} style={{opacity: 1 - tw(f, 300, 8, 'power2.in')}}>
        <div style={{overflow: 'hidden'}}>
          <div style={{transform: `translateY(${(1 - tw(f, 268, 14, 'expo.out')) * 110}%)`}}>
            <ArabicText size={54} weight={800} lineHeight={1.25}>{c.dates}</ArabicText>
          </div>
        </div>
      </Row>
      <div style={out(f, 302, 12, 80)}>
        <Row top={1280} style={{opacity: tw(f, 278, 10, 'none'), transform: `translateY(${(1 - tw(f, 278, 16, 'expo.out')) * 40}px)`}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 16, direction: 'rtl'}}>
            <LineIcon name="pin" size={52} progress={tw(f, 278, 18, 'power2.out')} strokeWidth={2} />
            <ArabicText size={50} weight={700} color={C.goldLight}>{c.city}</ArabicText>
          </div>
        </Row>
      </div>
    </AbsoluteFill>
  );
};

// ════════════════════════════════════════════════════════════════════════════════════
// 4. SHELL — one shape that lives f258 → f662:
//    date pill → splits into 3 phase cards → card 1 opens into the panel → panel
//    collapses into a single gold tile (handed to the floor plan).
// ════════════════════════════════════════════════════════════════════════════════════
const CARDS: Rect[] = [0, 1, 2].map((i) => ({x: 90, y: 560 + i * 290, w: 900, h: 250, r: 40}));
const PANEL: Rect = {x: 60, y: 280, w: 960, h: 1330, r: 56};
const TILE: Rect = {x: 420, y: 840, w: 240, h: 240, r: 18};
const CARD_HIT = [363, 372, 384];
const PS = [420, 497, 572];
const PE = [497, 572, 645];

const shellRects = (f: number): {r: Rect; dy: number; o: number; s: number}[] => {
  if (f < 308) return [{r: PILL, dy: 0, o: 1, s: 1}];
  if (f < 420) {
    return CARDS.map((card, i) => {
      const p = tw(f, 308 + i * 4, 24, 'expo.inOut');
      const ant = tw(f, 406, 12, 'power2.inOut');
      return {r: lerpRect(PILL, card, p), dy: 0, o: i === 0 ? 1 : 1 - 0.45 * ant, s: i === 0 ? 1 - 0.035 * ant : 1};
    });
  }
  const fall = tw(f, 411, 13, 'power3.in');
  const open = tw(f, 420, 20, 'expo.out');
  const close = tw(f, 640, 20, 'expo.inOut');
  const first = close > 0 ? lerpRect(PANEL, TILE, close) : lerpRect(CARDS[0], PANEL, open);
  const rest = fall < 1 ? CARDS.slice(1).map((r) => ({r, dy: fall * 1000, o: 1 - fall, s: 1})) : [];
  return [{r: first, dy: 0, o: 1, s: 1}, ...rest];
};

const Shell: React.FC<{f: number}> = ({f}) => {
  if (f < 258 || f >= 662) return null;
  const draw = tw(f, 258, 18, 'power2.inOut');
  const fillIn = tw(f, 266, 12, 'power2.out');
  const gold = tw(f, 646, 14, 'power2.in');
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      <defs>
        <linearGradient id="shellStroke" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={C.goldLight} />
          <stop offset="0.5" stopColor={C.gold} stopOpacity="0.55" />
          <stop offset="1" stopColor={C.goldLight} />
        </linearGradient>
        <linearGradient id="shellFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2A2212" />
          <stop offset="1" stopColor="#141109" />
        </linearGradient>
      </defs>
      {shellRects(f).map(({r, dy, o, s}, i) => (
        <g key={i} opacity={o} transform={`translate(0 ${dy}) translate(${r.x + r.w / 2} ${r.y + r.h / 2}) scale(${s}) translate(${-(r.x + r.w / 2)} ${-(r.y + r.h / 2)})`}>
          <path d={rp(r)} fill="url(#shellFill)" fillOpacity={0.92 * fillIn} />
          {gold > 0 && i === 0 && <path d={rp(r)} fill={C.gold} fillOpacity={gold} />}
          <path d={rp(r)} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} fill="none" stroke="url(#shellStroke)" strokeWidth={3} />
        </g>
      ))}
    </svg>
  );
};

// ════════════════════════════════════════════════════════════════════════════════════
// 5. PHASES  (f318 – f650)
// ════════════════════════════════════════════════════════════════════════════════════
const NUM_S_CARD = 0.6;
const NUM_S_PANEL = 0.78;

const Phases: React.FC<{f: number}> = ({f}) => {
  if (f < 316 || f > 652) return null;
  const P = content.phases;
  const exitHead = tw(f, 405, 12, 'power3.in');

  // numeral that travels card 1 → panel and morphs 1 → 2 → 3
  const fly = tw(f, 420, 22, 'expo.out');
  const nx = lerp(820, 812, fly);
  const ny = lerp(CARDS[0].y + 35, 318, fly);
  const ns = lerp(NUM_S_CARD, NUM_S_PANEL, fly);
  const m12 = tw(f, PS[1] - 6, 14, 'expo.inOut');
  const m23 = tw(f, PS[2] - 6, 14, 'expo.inOut');
  const numD = m23 > 0 ? morph(DIGITS['2'], DIGITS['3'], m23) : morph(DIGITS['1'], DIGITS['2'], m12);
  const panelOut = tw(f, 634, 10, 'power2.in');

  // icon morph chain: chip 460, bolt 480, sofa 504, gift 526, vase 552, shirt 578, apple 600, heart 624
  const ends = [460, 480, 504, 526, 552, 578, 600, 624];
  let seg = 0;
  let mp = 0;
  for (let i = 0; i < ends.length; i++) {
    const p = tw(f, ends[i] - 12, 12, 'expo.inOut');
    if (p > 0) {
      seg = i;
      mp = p;
    }
  }
  const iconD = morph(ICON_SEQ[seg], ICON_SEQ[seg + 1], mp);
  const bump = Math.sin(Math.PI * mp);
  const iconIn = tw(f, 426, 18, 'back.out(2)');
  const iconOut = tw(f, 636, 12, 'power3.in');
  const phase = f < PS[1] ? 0 : f < PS[2] ? 1 : 2;

  return (
    <AbsoluteFill>
      {/* heading over the cards */}
      {f < 430 && (
        <div style={{opacity: 1 - exitHead, transform: `translateY(${-exitHead * 80}px)`, filter: `blur(${exitHead * 10}px)`}}>
          <Row top={300}>
            <div style={{transform: `scale(${0.4 + 0.6 * tw(f, 318, 16, 'back.out(2.2)')})`, opacity: tw(f, 318, 5, 'none')}}>
              <ArabicText size={124} weight={800} gold>{P.title}</ArabicText>
            </div>
          </Row>
          <Row top={462}>
            <Words f={f} words={P.subtitle.split(' ')} start={336} stagger={3} size={46} color={C.goldLight} />
          </Row>
        </div>
      )}

      {/* card contents */}
      {f < 432 &&
        P.items.map((it, i) => {
          const card = CARDS[i];
          const e = CARD_HIT[i];
          const fall = i > 0 ? tw(f, 411, 13, 'power3.in') : 0;
          const leave = i === 0 ? tw(f, 413, 7, 'power2.in') : 0;
          const draw = tw(f, e, 16, 'power3.out');
          const txt = tw(f, e + 2, 14, 'expo.out');
          const ant = tw(f, 406, 12, 'power2.inOut');
          return (
            <div key={i} style={{position: 'absolute', inset: 0, transform: `translateY(${fall * 1000}px)`, opacity: (1 - fall) * (i > 0 ? 1 - 0.45 * ant : 1)}}>
              {i > 0 && (
                <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
                  <path
                    d={place(DIGITS[String(i + 1)], NUM_S_CARD, 820, card.y + 35)}
                    pathLength={1}
                    strokeDasharray="1 1"
                    strokeDashoffset={1 - draw}
                    fill="none"
                    stroke={C.gold}
                    strokeWidth={44 * NUM_S_CARD}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
              <div style={{position: 'absolute', right: 290, top: card.y + 30, width: 620, opacity: 1 - leave}}>
                <div style={{overflow: 'hidden'}}>
                  <div style={{transform: `translateY(${(1 - txt) * 110}%)`}}>
                    <ArabicText size={64} weight={800} align="right" lineHeight={1.35}>{it.title}</ArabicText>
                  </div>
                </div>
                <div style={{overflow: 'hidden'}}>
                  <div style={{transform: `translateY(${(1 - tw(f, e + 5, 14, 'expo.out')) * 110}%)`}}>
                    <ArabicText size={48} weight={700} align="right" color={C.goldLight} lineHeight={1.35}>{it.dates}</ArabicText>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

      {/* the travelling numeral (card 1 → panel, then 1 → 2 → 3) */}
      {f >= CARD_HIT[0] && (
        <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible', opacity: 1 - panelOut}}>
          <g transform={`translate(${nx} ${ny}) scale(${ns})`}>
            <path
              d={numD}
              pathLength={1}
              strokeDasharray="1 1"
              strokeDashoffset={1 - tw(f, CARD_HIT[0], 16, 'power3.out')}
              fill="none"
              stroke={C.gold}
              strokeWidth={44}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{filter: `drop-shadow(0 0 16px ${C.gold}66)`}}
            />
          </g>
        </svg>
      )}

      {/* panel contents */}
      {f >= 424 && (
        <AbsoluteFill style={{opacity: 1 - panelOut}}>
          {/* header labels roll per phase */}
          {P.items.map((it, j) => {
            const leave = j < 2 ? PS[j + 1] : null;
            if (f < PS[j] - 7 || (leave !== null && f > leave + 8)) return null;
            return (
              <div key={j} style={{position: 'absolute', right: 300, top: 318, width: 640, overflow: 'hidden', padding: '6px 0'}}>
                <div style={roll(f, PS[j] - 6, leave === null ? null : leave - 6)}>
                  <ArabicText size={42} weight={700} align="right" color={C.goldLight} lineHeight={1.3}>{it.label}</ArabicText>
                  <ArabicText size={66} weight={800} align="right" lineHeight={1.3} style={{whiteSpace: 'nowrap'}}>{it.dates}</ArabicText>
                </div>
              </div>
            );
          })}

          {/* icon stage */}
          <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
            <defs>
              <linearGradient id="iconFill" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor={C.goldLight} />
                <stop offset="0.55" stopColor={C.gold} />
                <stop offset="1" stopColor={C.goldDark} />
              </linearGradient>
              <radialGradient id="stageGlow">
                <stop offset="0" stopColor={C.gold} stopOpacity="0.28" />
                <stop offset="1" stopColor={C.gold} stopOpacity="0" />
              </radialGradient>
            </defs>
            <g opacity={iconIn * (1 - iconOut)}>
              <circle cx={540} cy={800} r={300} fill="url(#stageGlow)" />
              <circle cx={540} cy={800} r={236} fill="none" stroke={C.gold} strokeOpacity={0.5} strokeWidth={2.5} strokeDasharray="4 16" strokeLinecap="round" transform={`rotate(${f * 0.9} 540 800)`} />
              <circle cx={540} cy={800} r={262} fill="none" stroke={C.gold} strokeOpacity={0.22} strokeWidth={1.5} pathLength={1} strokeDasharray={`${0.12 + 0.2 * ((f - 420) / 225)} 1`} transform={`rotate(${-f * 1.6} 540 800)`} />
              {/* orbiting accent */}
              <circle cx={540 + Math.cos(f / 9) * 236} cy={800 + Math.sin(f / 9) * 236} r={9} fill={RED} style={{filter: `drop-shadow(0 0 10px ${RED})`}} />
            </g>
            <g
              transform={`translate(540 800) scale(${0.95 * iconIn * (1 - 0.6 * iconOut) * (1 + 0.1 * bump)}) rotate(${-8 * bump}) translate(-200 -200)`}
              opacity={1 - iconOut}
            >
              <path d={iconD} fill="url(#iconFill)" fillRule="evenodd" style={{filter: `drop-shadow(0 18px 40px rgba(0,0,0,0.6)) drop-shadow(0 0 18px ${C.gold}55)`}} />
            </g>
          </svg>

          {/* phase title + chips */}
          {P.items.map((it, j) => {
            const leave = j < 2 ? PS[j + 1] : null;
            if (f < PS[j] - 7 || (leave !== null && f > leave + 8)) return null;
            const chipOut = leave !== null ? tw(f, leave - 8, 8, 'power3.in') : 0;
            return (
              <React.Fragment key={j}>
                <div style={{position: 'absolute', left: 0, right: 0, top: 1080, overflow: 'hidden', padding: '8px 0'}}>
                  <div style={roll(f, PS[j] - 5, leave === null ? null : leave - 5)}>
                    <ArabicText size={92} weight={800} gold lineHeight={1.3}>{it.title}</ArabicText>
                  </div>
                </div>
                <div dir="rtl" style={{position: 'absolute', left: 110, right: 110, top: 1240, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 18, direction: 'rtl'}}>
                  {it.chips.map((ch, k) => {
                    const p = tw(f, PS[j] + 3 + k * 3, 14, 'back.out(2.2)');
                    return (
                      <div
                        key={k}
                        style={{
                          padding: '6px 30px 12px',
                          borderRadius: 999,
                          border: `2px solid ${C.gold}88`,
                          background: 'rgba(201,151,28,0.10)',
                          transform: `scale(${(0.4 + 0.6 * p) * (1 - 0.5 * chipOut)})`,
                          opacity: Math.min(1, p * 2) * (1 - chipOut),
                        }}
                      >
                        <ArabicText size={42} weight={700} lineHeight={1.3}>{ch}</ArabicText>
                      </div>
                    );
                  })}
                </div>
              </React.Fragment>
            );
          })}

          {/* phase progress */}
          <div style={{position: 'absolute', top: 1528, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 20, direction: 'rtl'}}>
            {[0, 1, 2].map((j) => {
              const fill = tw(f, PS[j], PE[j] - PS[j], 'none');
              return (
                <div key={j} style={{width: 250, height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.12)', overflow: 'hidden', opacity: tw(f, 430 + j * 3, 10, 'none')}}>
                  <div style={{width: `${fill * 100}%`, height: '100%', marginLeft: 'auto', background: j === phase ? goldGradient : C.gold}} />
                </div>
              );
            })}
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

// ════════════════════════════════════════════════════════════════════════════════════
// 6. FLOOR  (f660 – f808) tile divides into booths → halls → 3D floor-plan flyover
// ════════════════════════════════════════════════════════════════════════════════════
const HALL = 376; // 8 booths × 40 + 7 gaps × 8
const PITCH = 416; // hall + 40 aisle
const COLS = 5;
const ROWS = 7;
const HC = {x: 2, y: 3};
const CENTRE = {x: HC.x * PITCH + HALL / 2, y: HC.y * PITCH + HALL / 2};
const LEVELS = [
  {n: 1, at: 0},
  {n: 2, at: 660},
  {n: 4, at: 669},
  {n: 8, at: 680},
];
const LIT = Array.from({length: 240}, (_, i) => {
  const hx = Math.floor(rand(i + 3) * COLS);
  const hy = Math.floor(rand(i + 71) * ROWS);
  const bx = Math.floor(rand(i + 151) * 8);
  const by = Math.floor(rand(i + 233) * 8);
  return {x: hx * PITCH + bx * 48, y: hy * PITCH + by * 48, t: 700 + rand(i + 9) * 80, red: rand(i + 5) < 0.18};
});

const Floor: React.FC<{f: number}> = ({f}) => {
  if (f < 660 || f > 810) return null;
  const grow = tw(f, 660, 30, 'power2.inOut');
  const hit = tw(f, 693, 26, 'expo.out');
  const drift = tw(f, 712, 80, 'power1.inOut');
  const exit = tw(f, 784, 22, 'power3.in');

  const S = lerp(lerp(240 / HALL, 1, grow), 1.55, hit);
  const rx = 62 * hit + 18 * exit;
  const rz = -14 * hit + 20 * drift;
  const sy = lerp(960, 1190, hit) + exit * 1600;
  const pan = {x: 140 * drift, y: -380 * drift};

  // central hall: booth subdivision
  let li = 0;
  LEVELS.forEach((l, i) => {
    if (f >= l.at) li = i;
  });
  const lvl = LEVELS[li];
  const size = (n: number) => (HALL - (n - 1) * 8) / n;
  const rad = [28, 18, 10, 4];
  const tiles: React.ReactNode[] = [];
  const cx0 = HC.x * PITCH;
  const cy0 = HC.y * PITCH;
  const solid = 1 - tw(f, 696, 20, 'power2.inOut');
  for (let i = 0; i < lvl.n; i++) {
    for (let j = 0; j < lvl.n; j++) {
      const t = size(lvl.n);
      const own = {x: i * (t + 8), y: j * (t + 8), w: t, h: t, r: rad[li]};
      let r = own;
      if (li > 0) {
        const pn = LEVELS[li - 1].n;
        const pt = size(pn);
        const par = {x: (i >> 1) * (pt + 8), y: (j >> 1) * (pt + 8), w: pt, h: pt, r: rad[li - 1]};
        const qq = tw(f, lvl.at + (i + j) * 0.35, 10, 'back.out(1.7)');
        r = lerpRect(par, own, li === 0 ? 1 : qq);
      }
      tiles.push(
        <rect key={`${i}-${j}`} x={cx0 + r.x} y={cy0 + r.y} width={Math.max(0, r.w)} height={Math.max(0, r.h)} rx={Math.max(0, r.r)} fill={C.gold} fillOpacity={0.22 + 0.78 * solid} stroke={C.goldLight} strokeOpacity={0.6} strokeWidth={1.2} />,
      );
    }
  }

  const halls: React.ReactNode[] = [];
  for (let hx = 0; hx < COLS; hx++) {
    for (let hy = 0; hy < ROWS; hy++) {
      if (hx === HC.x && hy === HC.y) continue;
      const dist = Math.hypot(hx - HC.x, hy - HC.y);
      const p = tw(f, 693 + dist * 4, 16, 'back.out(1.4)');
      if (p <= 0) continue;
      const ox = hx * PITCH, oy = hy * PITCH;
      halls.push(
        <g key={`${hx}-${hy}`} transform={`translate(${ox + HALL / 2} ${oy + HALL / 2}) scale(${p}) translate(${-HALL / 2} ${-HALL / 2})`} opacity={Math.min(1, p)}>
          <rect width={HALL} height={HALL} fill="url(#booth)" />
          <rect x={-6} y={-6} width={HALL + 12} height={HALL + 12} rx={10} fill="none" stroke={C.gold} strokeOpacity={0.35} strokeWidth={2} />
        </g>,
      );
    }
  }

  const fade = tw(f, 693, 20, 'power2.out');
  const mask = `linear-gradient(to bottom, rgba(0,0,0,${1 - fade}) 0%, rgba(0,0,0,${1 - fade}) 26%, #000 50%)`;

  return (
    <AbsoluteFill style={{perspective: 1500, perspectiveOrigin: '50% 30%', WebkitMaskImage: mask, maskImage: mask}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: COLS * PITCH,
          height: ROWS * PITCH,
          transformOrigin: '0 0',
          transform: `translate(540px, ${sy}px) rotateX(${rx}deg) rotateZ(${rz}deg) scale(${S}) translate(${-CENTRE.x - pan.x}px, ${-CENTRE.y - pan.y}px)`,
        }}
      >
        <svg width={COLS * PITCH} height={ROWS * PITCH} style={{overflow: 'visible'}}>
          <defs>
            <pattern id="booth" width={48} height={48} patternUnits="userSpaceOnUse">
              <rect width={40} height={40} rx={4} fill={C.gold} fillOpacity={0.2} stroke={C.goldLight} strokeOpacity={0.45} strokeWidth={1.2} />
            </pattern>
          </defs>
          {halls}
          {tiles}
          {LIT.map((l, i) => {
            const p = tw(f, l.t, 10, 'power2.out');
            if (p <= 0) return null;
            const col = l.red ? RED : C.goldLight;
            return <rect key={i} x={l.x} y={l.y} width={40} height={40} rx={4} fill={col} opacity={p * (0.75 + 0.25 * Math.sin(f / 4 + i))} style={{filter: `drop-shadow(0 0 8px ${col})`}} />;
          })}
        </svg>
      </div>
    </AbsoluteFill>
  );
};

const Stats: React.FC<{f: number}> = ({f}) => {
  if (f < 694 || f > 800) return null;
  const s = content.stats;
  const starts = [700, 730, 760];
  const ex = tw(f, 782, 12, 'power3.in');
  const fmt = (v: number, d: number) => (d ? v.toFixed(d) : Math.round(v).toLocaleString('en-US'));
  return (
    <AbsoluteFill style={{opacity: 1 - ex, transform: `translateY(${-ex * 120}px)`, filter: `blur(${ex * 10}px)`}}>
      <Row top={282}>
        <div style={{display: 'flex', alignItems: 'center', gap: 16, direction: 'rtl', opacity: tw(f, 696, 10, 'none'), transform: `translateY(${(1 - tw(f, 696, 14, 'expo.out')) * 30}px)`}}>
          <div style={{width: 14, height: 14, borderRadius: 7, background: RED, boxShadow: `0 0 12px ${RED}`}} />
          <ArabicText size={44} weight={800} color={C.goldLight}>{s.kicker}</ArabicText>
        </div>
      </Row>
      {s.items.map((it, k) => {
        const leave = k < 2 ? starts[k + 1] : null;
        if (f < starts[k] - 5 || (leave !== null && f > leave + 10)) return null;
        const v = it.value * tw(f, starts[k], 24, 'power3.out');
        return (
          <React.Fragment key={k}>
            <div style={{position: 'absolute', top: 370, left: 0, right: 0, overflow: 'hidden', display: 'flex', justifyContent: 'center'}}>
              <div style={roll(f, starts[k] - 4, leave === null ? null : leave - 4)}>
                <LtrText size={176} weight={800} gold style={{lineHeight: 1.1}}>{`${it.prefix}${fmt(v, it.decimals)}`}</LtrText>
              </div>
            </div>
            <div style={{position: 'absolute', top: 580, left: 0, right: 0, overflow: 'hidden', padding: '6px 0'}}>
              <div style={roll(f, starts[k] - 2, leave === null ? null : leave - 2)}>
                <ArabicText size={66} weight={800} lineHeight={1.3}>{it.label}</ArabicText>
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};

// ════════════════════════════════════════════════════════════════════════════════════
// 7. PITCH + CTA  (f786 – f900)
// ════════════════════════════════════════════════════════════════════════════════════
const ABAR: Rect = {x: 150, y: 606, w: 780, h: 176, r: 26};

const Pitch: React.FC<{f: number}> = ({f}) => {
  if (f < 786) return null;
  const p = content.pitch;
  const q = tw(f, 790, 14, 'back.out(2.2)');
  const bar = tw(f, 800, 10, 'expo.out');
  const ans = tw(f, 803, 14, 'back.out(2.6)');
  const pill = tw(f, 836, 18, 'back.out(1.8)');
  const hitPulse = f >= 867 ? Math.exp(-(f - 867) / 5) : 0;
  const shine = tw(f, 866, 18, 'power2.inOut');
  return (
    <AbsoluteFill>
      {/* logo */}
      <Row top={262}>
        <div style={{display: 'flex', direction: 'ltr', alignItems: 'center', gap: 22, transform: `scale(${0.9 + 0.1 * tw(f, 788, 20, 'expo.out')})`}}>
          <LogoMark t={f - 788} size={130} />
          <Wordmark t={f - 796} size={84} shimmerAt={60} letterDelay={2} />
        </div>
      </Row>
      <Row top={438}>
        <div style={{transform: `scale(${1.6 - 0.6 * q})`, opacity: Math.min(1, q * 3), filter: `blur(${(1 - Math.min(1, q)) * 14}px)`}}>
          <ArabicText size={112} weight={800}>{p.question}</ArabicText>
        </div>
      </Row>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <g transform={`rotate(-2.5 540 ${ABAR.y + ABAR.h / 2})`}>
          <path d={rectPath(ABAR.x + ABAR.w * (1 - bar), ABAR.y, ABAR.w * bar, ABAR.h, ABAR.r)} fill={RED} style={{filter: `drop-shadow(0 0 40px ${RED}88)`}} />
        </g>
      </svg>
      <Row top={ABAR.y + 12}>
        <div style={{transform: `scale(${0.3 + 0.7 * ans}) rotate(${(1 - ans) * -8 - 2.5}deg)`, opacity: Math.min(1, ans * 4)}}>
          <ArabicText size={122} weight={800} lineHeight={1.2}>{p.answer}</ArabicText>
        </div>
      </Row>
      {p.points.map((pt, i) => {
        const s = 812 + i * 6;
        const e = tw(f, s, 14, 'expo.out');
        const chk = tw(f, s + 4, 12, 'power2.out');
        return (
          <div key={i} dir="rtl" style={{position: 'absolute', top: 838 + i * 98, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 22, direction: 'rtl', width: 720, opacity: Math.min(1, e * 2), transform: `translateX(${(1 - e) * 160}px)`}}>
              <svg width={62} height={62} viewBox="0 0 62 62">
                <circle cx={31} cy={31} r={28} fill="rgba(201,151,28,0.14)" stroke={C.gold} strokeWidth={2.5} />
                <path d="M18 32 L27 41 L45 22" fill="none" stroke={C.goldLight} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - chk} />
              </svg>
              <ArabicText size={50} weight={800} align="right" lineHeight={1.3}>{pt}</ArabicText>
            </div>
          </div>
        );
      })}
      {/* WhatsApp CTA */}
      <Row top={1150}>
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            transform: `scale(${(0.5 + 0.5 * pill) * (1 + 0.07 * hitPulse)})`,
            opacity: Math.min(1, pill * 2),
            display: 'flex',
            alignItems: 'center',
            gap: 26,
            direction: 'rtl',
            padding: '18px 54px 22px',
            borderRadius: 999,
            background: goldGradient,
            boxShadow: `0 0 ${40 + 60 * hitPulse}px ${C.gold}${hitPulse > 0.2 ? 'cc' : '66'}`,
          }}
        >
          <div style={{width: 92, height: 92, borderRadius: 46, background: C.black, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <LineIcon name="whatsapp" size={56} progress={tw(f, 842, 16, 'power2.out')} strokeWidth={1.8} />
          </div>
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start'}}>
            <ArabicText size={34} weight={800} color={C.black} lineHeight={1.2}>{p.whatsappLabel}</ArabicText>
            <LtrText size={58} weight={800} color={C.black} style={{lineHeight: 1.1}}>{p.whatsapp}</LtrText>
          </div>
          <div style={{position: 'absolute', top: 0, bottom: 0, left: `${-30 + shine * 160}%`, width: '24%', background: 'linear-gradient(100deg, transparent, rgba(255,255,255,0.7), transparent)', transform: 'skewX(-20deg)'}} />
        </div>
      </Row>
      <Row top={1336} style={{opacity: tw(f, 850, 12, 'none'), transform: `translateY(${(1 - tw(f, 850, 16, 'expo.out')) * 30}px)`}}>
        <div style={{fontFamily: LAT, fontWeight: 600, fontSize: 32, color: C.goldLight, letterSpacing: 1, direction: 'ltr'}}>{p.footer}</div>
      </Row>
    </AbsoluteFill>
  );
};

// ════════════════════════════════════════════════════════════════════════════════════
// Background grid (parallax + depth during the zooms)
// ════════════════════════════════════════════════════════════════════════════════════
const Grid: React.FC<{f: number}> = ({f}) => {
  const z = 1 + 1.6 * tw(f, 194, 28, 'expo.in') * (1 - tw(f, 222, 30, 'expo.out')) + 0.4 * tw(f, 693, 26, 'expo.out') * (1 - tw(f, 786, 20, 'power2.inOut'));
  return (
    <AbsoluteFill style={{transform: `scale(${z})`, opacity: 0.9}}>
      <svg width={1080} height={1920}>
        <defs>
          <pattern id="bggrid" width={60} height={60} patternUnits="userSpaceOnUse" patternTransform={`translate(${(f * 0.35) % 60} ${(f * 0.9) % 60})`}>
            <path d="M60 0 L0 0 L0 60" fill="none" stroke={C.gold} strokeOpacity={0.07} strokeWidth={1} />
          </pattern>
          <radialGradient id="gridFade" cx="50%" cy="50%" r="60%">
            <stop offset="0" stopColor="#fff" />
            <stop offset="1" stopColor="#000" />
          </radialGradient>
          <mask id="gridMask">
            <rect width={1080} height={1920} fill="url(#gridFade)" />
          </mask>
        </defs>
        <rect width={1080} height={1920} fill="url(#bggrid)" mask="url(#gridMask)" />
      </svg>
    </AbsoluteFill>
  );
};

// ════════════════════════════════════════════════════════════════════════════════════
export const Reel2: React.FC = () => {
  const f = useCurrentFrame();
  const sh = shake(f, [[1, 16], [22, 5], [37, 12], [59, 4], [72, 5], [108, 18], [420, 14], [693, 18], [804, 8], [867, 12]]);
  const redGlow = flash(f, [1, 37, 108], 12);
  const white = flash(f, [108, 420, 693, 867], 8);
  return (
    <AbsoluteFill style={{background: C.black, overflow: 'hidden'}}>
      <Backdrop tint={0.8} />
      <Grid f={f} />
      <AbsoluteFill style={{background: `radial-gradient(700px 700px at 50% 52%, ${RED}${Math.round(redGlow * 90).toString(16).padStart(2, '0')}, transparent 70%)`}} />
      <AbsoluteFill style={{transform: `translate(${sh.x}px, ${sh.y}px) rotate(${sh.r}deg)`}}>
        <World f={f} />
        <Floor f={f} />
        <Shell f={f} />
        <Fair f={f} />
        <Phases f={f} />
        <Stats f={f} />
        <Pitch f={f} />
        <Hook f={f} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: `radial-gradient(900px 900px at 50% 50%, rgba(255,240,200,${white * 0.32}), transparent 70%)`, pointerEvents: 'none'}} />
      <AbsoluteFill style={{background: 'linear-gradient(to bottom, rgba(0,0,0,0.35), transparent 12%, transparent 86%, rgba(0,0,0,0.45))'}} />
      <Html5Audio
        src={staticFile(content.music)}
        volume={(fr) => interpolate(fr, [0, 2, REEL2_FRAMES - 14, REEL2_FRAMES], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}
      />
    </AbsoluteFill>
  );
};

