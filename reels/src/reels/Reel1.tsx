import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig} from 'remotion';
import content from '../../../content/reel1.json';
import {ArabicText, KineticWords} from '../components/ArabicText';
import {Backdrop} from '../components/Backdrop';
import {CtaCard} from '../components/CtaCard';
import {LogoMark, Wordmark} from '../components/Logo';
import {ReelAudio, Cue} from '../components/ReelAudio';
import {RouteMap, routeMapHeight} from '../components/RouteMap';
import {SwooshUnderline, SwooshWipe} from '../components/Swoosh';
import {ValueIcon, ValueIconName} from '../components/ValueIcons';
import {easeInOut, easeOut, pop, prog} from '../lib/anim';
import {goldGradient, theme} from '../theme';
import {CtaContent, ReelProps} from '../types';

export const reel1Defaults: ReelProps = {sfx: content.sfx, music: content.music, musicVolume: content.musicVolume};
export const reel1Frames = (fps: number) => content.timing.map((s) => Math.round(s * fps));

const WIPE = 26;

/** Slow push-in so no scene is ever static. */
const Drift: React.FC<{children: React.ReactNode; dur: number; from?: number}> = ({children, dur, from = 1}) => {
  const frame = useCurrentFrame();
  const s = from + 0.045 * prog(frame, 0, dur, easeInOut);
  return <AbsoluteFill style={{transform: `scale(${s})`, transformOrigin: '50% 50%'}}>{children}</AbsoluteFill>;
};

// ── Scene 1 — logo reveal ──────────────────────────────────────────────────────────
const SceneLogo: React.FC<{dur: number}> = ({dur}) => {
  const frame = useCurrentFrame();
  const sub = prog(frame, 50, 16, easeOut);
  return (
    <Drift dur={dur} from={0.96}>
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 34, marginTop: -60}}>
          <LogoMark t={frame} size={420} />
          <Wordmark t={frame - 24} size={170} shimmerAt={14} letterDelay={4} />
          <div style={{opacity: sub, transform: `translateY(${(1 - sub) * 24}px)`, filter: `blur(${(1 - sub) * 8}px)`, marginTop: 8}}>
            <ArabicText size={46} weight={700} color={theme.colors.goldLight}>
              {content.brand.subtitle}
            </ArabicText>
          </div>
        </div>
      </AbsoluteFill>
    </Drift>
  );
};

// ── Scene 2 — kinetic headline ─────────────────────────────────────────────────────
const SceneHeadline: React.FC<{dur: number}> = ({dur}) => (
  <Drift dur={dur}>
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30}}>
        <KineticWords lines={content.headline} start={8} stagger={9} size={112} />
        <SwooshUnderline start={42} width={620} thickness={24} />
      </div>
    </AbsoluteFill>
  </Drift>
);

// ── Scene 3 — value cards ──────────────────────────────────────────────────────────
const CARD_H = 340;
const CARD_GAP = 38;

const ValueCard: React.FC<{i: number; icon: ValueIconName; text: string; enter: number; next?: number}> = ({i, icon, text, enter, next}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = pop(frame, fps, enter, 15, 95);
  const t = frame - enter;
  const dim = next !== undefined ? 1 - 0.42 * prog(frame, next, 14, easeOut) : 1;
  const lift = next !== undefined ? prog(frame, next, 14, easeOut) : 0;
  const focus = 1 - lift;
  const border = prog(frame, enter + 4, 26, easeInOut);
  return (
    <div
      style={{
        position: 'absolute',
        left: 70,
        width: 940,
        height: CARD_H,
        top: 400 + i * (CARD_H + CARD_GAP),
        transform: `translateX(${(1 - p) * 1100}px) scale(${1 - lift * 0.03})`,
        opacity: Math.min(1, p * 2) * dim,
        borderRadius: 36,
        background: 'linear-gradient(135deg, rgba(255,255,255,0.075), rgba(255,255,255,0.02))',
        boxShadow: `0 0 ${70 * focus}px ${theme.colors.gold}${Math.round(60 * focus).toString(16).padStart(2, '0')}, inset 0 0 0 1.5px ${theme.colors.gold}${Math.round(40 + 90 * border).toString(16).padStart(2, '0')}`,
        backdropFilter: 'blur(6px)',
        display: 'flex',
        flexDirection: 'row',
        direction: 'rtl',
        alignItems: 'center',
        padding: '0 36px',
        gap: 30,
        overflow: 'hidden',
      }}
    >
      {/* gold accent bar on the start (right) edge */}
      <div style={{position: 'absolute', right: 0, top: 40 + (1 - border) * 130, bottom: 40 + (1 - border) * 130, width: 8, borderRadius: 4, background: goldGradient}} />
      <div style={{width: 210, flex: 'none', display: 'flex', justifyContent: 'center'}}>
        <ValueIcon name={icon} t={t} size={200} />
      </div>
      <div style={{flex: 1}}>
        <ArabicText size={54} weight={800} align="right" lineHeight={1.5}>
          {text}
        </ArabicText>
      </div>
    </div>
  );
};

const SceneValues: React.FC<{dur: number}> = ({dur}) => {
  const step = Math.round((dur - 18) / content.values.length);
  return (
    <Drift dur={dur}>
      {content.values.map((v, i) => (
        <ValueCard
          key={i}
          i={i}
          icon={v.icon as ValueIconName}
          text={v.text}
          enter={10 + i * step}
          next={i < content.values.length - 1 ? 10 + (i + 1) * step : undefined}
        />
      ))}
    </Drift>
  );
};

// ── Scene 4 — map ──────────────────────────────────────────────────────────────────
const SceneMap: React.FC<{dur: number}> = ({dur}) => {
  const frame = useCurrentFrame();
  return (
    <Drift dur={dur}>
      <div style={{position: 'absolute', left: 60, top: 470}}>
        <RouteMap t={frame - 4} labels={{origin: content.map.origin, destination: content.map.destination}} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 470 + routeMapHeight + 90, display: 'flex', justifyContent: 'center'}}>
        <KineticWords lines={content.map.caption} start={50} stagger={8} size={78} highlightLast={true} />
      </div>
    </Drift>
  );
};

// ── Composition ────────────────────────────────────────────────────────────────────
export const Reel1: React.FC<ReelProps> = (props) => {
  const {fps} = useVideoConfig();
  const d = reel1Frames(fps);
  const starts = d.reduce<number[]>((acc, _, i) => [...acc, i === 0 ? 0 : acc[i - 1] + d[i - 1]], []);
  const cues: Cue[] = [
    {frame: 2, kind: 'swoosh'},
    ...starts.slice(1).map((s): Cue => ({frame: s - 12, kind: 'swoosh'})),
  ];
  const scene = (i: number, el: React.ReactNode) => (
    <Sequence from={starts[i]} durationInFrames={d[i]} layout="none">{el}</Sequence>
  );
  return (
    <AbsoluteFill style={{background: theme.colors.black}}>
      <Backdrop />
      {scene(0, <SceneLogo dur={d[0]} />)}
      {scene(1, <SceneHeadline dur={d[1]} />)}
      {scene(2, <SceneValues dur={d[2]} />)}
      {scene(3, <SceneMap dur={d[3]} />)}
      {scene(4, <CtaCard cta={content.cta as CtaContent} />)}
      {starts.slice(1).map((s) => (
        <Sequence key={s} from={s - WIPE / 2} durationInFrames={WIPE} layout="none">
          <SwooshWipe duration={WIPE} />
        </Sequence>
      ))}
      <ReelAudio {...props} cues={cues} />
    </AbsoluteFill>
  );
};
