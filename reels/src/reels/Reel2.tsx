import React from 'react';
import {AbsoluteFill, Html5Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import vo from '../../../content/reel2-vo.json';
import {Flash, Grain, Leak, Subtitles, Vignette} from './reel2/fx';
import {ANTON_FILE} from './reel2/objects3d';
import {Range, S1, S10, S2, S3, S4, S5, S6, S7, S8, S9} from './reel2/scenes';
import {usePreload} from './reel2/three';

/**
 * Reel 2 — Canton Fair 140 (English voice-over, Arabic subtitles), 47.5 s @ 30 fps.
 * Every cue is keyed to the force-aligned voice-over in content/reel2-vo.json.
 * Scenes hand over with a different move each time: zoom-through, 3D card flip into
 * full screen, whip pan, text-mask reveal, coin-flip icons, globe dive, vertical push,
 * iris, whip pan, ticket flip.
 */
export const REEL2_FRAMES = 1425;

const PHOTOS = ['tower-night', 'aerial-sunset', 'aerial-day', 'hall-92', 'buyers-pumps', 'buyers-bags', 'hall-banner', 'entrance', 'tower-sunset'];

const bump = (f: number, centres: [number, number][], width = 9) =>
  Math.min(1, centres.reduce((m, [c, a]) => Math.max(m, a * Math.exp(-(((f - c) / width) ** 2))), 0));

export const Reel2: React.FC = () => {
  const f = useCurrentFrame();
  const ready = usePreload([ANTON_FILE], []);
  if (!ready) return null;
  const leak = bump(f, [[100, 0.7], [255, 0.55], [354, 0.5], [534, 0.6], [690, 0.7], [862, 0.7], [1000, 0.5], [1102, 0.5], [1182, 0.55], [1234, 0.6], [1345, 0.45]], 10);
  const flash = bump(f, [[110, 0.35], [538, 0.3], [694, 0.55], [868, 0.65], [1008, 0.25], [1240, 0.3]], 3.5);
  return (
    <AbsoluteFill style={{background: '#050407', overflow: 'hidden'}}>
      <Range f={f} from={238} to={364}><S3 f={f} /></Range>
      <Range f={f} from={92} to={266}><S2 f={f} /></Range>
      <Range f={f} from={0} to={114}><S1 f={f} /></Range>
      <Range f={f} from={346} to={546}><S4 f={f} /></Range>
      <Range f={f} from={528} to={702}><S5 f={f} /></Range>
      <Range f={f} from={686} to={872}><S6 f={f} /></Range>
      <Range f={f} from={852} to={1010}><S7 f={f} /></Range>
      <Range f={f} from={988} to={1112}><S8 f={f} /></Range>
      <Range f={f} from={1092} to={1244}><S9 f={f} /></Range>
      <Range f={f} from={1224} to={REEL2_FRAMES}><S10 f={f} /></Range>
      <Leak f={f} power={leak} />
      <Flash v={flash} />
      <Vignette />
      <Grain f={f} />
      <Subtitles f={f} />
      <Html5Audio
        src={staticFile(vo.audio)}
        volume={(fr) => interpolate(fr, [0, 2, REEL2_FRAMES - 20, REEL2_FRAMES], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}
      />
      {/* keep photos warm in the cache so scene cuts never wait on decoding */}
      <div style={{display: 'none'}}>{PHOTOS.map((p) => <img key={p} src={staticFile(`canton/${p}.webp`)} alt="" />)}</div>
    </AbsoluteFill>
  );
};
