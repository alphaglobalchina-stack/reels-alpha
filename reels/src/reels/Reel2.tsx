import React from 'react';
import {AbsoluteFill, Html5Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import content from '../../../content/reel2.json';
import {ArabicText, LtrText} from '../components/ArabicText';
import {Backdrop} from '../components/Backdrop';
import {Wordmark} from '../components/Logo';
import {RealMark} from '../components/RealMark';
import {RouteMap, routeMapHeight} from '../components/RouteMap';
import {GoldDefs, SwooshUnderline, SwooshWipe, useSafeId} from '../components/Swoosh';
import {easeIn, easeInOut, easeOut, pop, prog, rand, smoothPath} from '../lib/anim';
import {goldGradient, theme} from '../theme';

const F = 30;
const sec = (s: number) => Math.round(s * F);
const S = content.scenes;
export const reel2Frames = sec(content.duration);

const gold = theme.colors.gold;
const goldLight = theme.colors.goldLight;
const latin = theme.fonts.latin;
const photo = (p: string) => staticFile(p);

const PHOTOS = [
  'city', 'cmp', 'cnc', 'flat', 'fryer', 'insp', 'line', 'man', 'pack', 'plane', 'show', 'still', 'ware',
].map((n) => `photos16/${n}.jpg`);

/** Loads every photo up-front so no frame ever renders before an image is ready. */
const Preload: React.FC = () => (
  <div style={{position: 'absolute', opacity: 0, width: 1, height: 1, overflow: 'hidden'}}>
    {PHOTOS.map((p) => (
      <Img key={p} src={photo(p)} />
    ))}
  </div>
);

const hex = (n: number) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0');

// ───────────────────────── Scene 1 · logo construction ─────────────────────────
const SceneLogo: React.FC = () => {
  const frame = useCurrentFrame();
  const draw = prog(frame, 0, 24, easeInOut);
  const guideFade = 1 - prog(frame, 24, 16, easeOut);
  const spin = frame * 1.4;
  const hit = prog(frame, 36, 18, easeOut);
  const pulse = 1 + 0.07 * Math.sin(Math.PI * Math.min(1, hit * 1.6)) * (1 - hit);
  const dash = (p: number) => ({pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - p} as const);
  const cx = 540, cy = 800;
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: guideFade}}>
        <g transform={`rotate(${spin} ${cx} ${cy})`} fill="none" stroke={goldLight} strokeLinecap="round">
          <circle cx={cx} cy={cy} r={330} strokeWidth={2.5} opacity={0.7} {...dash(draw)} />
          <circle cx={cx} cy={cy} r={204} strokeWidth={2.5} opacity={0.55} {...dash(prog(frame, 4, 22, easeInOut))} />
          <circle cx={cx} cy={cy} r={126} strokeWidth={2.5} opacity={0.4} {...dash(prog(frame, 8, 22, easeInOut))} />
          <path d={`M${cx - 520} ${cy} L${cx + 520} ${cy}`} strokeWidth={2} opacity={0.5} {...dash(prog(frame, 2, 18, easeOut))} />
          <path d={`M${cx} ${cy - 520} L${cx} ${cy + 520}`} strokeWidth={2} opacity={0.5} {...dash(prog(frame, 4, 18, easeOut))} />
          <path d={`M${cx - 400} ${cy + 400} L${cx + 400} ${cy - 400}`} strokeWidth={2} opacity={0.35} {...dash(prog(frame, 6, 18, easeOut))} />
          {[[330, 0], [-330, 0], [0, 330], [0, -330], [204, 0], [-204, 0]].map(([dx, dy], i) => (
            <circle key={i} cx={cx + dx} cy={cy + dy} r={9 * prog(frame, 14 + i * 2, 8, easeOut)} fill={gold} stroke="none" />
          ))}
        </g>
      </svg>
      <div style={{position: 'absolute', left: 0, right: 0, top: cy, display: 'flex', justifyContent: 'center', transform: `translateY(-50%) scale(${pulse})`}}>
        <RealMark t={frame * 1.5} size={560} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1130, display: 'flex', justifyContent: 'center', transform: `scale(${pulse})`}}>
        <Wordmark t={(frame - 14) * 1.4} size={190} shimmerAt={16} letterDelay={3} />
      </div>
      {/* shockwave when the mark locks */}
      {frame >= 36 && (
        <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
          <circle cx={cx} cy={cy} r={140 + hit * 760} fill="none" stroke={goldLight} strokeWidth={14 * (1 - hit) + 1} opacity={(1 - hit) * 0.9} />
          <circle cx={cx} cy={cy} r={80 + hit * 520} fill="none" stroke={gold} strokeWidth={8 * (1 - hit) + 1} opacity={(1 - hit) * 0.7} />
        </svg>
      )}
    </AbsoluteFill>
  );
};

