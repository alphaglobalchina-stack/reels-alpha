import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {C} from './brand';
import {Dust, Grain, Vignette} from './fx';
import {FPS} from './timing';
import {Subtitles} from './Subtitles';
import {Scene1, S1, s1Cam, S1_TARGET} from './scenes/S1Hook';
import {Scene2, S2, s2Pin} from './scenes/S2Map';
import {Scene3, S3} from './scenes/S3Market';
import {Scene4, S4, s4Pick} from './scenes/S4Sourcing';
import {Scene5, S5} from './scenes/S5Negotiation';
import {Scene6, S6} from './scenes/S6Process';
import {Scene7, S7} from './scenes/S7Range';
import {Scene8, S8} from './scenes/S8Shipping';
import {Scene9, S9} from './scenes/S9Partner';
import {Scene10, S10} from './scenes/S10Brand';
import {s5Match} from './scenes/S5Negotiation';
import {Portal} from './Portal';
import {ramp} from './lib';
import {project} from './lib';

export type AlphaOpeningProps = {audio: boolean; subtitles: boolean};

/**
 * ALPHA — official opening film. One continuous camera journey; each scene is mounted
 * only inside its time window and hands over through portals / shared elements.
 * All times are global seconds taken from the voice-over alignment.
 */
export const AlphaOpening: React.FC<AlphaOpeningProps> = ({audio, subtitles}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const live = (a: number, b: number) => t >= a && t < b;

  return (
    <AbsoluteFill style={{background: C.ink}}>
      {live(S1.start, S1.end) && <Scene1 t={t} />}
      {live(S2.start, S2.end) && (() => {
        const p = project(s1Cam(t), S1_TARGET);
        return (
          <Portal t={t} a={S2.start} b={S1.end} x={p.x} y={p.y}>
            <Scene2 t={t} />
          </Portal>
        );
      })()}
      {live(S3.start, S3.end) && (() => {
        const p = s2Pin(Math.min(t, S2.end - 0.001));
        return (
          <Portal t={t} a={S3.start} b={S2.end} x={p.x} y={p.y}>
            <Scene3 t={t} />
          </Portal>
        );
      })()}
      {live(S4.start, S4.end) && (
        <AbsoluteFill style={{opacity: ramp(t, S4.start, S3.end)}}>
          <Scene4 t={t} />
        </AbsoluteFill>
      )}
      {live(S5.start, S5.end) && (() => {
        const p = s4Pick(Math.min(t, S4.end - 0.001));
        return (
          <Portal t={t} a={S5.start} b={S4.end} x={p.x} y={p.y}>
            <Scene5 t={t} />
          </Portal>
        );
      })()}
      {live(S6.start, S6.end) && (() => {
        const p = s5Match(Math.min(t, S5.end - 0.001));
        return (
          <Portal t={t} a={S6.start} b={S5.end} x={p.x} y={p.y}>
            <Scene6 t={t} />
          </Portal>
        );
      })()}
      {live(S7.start, S7.end) && (
        <AbsoluteFill style={{opacity: ramp(t, S7.start, S6.end)}}>
          <Scene7 t={t} />
        </AbsoluteFill>
      )}
      {live(S8.start, S8.end) && (
        <AbsoluteFill style={{opacity: ramp(t, S8.start, S7.end)}}>
          <Scene8 t={t} />
        </AbsoluteFill>
      )}
      {live(S9.start, S9.end) && <Scene9 t={t} />}
      {live(S10.start, S10.end) && <Scene10 t={t} />}
      <Dust t={t} amount={t < S10.start + 0.4 ? 0.7 : 0} />
      {t < S10.start + 0.6 && <Vignette />}
      {subtitles && <Subtitles t={t} />}
      <Grain frame={frame} opacity={t < S10.start + 0.6 ? 0.075 : 0.05} />
      {audio && <Audio src={staticFile('film/mix.wav')} />}
    </AbsoluteFill>
  );
};
