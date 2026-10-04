import React from 'react';
import {AbsoluteFill} from 'remotion';
import {PARTICLES, SAFE, SCENE_FRAMES} from '../config';
import {CloudPattern} from './CloudPattern';
import {KenBurnsImage} from './KenBurnsImage';
import {DarkOverlay, Flash, Vignette} from './Overlays';
import {Particles} from './Particles';

type Props = {
  image: string;
  fallback: [string, string, string];
  /** موضع المشهد على الخط الزمني العام (لاتصال الجسيمات) */
  startFrame: number;
  /** الإطار الذي يظهر فيه الـ Flash (بعد انتهاء الـ Wipe) */
  flashAt: number;
  panDirection?: 1 | -1;
  children: React.ReactNode;
};

/** الطبقات المشتركة لكل مشهد + حاوية المحتوى داخل المناطق الآمنة. */
export const SceneShell: React.FC<Props> = ({image, fallback, startFrame, flashAt, panDirection = 1, children}) => (
  <AbsoluteFill style={{background: '#0A0A0A'}}>
    <KenBurnsImage src={image} fallback={fallback} durationInFrames={SCENE_FRAMES} panDirection={panDirection} />
    <DarkOverlay />
    <CloudPattern />
    <Particles count={PARTICLES.count} frameOffset={startFrame} />
    <div
      className="absolute flex flex-col items-center justify-center"
      style={{top: SAFE.top, bottom: SAFE.bottom, left: SAFE.side, right: SAFE.side}}
    >
      {children}
    </div>
    <Vignette />
    <Flash at={flashAt} />
  </AbsoluteFill>
);
