import React from 'react';
import {Composition} from 'remotion';
import {loadFonts} from './fonts';
import {detectAssets} from './lib/assets';
import {Reel1, reel1Defaults, reel1Frames} from './reels/Reel1';
import {theme} from './theme';
import {AlphaOpening} from './film/AlphaOpening';
import {FPS, TOTAL_FRAMES} from './film/timing';
import {ReelProps} from './types';

loadFonts();

const {width, height, fps} = theme.video;

const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Reel1"
      component={Reel1}
      width={width}
      height={height}
      fps={fps}
      durationInFrames={sum(reel1Frames(fps))}
      defaultProps={reel1Defaults}
      calculateMetadata={async ({props}) => ({
        durationInFrames: sum(reel1Frames(fps)),
        props: {...props, assets: await detectAssets()} as ReelProps,
      })}
    />
    <Composition
      id="AlphaOpening"
      component={AlphaOpening}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={TOTAL_FRAMES}
      defaultProps={{audio: true, subtitles: true}}
    />
  </>
);
