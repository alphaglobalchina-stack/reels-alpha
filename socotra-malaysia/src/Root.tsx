import React from 'react';
import {Composition} from 'remotion';
import {VIDEO} from './data';
import {loadFonts} from './fonts';
import {Reel} from './Reel';

loadFonts();

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Malaysia" component={Reel} width={VIDEO.width} height={VIDEO.height} fps={VIDEO.fps} durationInFrames={VIDEO.frames} defaultProps={{withAudio: true}} />
    <Composition id="MalaysiaFirst6s" component={Reel} width={VIDEO.width} height={VIDEO.height} fps={VIDEO.fps} durationInFrames={VIDEO.testFrames} defaultProps={{withAudio: true}} />
  </>
);
