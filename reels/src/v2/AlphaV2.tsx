import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {C} from '../film/brand';
import {Dust, Grain, LightLeak, Vignette} from '../film/fx';
import {project, ramp} from '../film/lib';
import {Subtitles} from '../film/Subtitles';
import {Anamorphic, Blur, Burst, FilterDefs, Haze, Hit, hitState, useT, WipeFlash} from './engine';
import {FPS, phrases, words} from './t2';
import {A_END, aCam, ringR, ShotA, T as TA, TARGET} from './shots/A_City';
import {B, B_DIVE_END, ShotB} from './shots/B_Globe';
import {C_START, D_END, OCC, Occluder, PORTAL, ShotC} from './shots/C_Market';
import {BEATS, E_START, ShotE} from './shots/E_Network';

export type AlphaV2Props = {audio: boolean; subtitles: boolean};

export const HITS: Hit[] = [
  {t: TA.sup, shake: 0.35, rgb: 4},
  {t: TA.right, shake: 1.0, rgb: 12, flash: 0.3},
  {t: A_END, shake: 0.7, rgb: 14, flash: 0.6},
  {t: B.start + 0.75, shake: 0.3, rgb: 0},
  {t: B_DIVE_END, shake: 0.4, rgb: 6},
  {t: PORTAL.land, shake: 0.55, rgb: 8, flash: 0.12},
  {t: PORTAL.full, shake: 0.35, rgb: 10, flash: 0.2},
  {t: BEATS[0].t, shake: 0.3, rgb: 3},
  {t: BEATS[1].t, shake: 0.25, rgb: 3},
  {t: BEATS[2].t, shake: 0.3, rgb: 4},
  {t: BEATS[3].t, shake: 0.9, rgb: 12, flash: 0.25},
];

/** motion-blur samples per moment: only where the camera is genuinely fast */
const BLUR: [number, number, number][] = [
  [TA.but, TA.but + 0.55, 6],
  [TA.right - 0.02, TA.right + 0.28, 5],
  [A_END - 0.75, A_END + 0.3, 8],
  [B.start + 0.2, B.start + 0.75, 6],
  [B_DIVE_END - 0.7, B.end + 0.3, 6],
  [PORTAL.go - 0.02, PORTAL.full + 0.25, 8],
  [OCC.a - 0.1, OCC.b + 0.05, 6],
  [BEATS[3].t - 0.04, BEATS[3].t + 0.32, 6],
];
const samplesAt = (t: number) => BLUR.reduce((s, [a, b, n]) => (t >= a && t < b ? Math.max(s, n) : s), 1);

/** Everything the camera sees (rendered once per motion-blur sample). */
const World: React.FC = () => {
  const t = useT();
  const live = (a: number, b: number) => t >= a && t < b;
  const hs = hitState(t, HITS);
  const tp = project(aCam(Math.min(t, A_END)), TARGET);
  return (
    <AbsoluteFill style={{transform: `translate(${hs.sx}px, ${hs.sy}px) rotate(${hs.rot}deg) scale(${1 + Math.abs(hs.sx) / 900})`, filter: hs.rgb > 0.6 ? 'url(#rgbsplit)' : undefined}}>
      {live(0, A_END + 0.02) && <ShotA t={t} />}
      {/* iris: the lock ring opens into the globe (match shape) */}
      {live(B.start, B.end + 0.35) && (
        <AbsoluteFill style={t < A_END ? {clipPath: `circle(${ringR(t)}px at ${tp.x}px ${tp.y}px)`} : undefined}>
          <ShotB t={t} />
        </AbsoluteFill>
      )}
      {/* haze pass-through: the dive lands inside the market */}
      {live(C_START, D_END + 0.001) && (
        <AbsoluteFill style={{opacity: ramp(t, C_START, B.end + 0.15)}}>
          <ShotC t={t} />
        </AbsoluteFill>
      )}
      <Haze t={t} k={ramp(t, B_DIVE_END - 0.35, B.end - 0.05) * (1 - ramp(t, B.end + 0.05, B.end + 0.5))} seed={11} />
      {live(E_START, 99) && <ShotE t={t} />}
      <Occluder t={t} />
      <Burst t={t} at={A_END} x={540} y={960} n={80} power={1.1} />
      <Burst t={t} at={BEATS[3].t} x={540} y={1000} n={50} power={0.8} />
      <Anamorphic t={t} at={TA.right} y={tp.y} x={tp.x} strength={0.8} />
      <Anamorphic t={t} at={PORTAL.land} y={1010} strength={0.6} />
      <Anamorphic t={t} at={BEATS[3].t} y={980} strength={0.7} />
      <LightLeak t={t} at={A_END - 0.3} dur={0.9} strength={0.35} />
      <LightLeak t={t} at={PORTAL.go} dur={0.8} x0={110} x1={-10} y={35} strength={0.35} />
      <WipeFlash k={hs.flash} />
    </AbsoluteFill>
  );
};

export const AlphaV2: React.FC<AlphaV2Props> = ({audio, subtitles}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const hs = hitState(t, HITS);
  const whip = t >= OCC.a && t < OCC.b ? 60 * Math.sin(Math.PI * ramp(t, OCC.a, OCC.b)) : 0;
  return (
    <AbsoluteFill style={{background: C.ink}}>
      <FilterDefs rgb={hs.rgb} whipX={whip} whipY={2} />
      <Blur samples={samplesAt(t)}>
        <World />
      </Blur>
      <Dust t={t} amount={0.55} drift={1.6} />
      <Vignette strength={0.7} />
      {subtitles && <Subtitles t={t} phrases={phrases} words={words} hide={(i, p) => i === 0 || ['s9', 's10'].includes(p.scene)} />}
      <Grain frame={frame} opacity={0.08} />
      {audio && <Audio src={staticFile('film/mix_v2.wav')} />}
    </AbsoluteFill>
  );
};
