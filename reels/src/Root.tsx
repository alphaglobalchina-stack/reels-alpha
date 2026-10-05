import React from 'react';
import {Composition} from 'remotion';
import {loadFonts} from './fonts';
import {detectAssets} from './lib/assets';
import {Reel1, reel1Defaults, reel1Frames} from './reels/Reel1';
import {theme} from './theme';
import {MalaysiaReel} from './malaysia/MalaysiaReel';
import {DURATION as MY_DURATION, FPS as MY_FPS, H as MY_H, W as MY_W} from './malaysia/data';
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
    <Composition id="MalaysiaReel" component={MalaysiaReel} width={MY_W} height={MY_H} fps={MY_FPS} durationInFrames={MY_DURATION} defaultProps={{audio: true}} />
  </>
);
