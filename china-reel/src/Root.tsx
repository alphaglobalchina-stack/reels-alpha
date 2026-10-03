import React from 'react';
import {Composition} from 'remotion';
import {ChinaReel} from './ChinaReel';
import {FPS, HEIGHT, TOTAL_FRAMES, WIDTH} from './config';
import {loadFonts} from './fonts';

loadFonts();

export const RemotionRoot: React.FC = () => (
  <Composition id="ChinaReel" component={ChinaReel} durationInFrames={TOTAL_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
);
