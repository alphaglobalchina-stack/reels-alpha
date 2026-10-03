import React from 'react';
import {AbsoluteFill, Html5Audio, Sequence, interpolate, staticFile} from 'remotion';
import {linearTiming, TransitionSeries} from '@remotion/transitions';
import {AUDIO, COLORS, FPS, SCENE_FRAMES, SCENE_STRIDE, TOTAL_FRAMES, TRANSITION_FRAMES} from './config';
import {ProgressBar} from './components/ProgressBar';
import {Scene1} from './scenes/Scene1';
import {Scene2} from './scenes/Scene2';
import {Scene3} from './scenes/Scene3';
import {Scene4} from './scenes/Scene4';
import {Scene5} from './scenes/Scene5';
import {Scene6} from './scenes/Scene6';
import {diagonalRedWipe} from './WipeTransition';

const SCENES = [Scene1, Scene2, Scene3, Scene4, Scene5, Scene6];

export const ChinaReel: React.FC = () => {
  const fadeIn = AUDIO.fadeInSeconds * FPS;
  const fadeOut = AUDIO.fadeOutSeconds * FPS;

  return (
    <AbsoluteFill style={{background: COLORS.black}}>
      <TransitionSeries>
        {SCENES.map((Scene, i) => (
          <React.Fragment key={i}>
            <TransitionSeries.Sequence durationInFrames={SCENE_FRAMES}>
              <Scene />
            </TransitionSeries.Sequence>
            {i < SCENES.length - 1 && (
              <TransitionSeries.Transition presentation={diagonalRedWipe()} timing={linearTiming({durationInFrames: TRANSITION_FRAMES})} />
            )}
          </React.Fragment>
        ))}
      </TransitionSeries>

      <ProgressBar />

      {/* الموسيقى مع Fade-in/out */}
      <Html5Audio
        src={staticFile(AUDIO.music)}
        loop
        volume={(f) =>
          AUDIO.musicVolume *
          interpolate(f, [0, fadeIn, TOTAL_FRAMES - fadeOut, TOTAL_FRAMES], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
        }
      />

      {/* whoosh عند كل انتقال */}
      {SCENES.slice(1).map((_, i) => (
        <Sequence key={i} from={(i + 1) * SCENE_STRIDE - 2} durationInFrames={30} layout="none">
          <Html5Audio src={staticFile(AUDIO.whoosh)} volume={AUDIO.whooshVolume} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
