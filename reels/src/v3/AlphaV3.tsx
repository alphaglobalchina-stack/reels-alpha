import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {C} from '../film/brand';
import {Grain, LightLeak, Vignette} from '../film/fx';
import {CX, CY, project, ramp} from '../film/lib';
import {Anamorphic, Blur, FilterDefs, Haze, Hit, hitState, useT, WipeFlash} from '../v2/engine';
import {FPS} from '../v2/t2';
import {cityCam, CityPass, nodeGlowR, ShotCity, TARGET} from './City';
import {IvoryDust} from './kit';
import {ShotMap} from './Map';
import {ShotExterior} from './Market';
import {ShotHallNet} from './Network';
import {A, CITY, END, EXT, HALL, M, NET, NODE_IN, V} from './plan';
import {SubsV3} from './Subs';

export type AlphaV3Props = {audio: boolean; subtitles: boolean};

const HITS: Hit[] = [
  {t: V.sup, shake: 0.2, rgb: 0},
  {t: V.right, shake: 0.8, rgb: 10, flash: 0.2},
  {t: NODE_IN, shake: 0.55, rgb: 12, flash: 0.32},
  {t: M.dive[0], shake: 0.2, rgb: 0},
  {t: CITY.pass[0] + 0.18, shake: 0.35, rgb: 5},
  {t: V.souq, shake: 0.45, rgb: 6, flash: 0.06},
  {t: EXT.push[0] + 0.2, shake: 0.25, rgb: 6},
  {t: NET.burst, shake: 0.3, rgb: 4},
  {t: NET.search, shake: 0.14, rgb: 0},
  {t: NET.verify, shake: 0.12, rgb: 0},
  {t: NET.compare, shake: 0.16, rgb: 2},
  {t: NET.select, shake: 0.9, rgb: 11, flash: 0.2},
  {t: END - 0.12, shake: 0.2, rgb: 6},
];
const BLUR: [number, number, number][] = [
  [V.but, V.but + 0.42, 6],
  [V.right - 0.02, V.right + 0.2, 4],
  [A.dive[0] + 0.2, NODE_IN + 0.2, 8],
  [M.start + 0.05, M.start + 0.45, 5],
  [M.dive[0], CITY.start + 0.35, 6],
  [CITY.pass[0], CITY.pass[1] + 0.1, 8],
  [EXT.start, EXT.start + 0.35, 5],
  [EXT.push[0], EXT.push[1] + 0.15, 8],
  [NET.burst, NET.burst + 0.4, 6],
  [NET.select - 0.02, NET.select + 0.25, 6],
  [NET.through[0], END + 1, 7],
];
const samplesAt = (t: number) => BLUR.reduce((s, [a, b, n]) => (t >= a && t < b ? Math.max(s, n) : s), 1);

const World: React.FC = () => {
  const t = useT();
  const live = (a: number, b: number) => t >= a && t < b;
  const hs = hitState(t, HITS);
  const tp = project(cityCam(Math.min(t, NODE_IN)), TARGET);
  const nodeClip = nodeGlowR(t) * 2.4 * ramp(t, NODE_IN - 0.28, NODE_IN, (x) => x * x);
  const lightK = ramp(t, CITY.start - 0.05, CITY.start + 0.12) * (1 - ramp(t, CITY.start + 0.2, CITY.start + 0.55));
  return (
    <AbsoluteFill style={{transform: `translate(${hs.sx}px, ${hs.sy}px) rotate(${hs.rot}deg) scale(${1 + Math.abs(hs.sx) / 900})`, filter: hs.rgb > 0.6 ? 'url(#rgbsplit)' : undefined}}>
      {live(0, NODE_IN + 0.02) && <ShotCity t={t} />}
      {/* zoom-through: the selected node opens into the map, its glow becomes the Guangzhou pin */}
      {live(M.start - 0.24, CITY.start + 0.5) && (
        <AbsoluteFill style={t < NODE_IN ? {clipPath: `circle(${Math.max(1, nodeClip)}px at ${tp.x}px ${tp.y}px)`} : undefined}>
          <ShotMap t={t} />
        </AbsoluteFill>
      )}
      {/* the Canton Fair waits behind the tower */}
      {live(EXT.start, EXT.push[1] + 0.05) && <ShotExterior t={t} />}
      {live(CITY.start, CITY.pass[1] + 0.02) && (
        <AbsoluteFill style={{opacity: ramp(t, CITY.start, CITY.start + 0.28)}}>
          <CityPass t={t} />
        </AbsoluteFill>
      )}
      {/* photo depth dive: through the crowd and the word into the hall */}
      {live(HALL.start, END + 1) && (
        <AbsoluteFill style={{opacity: ramp(t, HALL.start, EXT.push[1])}}>
          <ShotHallNet t={t} />
        </AbsoluteFill>
      )}
      {/* the Guangzhou pin lands as one of the city's lights */}
      {lightK > 0 && (
        <AbsoluteFill style={{background: `radial-gradient(circle at ${CX}px ${CY}px, rgba(255,240,205,${0.7 * lightK}) 0%, rgba(240,200,120,${0.25 * lightK}) 8%, rgba(0,0,0,0) 22%)`, mixBlendMode: 'screen'}} />
      )}
      <Haze t={t} k={ramp(t, M.dive[1] - 0.32, CITY.start + 0.06) * (1 - ramp(t, CITY.start + 0.12, CITY.start + 0.5))} seed={5} />
      <Anamorphic t={t} at={V.right} x={tp.x} y={tp.y} strength={0.55} />
      <Anamorphic t={t} at={NODE_IN} y={CY} strength={0.6} />
      <Anamorphic t={t} at={V.souq + 0.05} y={900} strength={0.35} />
      <Anamorphic t={t} at={NET.select} y={CY - 40} strength={0.6} />
      <LightLeak t={t} at={NODE_IN - 0.25} dur={0.8} strength={0.16} />
      <LightLeak t={t} at={EXT.push[0]} dur={0.7} x0={110} x1={-10} y={40} strength={0.18} />
      <WipeFlash k={hs.flash} />
    </AbsoluteFill>
  );
};

export const AlphaV3: React.FC<AlphaV3Props> = ({audio, subtitles}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const hs = hitState(t, HITS);
  return (
    <AbsoluteFill style={{background: C.ink}}>
      <FilterDefs rgb={hs.rgb} whipX={0} whipY={0} />
      <Blur samples={samplesAt(t)}>
        <World />
      </Blur>
      <IvoryDust t={t} amount={0.5} />
      <Vignette strength={0.72} />
      {subtitles && <SubsV3 t={t} end={END} />}
      <Grain frame={frame} opacity={0.075} />
      {audio && <Audio src={staticFile('film/mix_v3.wav')} />}
    </AbsoluteFill>
  );
};
