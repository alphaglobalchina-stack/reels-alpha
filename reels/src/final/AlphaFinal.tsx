import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {C} from '../film/brand';
import {Grain, LightLeak, Vignette} from '../film/fx';
import {CX, CY, project, ramp} from '../film/lib';
import {Anamorphic, Blur, FilterDefs, Haze, Hit, hitState, useT, WipeFlash, Warp} from '../v2/engine';
import {cityCam, CityPass, nodeGlowR, ShotCity, TARGET} from './City';
import {ColdDoors, ColdField, openingRect} from './ColdOpen';
import {IvoryDust} from './kit';
import {ShotMap} from './Map';
import {ShotExterior} from './Market';
import {ShotHallNet} from './Network';
import * as P from './plan';
import {Scenes2, scenes2Hits, scenes2Blur} from './Scenes2';

const {A, CITY, COLD, EXT, HALL, M, NET, NODE_IN, V} = P;

export type AlphaFinalProps = {audio: boolean};

const HITS: Hit[] = [
  {t: COLD.reveal, shake: 0.15, rgb: 0},
  {t: COLD.lock, shake: 0.55, rgb: 9, flash: 0.12}, // chromatic moment 1 of 2
  {t: COLD.clack1, shake: 0.25, rgb: 0},
  {t: COLD.clack2, shake: 0.3, rgb: 0},
  {t: COLD.end, shake: 0.3, rgb: 0, flash: 0.1},
  {t: V.right, shake: 0.5, rgb: 0, flash: 0.1},
  {t: NODE_IN, shake: 0.35, rgb: 0, flash: 0.22},
  {t: CITY.pass[0] + 0.18, shake: 0.25, rgb: 0},
  {t: V.souq, shake: 0.3, rgb: 0},
  {t: NET.burst, shake: 0.2, rgb: 0},
  {t: NET.select, shake: 0.55, rgb: 0, flash: 0.12},
  ...scenes2Hits,
];
const BLUR: [number, number, number][] = [
  [COLD.line + 0.2, COLD.silence, 5],
  [COLD.open + 0.1, COLD.end + 0.2, 7],
  [V.but, V.but + 0.42, 6],
  [A.dive[0] + 0.25, NODE_IN + 0.18, 7],
  [M.start + 0.05, M.start + 0.4, 5],
  [M.dive[0], CITY.start + 0.3, 6],
  [CITY.pass[0], CITY.pass[1] + 0.1, 7],
  [EXT.push[0], EXT.push[1] + 0.12, 7],
  [NET.burst, NET.burst + 0.36, 6],
  [NET.through[0], NET.through[1] + 0.15, 6],
  ...scenes2Blur,
];
const samplesAt = (t: number) => BLUR.reduce((s, [a, b, n]) => (t >= a && t < b ? Math.max(s, n) : s), 1);

