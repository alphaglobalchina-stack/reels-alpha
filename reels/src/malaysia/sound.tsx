import React from 'react';
import {Html5Audio, Sequence, interpolate, staticFile} from 'remotion';
import {AUDIO, DURATION, T, TEXT, s} from './data';
import {counterValue, priceWheelValues} from './sections';

type Cue = {f: number; src: string; vol: number};

/** Frames where a counter wheel passes a whole number → one tick each. */
const crossings = (fn: (f: number) => number[], from: number, to: number) => {
  const out: number[] = [];
  for (let f = from; f <= to; f++) {
    const a = fn(f - 1), b = fn(f);
    if (a.some((v, i) => Math.floor(v + 1e-6) !== Math.floor(b[i] + 1e-6))) out.push(f);
  }
  return out;
};

export const CUES: Cue[] = (() => {
  const c: Cue[] = [];
  // camera moves
  c.push({f: 0, src: AUDIO.whoosh, vol: 0.55});
  c.push({f: s(3.0) - 2, src: AUDIO.whoosh, vol: 0.45});
  c.push({f: s(6.0) - 2, src: AUDIO.whoosh, vol: 0.45});
  c.push({f: T.plane[0] + 12, src: AUDIO.whooshSoft, vol: 0.5});
  T.featureStops.forEach((f, i) => {
    c.push({f: f - 14, src: AUDIO.whooshSoft, vol: 0.32});
    c.push({f: f - 2, src: AUDIO.pop, vol: 0.22 + (i === 4 ? 0.08 : 0)});
  });
  c.push({f: T.priceArrive - 18, src: AUDIO.whoosh, vol: 0.45});
  c.push({f: T.zoomOut[0] - 2, src: AUDIO.whoosh, vol: 0.4});
  // counters
  crossings((f) => [counterValue(f, T.countersStart, TEXT.days.n), counterValue(f, T.countersStart + 6, TEXT.nights.n)], T.countersStart, T.countersStart + 40).forEach((f) =>
    c.push({f, src: AUDIO.tick, vol: 0.3}),
  );
  const pw = crossings((f) => [priceWheelValues(f)[0]], T.priceCount[0], T.priceCount[1]);
  pw.forEach((f) => c.push({f, src: AUDIO.tick, vol: 0.32}));
  // price land + shine
  c.push({f: T.priceCount[1], src: AUDIO.shimmer, vol: 0.55});
  c.push({f: T.priceShine + 4, src: AUDIO.shimmer, vol: 0.2});
  // end cards
  c.push({f: T.lift[0], src: AUDIO.pop, vol: 0.3});
  c.push({f: T.lift[0] + 3, src: AUDIO.pop, vol: 0.25});
  c.push({f: T.lift[0] + 7, src: AUDIO.pop, vol: 0.25});
  return c;
})();

/** Everything fades out over the last second. */
const masterFade = (absFrame: number) =>
  interpolate(absFrame, [DURATION - 30, DURATION - 1], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

export const ReelSound: React.FC = () => (
  <>
    <Html5Audio src={staticFile(AUDIO.music)} volume={(f) => 0.9 * masterFade(f)} />
    {CUES.map((q, i) => (
      <Sequence key={i} from={Math.max(0, q.f)} layout="none">
        <Html5Audio src={staticFile(q.src)} volume={(lf) => q.vol * masterFade(lf + Math.max(0, q.f))} />
      </Sequence>
    ))}
  </>
);
