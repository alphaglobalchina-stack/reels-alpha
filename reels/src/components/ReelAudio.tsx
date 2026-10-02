import React from 'react';
import {Html5Audio, Sequence, interpolate, staticFile, useVideoConfig} from 'remotion';
import {theme} from '../theme';
import {ReelProps} from '../types';

export type Cue = {frame: number; kind: 'swoosh' | 'stamp'};

/** Music bed + SFX cues. Everything is optional: missing files are skipped, not fatal. */
export const ReelAudio: React.FC<Pick<ReelProps, 'sfx' | 'music' | 'musicVolume' | 'assets'> & {cues: Cue[]}> = ({
  sfx, music, musicVolume, assets, cues,
}) => {
  const {durationInFrames, fps} = useVideoConfig();
  return (
    <>
      {music && assets?.music && (
        <Html5Audio
          src={staticFile(theme.assets.music)}
          loop
          volume={(f) =>
            musicVolume *
            interpolate(f, [0, fps * 0.8, durationInFrames - fps * 1.2, durationInFrames], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
          }
        />
      )}
      {sfx &&
        cues.map((c, i) =>
          assets?.[c.kind] ? (
            <Sequence key={i} from={Math.max(0, c.frame)} layout="none">
              <Html5Audio src={staticFile(theme.assets.sfx[c.kind])} volume={0.8} />
            </Sequence>
          ) : null,
        )}
    </>
  );
};