const World: React.FC = () => {
  const t = useT();
  const live = (a: number, b: number) => t >= a && t < b;
  const hs = hitState(t, HITS);
  const tp = project(cityCam(Math.min(Math.max(t, P.CITY_T0), NODE_IN)), TARGET);
  const nodeClip = nodeGlowR(t) * 2.4 * ramp(t, NODE_IN - 0.28, NODE_IN, (x) => x * x);
  const lightK = ramp(t, CITY.start - 0.05, CITY.start + 0.12) * (1 - ramp(t, CITY.start + 0.2, CITY.start + 0.55));
  const or = openingRect(t);
  return (
    <AbsoluteFill style={{transform: `translate(${hs.sx}px, ${hs.sy}px) rotate(${hs.rot}deg) scale(${1 + Math.abs(hs.sx) / 900})`, filter: hs.rgb > 0.6 ? 'url(#rgbsplit)' : undefined}}>
      {/* ── cold open ── */}
      {live(0, COLD.end) && <ColdField t={t} />}
      {/* Guangzhou waits behind the container doors */}
      {live(P.CITY_T0, NODE_IN + 0.02) && (
        <AbsoluteFill style={t < COLD.end ? {clipPath: `inset(${Math.max(0, or.y)}px ${Math.max(0, 1080 - or.x - or.w)}px ${Math.max(0, 1920 - or.y - or.h)}px ${Math.max(0, or.x)}px)`} : undefined}>
          <ShotCity t={t} />
        </AbsoluteFill>
      )}
      {live(COLD.lock - 0.1, COLD.end) && <ColdDoors t={t} />}
      {live(COLD.through, COLD.end + 0.3) && <Warp t={t} k={ramp(t, COLD.through, COLD.end - 0.05, (x) => x * x) * (1 - ramp(t, COLD.end, COLD.end + 0.3)) * 1.4} color="255,236,200" seed={4} />}
      {/* ── journey: node → map → city light → Canton Fair → sourcing ── */}
      {live(M.start - 0.24, CITY.start + 0.5) && (
        <AbsoluteFill style={t < NODE_IN ? {clipPath: `circle(${Math.max(1, nodeClip)}px at ${tp.x}px ${tp.y}px)`} : undefined}>
          <ShotMap t={t} />
        </AbsoluteFill>
      )}
      {live(EXT.start, EXT.push[1] + 0.05) && <ShotExterior t={t} />}
      {live(CITY.start, CITY.pass[1] + 0.02) && (
        <AbsoluteFill style={{opacity: ramp(t, CITY.start, CITY.start + 0.28)}}>
          <CityPass t={t} />
        </AbsoluteFill>
      )}
      {live(HALL.start, NET.through[1] + 0.25) && (
        <AbsoluteFill style={{opacity: ramp(t, HALL.start, EXT.push[1])}}>
          <ShotHallNet t={t} />
        </AbsoluteFill>
      )}
      {lightK > 0 && <AbsoluteFill style={{background: `radial-gradient(circle at ${CX}px ${CY}px, rgba(255,240,205,${0.7 * lightK}) 0%, rgba(240,200,120,${0.25 * lightK}) 8%, rgba(0,0,0,0) 22%)`, mixBlendMode: 'screen'}} />}
      <Haze t={t} k={ramp(t, M.dive[1] - 0.32, CITY.start + 0.06) * (1 - ramp(t, CITY.start + 0.12, CITY.start + 0.5))} seed={5} />
      {/* ── negotiation → production → inspection → machinery → shipping → partner → ALPHA ── */}
      <Scenes2 t={t} />
      <Anamorphic t={t} at={COLD.lock} y={CY} strength={0.55} />
      <Anamorphic t={t} at={V.right} x={tp.x} y={tp.y} strength={0.45} />
      <Anamorphic t={t} at={NODE_IN} y={CY} strength={0.5} />
      <Anamorphic t={t} at={NET.select} y={CY - 40} strength={0.45} />
      <LightLeak t={t} at={COLD.open} dur={0.9} strength={0.22} />
      <LightLeak t={t} at={EXT.push[0]} dur={0.7} x0={110} x1={-10} y={40} strength={0.16} />
      <WipeFlash k={hs.flash} />
    </AbsoluteFill>
  );
};

export const AlphaFinal: React.FC<AlphaFinalProps> = ({audio}) => {
  const frame = useCurrentFrame();
  const t = frame / P.FPS;
  const hs = hitState(t, HITS);
  return (
    <AbsoluteFill style={{background: C.ink}}>
      <FilterDefs rgb={hs.rgb} whipX={0} whipY={0} />
      <Blur samples={samplesAt(t)}>
        <World />
      </Blur>
      <IvoryDust t={t} amount={t < P.LOGO.start ? 0.45 : 0.3} />
      <Vignette strength={0.7} />
      <Grain frame={frame} opacity={0.07} />
      {audio && <Audio src={staticFile('film/mix_final.wav')} />}
    </AbsoluteFill>
  );
};