// ───────────────────────── Scene 2 · rhythmic typography ─────────────────────────
type Word = {en: string; ar: string; photo?: string};
const WORDS: Word[] = [
  ...content.words,
  {en: 'FROM', ar: 'من', photo: 'photos16/city.jpg'},
  {en: 'CHINA', ar: 'الصين', photo: 'photos16/cnc.jpg'},
  {en: 'TO YOU', ar: 'إليك', photo: 'photos16/man.jpg'},
];
const BEAT = 15;

const SlamWord: React.FC<{w: Word; i: number}> = ({w, i}) => {
  const frame = useCurrentFrame();
  const f = frame - i * BEAT;
  if (f < 0 || f >= BEAT) return null;
  const inP = 0.3 + 0.7 * prog(f, 0, 6, easeOut);
  const outP = prog(f, BEAT - 3, 3, easeIn);
  const size = Math.min(250, 920 / (w.en.length * 0.8));
  const dir = i % 2 ? 1 : -1;
  const reveal = prog(f, 0, 5, easeOut);
  const ar = prog(f, 3, 7, easeOut);
  const cardClip = i % 2 ? `inset(0 0 ${(1 - reveal) * 100}% 0)` : `inset(${(1 - reveal) * 100}% 0 0 0)`;
  return (
    <AbsoluteFill style={{clipPath: `inset(0 0 ${outP * 55}% 0)`}}>
      {/* photo card */}
      <div style={{position: 'absolute', left: 70, top: 300, width: 940, height: 980, borderRadius: 40, overflow: 'hidden', clipPath: cardClip, boxShadow: `0 0 80px ${gold}55, inset 0 0 0 3px ${gold}`}}>
        <Img src={photo(w.photo!)} style={{position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.28 - f * 0.012}) translateX(${dir * (14 - f * 2)}px)`}} />
        <div style={{position: 'absolute', inset: 0, background: `linear-gradient(180deg, transparent 38%, ${theme.colors.deep}f0 100%)`}} />
        <div style={{position: 'absolute', inset: 0, background: `linear-gradient(145deg, ${gold}55, transparent 55%)`, mixBlendMode: 'multiply'}} />
      </div>
      {/* word */}
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-start'}}>
        <div style={{position: 'absolute', top: 1010, transform: `translateX(${(1 - inP) * 220 * dir}px) scale(${1.7 - 0.7 * inP})`, filter: `blur(${(1 - inP) * 26}px)`, opacity: Math.min(1, inP * 2.4)}}>
          <div style={{position: 'absolute', inset: 0, transform: `scale(${1.08 + 0.1 * (1 - inP)})`, opacity: 0.3 * (1 - outP), WebkitTextStroke: `3px ${goldLight}`, color: 'transparent', fontFamily: latin, fontWeight: 800, fontSize: size, lineHeight: 1, whiteSpace: 'nowrap', letterSpacing: '-0.02em'}}>
            {w.en}
          </div>
          <div style={{fontFamily: latin, fontWeight: 800, fontSize: size, lineHeight: 1, whiteSpace: 'nowrap', letterSpacing: '-0.02em', color: theme.colors.white, textShadow: `0 0 40px ${gold}aa, 0 8px 30px #000c`}}>
            {w.en}
          </div>
        </div>
        <div style={{position: 'absolute', top: 1290 + (1 - ar) * 30, opacity: ar}}>
          <ArabicText size={124} weight={800} gold>{w.ar}</ArabicText>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const SceneType: React.FC = () => {
  const frame = useCurrentFrame();
  const beat = (frame % BEAT) / BEAT;
  const idx = Math.floor(frame / BEAT);
  const ring = prog(frame % BEAT, 0, 12, easeOut);
  const flash = 1 - prog(frame, 0, 9, easeOut);
  return (
    <AbsoluteFill>
      <Backdrop tint={1.4 + 0.6 * (1 - beat)} />
      {/* beat shockwave behind the word */}
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <circle cx={540} cy={1060} r={120 + ring * 760} fill="none" stroke={gold} strokeWidth={10 * (1 - ring) + 1} opacity={(1 - ring) * 0.6} />
        {/* bars that sweep on every beat */}
        {[0, 1, 2].map((k) => {
          const dir = (idx + k) % 2 ? 1 : -1;
          const x = (dir === 1 ? -1 : 1) * 1200 * (1 - prog(frame % BEAT, 0, 10, easeOut)) + (dir === 1 ? 0 : 0);
          return <rect key={k} x={dir === 1 ? -100 + x : 380 + x} y={420 + k * 460} width={800} height={14} fill={goldLight} opacity={0.25 * (1 - beat)} />;
        })}
      </svg>
      {WORDS.map((w, i) => (
        <SlamWord key={i} w={w} i={i} />
      ))}
      <AbsoluteFill style={{background: `rgba(255,236,170,${flash * 0.85})`}} />
    </AbsoluteFill>
  );
};

// ───────────────────────── Scene 3 · animated infographic ─────────────────────────
const NODES = content.steps.map((s, i) => ({...s, cx: i % 2 ? 780 : 300, cy: 405 + i * 355, enter: 5 + i * 30}));
const FLOW = smoothPath(NODES.map((n) => [n.cx, n.cy] as [number, number]), 0.9);

const SceneInfo: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const id = useSafeId('flow');
  const p = interpolate(frame, [5, 35, 65, 95], [0, 1 / 3, 2 / 3, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeInOut});
  return (
    <AbsoluteFill>
      <Backdrop />
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <GoldDefs id={id} />
        <path d={FLOW} fill="none" stroke={gold} strokeWidth={34} opacity={0.18} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} strokeLinecap="round" style={{filter: 'blur(14px)'}} />
        <path d={FLOW} fill="none" stroke={`url(#${id})`} strokeWidth={12} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} strokeLinecap="round" />
      </svg>
      {NODES.map((n, i) => {
        const t = frame - n.enter;
        if (t < -2) return null;
        const s = pop(frame, fps, n.enter, 12, 130);
        const ringP = prog(t, 0, 22, easeInOut);
        const R = 160;
        const circ = 2 * Math.PI * (R + 22);
        const left = n.cx < 540;
        const lab = prog(t, 5, 14, easeOut);
        const orbit = (frame * 3 + i * 90) * (Math.PI / 180);
        return (
          <React.Fragment key={i}>
            <div style={{position: 'absolute', left: n.cx - R, top: n.cy - R, width: R * 2, height: R * 2, transform: `scale(${s})`, opacity: Math.min(1, s * 2)}}>
              <div style={{width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', boxShadow: `0 0 60px ${gold}77`}}>
                <Img src={photo(n.photo)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.35 - 0.2 * prog(t, 0, 50, easeOut)})`, filter: 'saturate(0.95) contrast(1.05)'}} />
                <div style={{position: 'absolute', inset: 0, borderRadius: '50%', background: `linear-gradient(160deg, ${gold}44, transparent 60%)`}} />
              </div>
              <svg width={R * 2 + 80} height={R * 2 + 80} style={{position: 'absolute', left: -40, top: -40, overflow: 'visible', transform: 'rotate(-90deg)'}}>
                <circle cx={R + 40} cy={R + 40} r={R + 22} fill="none" stroke={`url(#${id})`} strokeWidth={8} strokeDasharray={circ} strokeDashoffset={circ * (1 - ringP)} strokeLinecap="round" />
              </svg>
              <svg width={R * 2 + 80} height={R * 2 + 80} style={{position: 'absolute', left: -40, top: -40, overflow: 'visible'}}>
                <circle cx={R + 40 + Math.cos(orbit) * (R + 22)} cy={R + 40 + Math.sin(orbit) * (R + 22)} r={11} fill={goldLight} style={{filter: `drop-shadow(0 0 10px ${gold})`}} opacity={ringP} />
              </svg>
            </div>
            <div
              style={{
                position: 'absolute',
                top: n.cy - 135,
                width: 520,
                ...(left ? {left: n.cx + R + 50, textAlign: 'left'} : {left: n.cx - R - 50 - 520, textAlign: 'right'}),
                opacity: lab,
                transform: `translateX(${(1 - lab) * (left ? 60 : -60)}px)`,
              }}
            >
              <div style={{fontFamily: latin, fontWeight: 800, fontSize: 130, lineHeight: 1, color: 'transparent', WebkitTextStroke: `3px ${gold}`}}>{`0${i + 1}`}</div>
              <div style={{fontFamily: latin, fontWeight: 800, fontSize: 74, lineHeight: 1.15, color: theme.colors.white, letterSpacing: '0.01em'}}>{n.en}</div>
              <ArabicText size={72} weight={800} gold align={left ? 'left' : 'right'} lineHeight={1.2}>
                {n.ar}
              </ArabicText>
            </div>
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};

// ───────────────────────── Scene 4 · route infographic ─────────────────────────
const STRIP = ['city', 'ware', 'show', 'still', 'flat', 'fryer', 'man'].map((n) => `photos16/${n}.jpg`);

const BigWord: React.FC<{text: string; start: number; end?: number; style?: React.CSSProperties; size?: number; outline?: boolean; from?: number}> = ({text, start, end, style, size = 190, outline, from = -1}) => {
  const frame = useCurrentFrame();
  const f = frame - start;
  if (f < 0 || (end !== undefined && frame >= end)) return null;
  const p = prog(f, 0, 9, easeOut);
  const out = end !== undefined ? prog(frame, end - 4, 4, easeIn) : 0;
  const fill: React.CSSProperties = outline
    ? {color: 'transparent', WebkitTextStroke: `4px ${gold}`}
    : {backgroundImage: goldGradient, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', WebkitTextFillColor: 'transparent'};
  return (
    <div style={{position: 'absolute', fontFamily: latin, fontWeight: 800, fontSize: size, lineHeight: 1, whiteSpace: 'nowrap', transform: `translateX(${(1 - p) * 300 * from}px) scale(${1.25 - 0.25 * p})`, filter: `blur(${(1 - p) * 20}px) drop-shadow(0 0 22px ${gold}77)`, opacity: Math.min(1, p * 3) * (1 - out), ...fill, ...style}}>
      {text}
    </div>
  );
};

const SceneRoute: React.FC = () => {
  const frame = useCurrentFrame();
  const mapIn = prog(frame, 0, 18, easeOut);
  const pulse = (n: number) => 1 + 0.045 * Math.exp(-((frame - n) % BEAT) / 3) * (frame >= n ? 1 : 0);
  return (
    <AbsoluteFill>
      <Backdrop tint={1.2} />
      <BigWord text="CHINA" start={2} end={46} style={{top: 280, right: 60}} from={1} />
      <BigWord text="GULF" start={46} style={{top: 280, left: 60}} from={-1} />
      <div style={{position: 'absolute', top: 520, left: 60, width: 960, height: routeMapHeight, opacity: mapIn, transform: `scale(${1.1 * (0.92 + 0.08 * mapIn)})`, transformOrigin: '50% 0'}}>
        <RouteMap t={frame} labels={{origin: 'قوانغتشو', destination: 'الخليج'}} />
      </div>
      <div style={{position: 'absolute', top: 1190, left: 70, transform: `scale(${pulse(60)})`, transformOrigin: 'left center'}}>
        <BigWord text="AIR" start={60} size={150} style={{position: 'relative'}} from={-1} />
      </div>
      <div style={{position: 'absolute', top: 1190, right: 70, transform: `scale(${pulse(75)})`, transformOrigin: 'right center'}}>
        <BigWord text="SEA" start={75} size={150} outline style={{position: 'relative'}} from={1} />
      </div>
      {/* scrolling photo strip */}
      <div style={{position: 'absolute', top: 1370, left: 0, width: 1080, height: 240, overflow: 'hidden'}}>
        {STRIP.map((p, i) => {
          const enter = prog(frame, 20 + i * 4, 14, easeOut);
          return (
            <div key={p} style={{position: 'absolute', left: 60 + i * 420 - frame * 4.2, top: (1 - enter) * 260, width: 390, height: 240, borderRadius: 28, overflow: 'hidden', boxShadow: `inset 0 0 0 3px ${gold}`}}>
              <Img src={photo(p)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
              <div style={{position: 'absolute', inset: 0, background: `linear-gradient(90deg, ${theme.colors.deep}66, transparent 45%, ${gold}2e)`}} />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ───────────────────────── Scene 5 · photo burst ─────────────────────────
const CUTS = ['city', 'man', 'cnc', 'flat', 'fryer', 'show', 'still', 'ware'].map((n) => `photos16/${n}.jpg`);
const BANDS = ['plane', 'line', 'pack', 'insp', 'cmp', 'city'].map((n) => `photos16/${n}.jpg`);
const CUT_LEN = 7.5;

const SceneBurst: React.FC = () => {
  const frame = useCurrentFrame();
  const idx = Math.min(CUTS.length - 1, Math.floor(frame / CUT_LEN));
  const f = frame - Math.floor(idx * CUT_LEN);
  const reveal = prog(f, 0, 4, easeOut);
  const dir = idx % 4;
  const clip = [`inset(0 ${(1 - reveal) * 100}% 0 0)`, `inset(0 0 0 ${(1 - reveal) * 100}%)`, `inset(${(1 - reveal) * 100}% 0 0 0)`, `inset(0 0 ${(1 - reveal) * 100}% 0)`][dir];
  const word = frame < 20 ? 'ALPHA' : frame < 40 ? 'GLOBAL' : frame < 60 ? 'CARGO' : '';
  const wf = frame < 20 ? frame : frame < 40 ? frame - 20 : frame - 40;
  const wp = prog(wf, 0, 6, easeOut);
  const cutShow = frame < 60;
  const bandStart = 60;
  const collapse = prog(frame, 75, 11, easeInOut);
  const lineFlash = prog(frame, 84, 6, easeIn);
  const bandH = 1920 / BANDS.length;
  return (
    <AbsoluteFill style={{background: theme.colors.deep}}>
      {cutShow && (
        <>
          {idx > 0 && <Img src={photo(CUTS[idx - 1])} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover'}} />}
          <div style={{position: 'absolute', inset: 0, clipPath: clip, overflow: 'hidden'}}>
            <Img src={photo(CUTS[idx])} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.18 - 0.14 * prog(f, 0, 14, easeOut)}) translateX(${(dir % 2 ? -1 : 1) * (1 - reveal) * 40}px)`}} />
          </div>
          <AbsoluteFill style={{background: `linear-gradient(180deg, ${theme.colors.deep}99 0%, ${theme.colors.deep}33 40%, ${theme.colors.deep}bb 100%)`}} />
          <AbsoluteFill style={{background: `linear-gradient(135deg, ${gold}44, transparent 55%)`, mixBlendMode: 'multiply'}} />
          {word && (
            <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
              <div style={{fontFamily: latin, fontWeight: 800, fontSize: word === 'GLOBAL' ? 200 : 240, color: theme.colors.white, transform: `scale(${1.5 - 0.5 * wp})`, opacity: Math.min(1, wp * 3), filter: `blur(${(1 - wp) * 22}px) drop-shadow(0 6px 30px #000a)`, letterSpacing: '-0.02em'}}>
                {word}
              </div>
            </AbsoluteFill>
          )}
        </>
      )}
      {frame >= bandStart && (
        <AbsoluteFill style={{background: theme.colors.deep}}>
          {BANDS.map((p, i) => {
            const e = prog(frame, bandStart + i * 2, 9, easeOut);
            const side = i % 2 ? 1 : -1;
            const cy = 960;
            const naturalTop = i * bandH;
            const top = cy + (naturalTop + bandH / 2 - cy) * (1 - collapse) - (bandH / 2) * (1 - collapse);
            return (
              <div key={i} style={{position: 'absolute', left: 0, width: 1080, top, height: Math.max(2, bandH * (1 - collapse)), overflow: 'hidden', transform: `translateX(${(1 - e) * 1200 * side}px)`}}>
                <Img src={photo(p)} style={{position: 'absolute', left: 0, top: -naturalTop * (1 - collapse) - (bandH / 2) * collapse, width: 1080, height: 1920, objectFit: 'cover'}} />
                <div style={{position: 'absolute', inset: 0, background: `linear-gradient(90deg, ${gold}33, transparent)`}} />
                <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 6, background: gold}} />
              </div>
            );
          })}
          {collapse > 0.5 && (
            <div style={{position: 'absolute', left: 540 - 540 * (1 - lineFlash), width: 1080 * (1 - lineFlash), top: 956, height: 8, background: '#fff', boxShadow: `0 0 60px 20px ${goldLight}, 0 0 160px 60px ${gold}`}} />
          )}
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

// ───────────────────────── Scene 6 · end lockup ─────────────────────────
const SceneEnd: React.FC = () => {
  const frame = useCurrentFrame();
  const flash = 1 - prog(frame, 0, 12, easeOut);
  const tag = prog(frame, 36, 16, easeOut);
  const url = prog(frame, 52, 16, easeOut);
  const ring = prog(frame, 0, 26, easeOut);
  const push = 1 + 0.045 * prog(frame, 0, 90, easeInOut);
  const out = prog(frame, 80, 10, easeIn);
  return (
    <AbsoluteFill>
      <Backdrop tint={1.5} />
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <circle cx={540} cy={680} r={160 + ring * 900} fill="none" stroke={goldLight} strokeWidth={16 * (1 - ring) + 1} opacity={(1 - ring) * 0.9} />
        <circle cx={540} cy={680} r={100 + ring * 620} fill="none" stroke={gold} strokeWidth={9 * (1 - ring) + 1} opacity={(1 - ring) * 0.7} />
      </svg>
      <AbsoluteFill style={{transform: `scale(${push})`}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 690, display: 'flex', justifyContent: 'center', transform: 'translateY(-50%)'}}>
          <RealMark t={frame * 1.1} size={540} />
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 1000, display: 'flex', justifyContent: 'center'}}>
          <Wordmark t={frame - 10} size={176} shimmerAt={28} letterDelay={3} />
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 1220, opacity: tag, transform: `translateY(${(1 - tag) * 30}px)`, filter: `blur(${(1 - tag) * 8}px)`}}>
          {content.tagline.map((l, i) => (
            <ArabicText key={i} size={74} weight={800} gold lineHeight={1.3}>
              {l}
            </ArabicText>
          ))}
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 1450, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: url, transform: `translateY(${(1 - url) * 24}px)`}}>
          <LtrText size={66} weight={600} color={theme.colors.white} style={{letterSpacing: '0.02em'}}>
            {content.url}
          </LtrText>
          <div style={{marginTop: -6}}>
            <SwooshUnderline start={60} width={560} thickness={16} dur={18} />
          </div>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{background: `rgba(255,236,170,${flash * 0.9})`}} />
      <AbsoluteFill style={{background: '#000', opacity: out * 0.55}} />
    </AbsoluteFill>
  );
};

// ───────────────────────── Transitions ─────────────────────────
const SLATS = 9;
const Shutter: React.FC<{duration: number}> = ({duration}) => {
  const frame = useCurrentFrame();
  const half = duration / 2;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {Array.from({length: SLATS}, (_, i) => {
        const d = (i / SLATS) * (half * 0.9);
        const cover = prog(frame, d, half * 0.55, easeInOut);
        const uncover = prog(frame, half + d * 0.9, half * 0.55, easeInOut);
        const h = cover * (1 - uncover);
        const fromTop = i % 2 === 0;
        return (
          <div key={i} style={{position: 'absolute', left: (1080 / SLATS) * i - 1, width: 1080 / SLATS + 2, top: 0, height: 1920, overflow: 'hidden'}}>
            <div style={{position: 'absolute', left: 0, right: 0, [fromTop ? 'top' : 'bottom']: 0, height: `${h * 100}%`, background: `linear-gradient(90deg, ${theme.colors.deep}, #1b1405 70%, ${gold})`, opacity: 1}} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const Iris: React.FC<{duration: number}> = ({duration}) => {
  const frame = useCurrentFrame();
  const p = prog(frame, 0, duration, easeInOut);
  const r = p * 1650;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <circle cx={540} cy={960} r={r} fill="none" stroke={goldLight} strokeWidth={26 * (1 - p) + 2} opacity={1 - p * 0.4} style={{filter: `drop-shadow(0 0 30px ${gold})`}} />
      </svg>
    </AbsoluteFill>
  );
};

/** Fixed (non-clipped) iris mask: reveals `children` through a growing circle. */
const IrisReveal: React.FC<{children: React.ReactNode; duration: number}> = ({children, duration}) => {
  const frame = useCurrentFrame();
  const p = prog(frame, 0, duration, easeInOut);
  return <AbsoluteFill style={{clipPath: `circle(${p * 1650}px at 50% 50%)`}}>{children}</AbsoluteFill>;
};

// ───────────────────────── Reel ─────────────────────────
export const Reel2: React.FC = () => {
  const {fps, durationInFrames} = useVideoConfig();
  const seq = (name: keyof typeof S) => ({from: sec(S[name][0]), durationInFrames: sec(S[name][1] - S[name][0])});
  const IRIS = 12;
  return (
    <AbsoluteFill style={{background: theme.colors.black}}>
      <Preload />
      <Html5Audio src={staticFile('audio/reel2-score.wav')} volume={1} />
      <Backdrop />
      <Sequence {...seq('logo')}>
        <SceneLogo />
      </Sequence>
      <Sequence {...seq('type')}>
        <SceneType />
      </Sequence>
      <Sequence {...seq('info')}>
        <SceneInfo />
      </Sequence>
      <Sequence from={sec(S.route[0])} durationInFrames={sec(S.route[1] - S.route[0]) + IRIS}>
        <SceneRoute />
      </Sequence>
      <Sequence from={sec(S.burst[0])} durationInFrames={sec(S.burst[1] - S.burst[0])}>
        <IrisReveal duration={IRIS}>
          <SceneBurst />
        </IrisReveal>
        <Iris duration={IRIS} />
      </Sequence>
      <Sequence {...seq('end')}>
        <SceneEnd />
      </Sequence>
      {/* transitions (centre of each overlay = the cut) */}
      <Sequence from={sec(S.info[0]) - 13} durationInFrames={26}>
        <SwooshWipe duration={26} />
      </Sequence>
      <Sequence from={sec(S.route[0]) - 10} durationInFrames={20}>
        <Shutter duration={20} />
      </Sequence>
      <Sequence durationInFrames={durationInFrames} layout="none">
        <Flash />
      </Sequence>
    </AbsoluteFill>
  );
};

/** Gold flash that builds into the 2.0 s impact. */
const Flash: React.FC = () => {
  const frame = useCurrentFrame();
  const at = sec(S.type[0]);
  const o = frame < at ? prog(frame, at - 8, 8, easeIn) * 0.9 : 0;
  return <AbsoluteFill style={{background: `rgba(255,236,170,${o})`, pointerEvents: 'none'}} />;
};

export const reel2Defaults = {};
