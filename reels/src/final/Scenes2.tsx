import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ramp} from '../film/lib';
import {Anamorphic, Hit, Warp} from '../v2/engine';
import {ShotGallery} from './Gallery';
import {ShotHero} from './Hero';
import {ShotLogo} from './Logo';
import {ShotNegotiation} from './Negotiation';
import {ShotInspection, ShotProduction} from './Production';
import {ShotShipping} from './Ship';
import {BRAND, DURATION, GAL, HERO, INSP, LOGO, NEG_START, NEG_THROUGH, NET, PROD, SHIP, SNAP} from './plan';

const stepT = (k: number) => GAL.steps + ((GAL.studied + 0.15 - GAL.steps) * k) / 4;

export const scenes2Hits: Hit[] = [
  {t: SNAP, shake: 0.35, rgb: 0, flash: 0.06},
  {t: INSP.match, shake: 0.25, rgb: 0, flash: 0.05},
  {t: GAL.products, shake: 0.1, rgb: 0},
  {t: GAL.equip, shake: 0.1, rgb: 0},
  {t: GAL.mach, shake: 0.1, rgb: 0},
  {t: GAL.lines, shake: 0.18, rgb: 0},
  {t: SHIP.ship, shake: 0.2, rgb: 0},
  {t: HERO.partner, shake: 0.35, rgb: 8, flash: 0.06}, // chromatic moment 2 of 2
  {t: BRAND, shake: 0.3, rgb: 0, flash: 0.14},
];
export const scenes2Blur: [number, number, number][] = [
  [NEG_START, NEG_START + 0.45, 6],
  [NEG_THROUGH[0], NEG_THROUGH[1] + 0.15, 6],
  [PROD.sample + 0.55, PROD.prod + 0.15, 7],
  [PROD.end - 0.2, INSP.start + 0.55, 5],
  [INSP.push[0], INSP.push[1] + 0.2, 7],
  [GAL.start, GAL.full + 0.3, 4],
  [stepT(4), GAL.end + 0.3, 6],
  [SHIP.start, SHIP.start + 0.4, 5],
  [SHIP.portIn - 0.15, SHIP.portIn + 0.3, 5],
  [SHIP.wake - 0.1, SHIP.wake + 0.25, 5],
  [HERO.sup + 0.4, HERO.own, 4],
  [HERO.converge[0], BRAND + 0.2, 6],
];

export const Scenes2: React.FC<{t: number}> = ({t}) => {
  const live = (a: number, b: number) => t >= a && t < b;
  return (
    <>
      {live(NEG_START, NEG_THROUGH[1] + 0.3) && (
        <AbsoluteFill style={{opacity: ramp(t, NEG_START, NET.through[1])}}>
          <ShotNegotiation t={t} />
        </AbsoluteFill>
      )}
      {live(PROD.start, PROD.end + 0.35) && (
        <AbsoluteFill style={{opacity: ramp(t, PROD.start, NEG_THROUGH[1])}}>
          <ShotProduction t={t} />
        </AbsoluteFill>
      )}
      {live(INSP.start, INSP.push[1] + 0.3) && (
        <AbsoluteFill style={{opacity: ramp(t, INSP.start, PROD.end + 0.1)}}>
          <ShotInspection t={t} />
        </AbsoluteFill>
      )}
      {live(GAL.start, GAL.end + 0.4) && (
        <AbsoluteFill style={{opacity: ramp(t, GAL.start, INSP.push[1])}}>
          <ShotGallery t={t} />
        </AbsoluteFill>
      )}
      {live(SHIP.start, SHIP.end + 0.05) && (
        <AbsoluteFill style={{opacity: ramp(t, SHIP.start, GAL.end)}}>
          <ShotShipping t={t} />
        </AbsoluteFill>
      )}
      {live(SHIP.end - 0.05, LOGO.start + 0.3) && <ShotHero t={t} />}
      {live(LOGO.start, DURATION + 1) && <ShotLogo t={t} />}
      {/* light streaks on the fastest pushes */}
      <Warp t={t} k={ramp(t, NEG_THROUGH[0], NEG_THROUGH[1]) * (1 - ramp(t, NEG_THROUGH[1], NEG_THROUGH[1] + 0.25))} color="255,236,200" seed={9} />
      <Warp t={t} k={ramp(t, INSP.push[0], INSP.push[1]) * (1 - ramp(t, INSP.push[1], INSP.push[1] + 0.3))} color="255,236,200" seed={12} />
      <Warp t={t} k={0.5 * ramp(t, stepT(4), GAL.end) * (1 - ramp(t, GAL.end, GAL.end + 0.3))} color="255,236,200" seed={15} />
      <Anamorphic t={t} at={SNAP} y={1000} strength={0.35} />
      <Anamorphic t={t} at={INSP.match} y={1230} strength={0.35} />
      <Anamorphic t={t} at={HERO.partner} y={760} strength={0.4} />
    </>
  );
};
