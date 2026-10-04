import React from 'react';
import {Composition} from 'remotion';
import {loadFonts} from './fonts';
import {detectAssets} from './lib/assets';
import {Reel1, reel1Defaults, reel1Frames} from './reels/Reel1';
import {REEL2_FRAMES, Reel2} from './reels/Reel2';
import {theme} from './theme';
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
    <Composition id="Reel2" component={Reel2} width={width} height={height} fps={fps} durationInFrames={REEL2_FRAMES} />
  </>
);
