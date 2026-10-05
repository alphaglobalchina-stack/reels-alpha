import React from 'react';
import {AbsoluteFill, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Cairo';
import {camAt, dofBlur, project, tiltAt} from './camera';
import {BRAND, CITIES, CONTACT, CTA, END, FEATURES, FOCUS, PRICE, ROW2, Rect, T, TITLE} from './data';
import {Background, FLANKS, FLOATERS, FlankCard, FloaterView, Foreground, Plane} from './board';
import {
  BrandCardBody,
  CityCard,
  ContactCardBody,
  CtaCardBody,
  DurationCard,
  FeatureCard,
  PriceCard,
  TitleCard,
  TypeCard,
} from './sections';
import {Card, SHADOW, clamp01, easeInOut, prog} from './ui';
import {ReelSound} from './sound';

// Cairo comes from @remotion/google-fonts when REMOTION_GOOGLE_FONTS=1 (normal machines).
// Default: the identical Cairo files bundled in assets/fonts (loaded by src/fonts.ts), because
// this sandbox's headless Chrome cannot reach fonts.gstatic.com through the TLS proxy.
if (process.env.REMOTION_GOOGLE_FONTS === '1') {
  loadFont('normal', {weights: ['700', '800'], subsets: ['arabic', 'latin']});
}

/** The three end cards: in the board until the lift, then flown to their screen slots. */
const END_CARDS: {key: 'cta' | 'contact' | 'brand'; rect: Rect; delay: number}[] = [
  {key: 'cta', rect: CTA, delay: 0},
  {key: 'contact', rect: CONTACT, delay: 3},
  {key: 'brand', rect: BRAND, delay: 7},
];

const EndBody: React.FC<{k: 'cta' | 'contact' | 'brand'; f: number; settle?: number}> = ({k, f, settle}) =>
  k === 'cta' ? <CtaCardBody f={f} /> : k === 'contact' ? <ContactCardBody /> : <BrandCardBody f={f} settle={settle} />;

export const MalaysiaReel: React.FC<{audio?: boolean}> = ({audio = true}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const cam = camAt(f);
  const {pitch, yaw} = tiltAt(f);

  // DOF switches off while the camera pulls back so the whole board reads sharp
  const zoomP = prog(f, T.zoomOut[0], T.zoomOut[1] - T.zoomOut[0], easeInOut);
  const dofOn = 1 - zoomP;
  const blurOf = (r: Rect, extra = 0) => dofBlur(cam, r, extra) * dofOn;

  const liftOf = (delay: number) =>
    f < T.lift[0] + delay ? 0 : spring({frame: f - T.lift[0] - delay, fps, config: {damping: 17, stiffness: 95, mass: 0.9}});
  const lifted = (k: string) => {
    const c = END_CARDS.find((e) => e.key === k)!;
    return liftOf(c.delay) > 0;
  };
  const backdrop = prog(f, T.lift[0], 16, easeInOut); // board steps back (veil + soft blur)

  const worldTransform = `translate(${FOCUS.x}px, ${FOCUS.y}px) rotateX(${pitch.toFixed(3)}deg) rotateY(${yaw.toFixed(3)}deg) rotate(${cam.roll.toFixed(3)}deg) scale(${cam.z.toFixed(5)}) translate(${(-cam.cx).toFixed(2)}px, ${(-cam.cy).toFixed(2)}px)`;
  const fgFade = 1 - prog(f, T.zoomOut[0], 14);

  return (
    <AbsoluteFill style={{background: '#F7F6F3', overflow: 'hidden'}}>
      <Background cam={cam} />

      {/* ── the board (one continuous world, one camera) ── */}
      <div style={{position: 'absolute', inset: 0, perspective: 2400, perspectiveOrigin: `${FOCUS.x}px ${FOCUS.y}px`, filter: backdrop > 0.01 ? `blur(${(backdrop * 3).toFixed(2)}px)` : undefined}}>
        <div style={{position: 'absolute', left: 0, top: 0, width: 0, height: 0, transformOrigin: '0 0', transform: worldTransform}}>
          {FLANKS.map((fl, i) => (
            <FlankCard key={i} fl={fl} i={i} blur={blurOf(fl.rect, 0.4)} />
          ))}
          <DurationCard f={f} cam={cam} blur={blurOf(ROW2.duration)} />
          <TypeCard f={f} cam={cam} blur={blurOf(ROW2.type)} />
          {CITIES.map((_, i) => (
            <CityCard key={i} i={i} f={f} cam={cam} blur={blurOf(CITIES[i].rect)} />
          ))}
          {FEATURES.map((ft, i) => (
            <FeatureCard key={i} i={i} f={f} cam={cam} blur={blurOf(ft.rect)} />
          ))}
          <PriceCard f={f} cam={cam} blur={blurOf(PRICE)} />
          {END_CARDS.map((c) =>
            lifted(c.key) ? null : (
              <Card key={c.key} rect={c.rect} blur={blurOf(c.rect)}>
                <EndBody k={c.key} f={f} />
              </Card>
            ),
          )}
          {FLOATERS.map((fl, i) => (
            <FloaterView key={i} fl={fl} f={f} cam={cam} i={i} fade={1 - zoomP} />
          ))}
          {/* title last: its towers float over everything around them */}
          <TitleCard f={f} cam={cam} blur={blurOf(TITLE.card)} />
          <Plane f={f} />
        </div>
      </div>

      {backdrop > 0 && <AbsoluteFill style={{background: `rgba(247,246,243,${(0.5 * backdrop).toFixed(3)})`}} />}

      <Foreground f={f} cam={cam} fade={fgFade} />

      {/* ── end: cards lift off the board toward the camera ── */}
      {END_CARDS.map((c) => {
        const e = liftOf(c.delay);
        if (e <= 0) return null;
        const target = END[c.key];
        const from = project(cam, c.rect.x + c.rect.w / 2, c.rect.y + c.rect.h / 2);
        const toScale = target.w / c.rect.w;
        const x = from.x + (target.x + target.w / 2 - from.x) * e;
        const y = from.y + (target.y + target.h / 2 - from.y) * e;
        const sc = cam.z * Math.pow(toScale / cam.z, Math.min(1.05, e));
        const settle = c.key === 'brand' ? clamp01(prog(f, T.brandIn, 18)) : 1;
        return (
          <div
            key={c.key}
            style={{
              position: 'absolute',
              left: x - c.rect.w / 2,
              top: y - c.rect.h / 2,
              width: c.rect.w,
              height: c.rect.h,
              transform: `scale(${sc.toFixed(5)})`,
              zIndex: c.key === 'brand' ? 3 : 2,
            }}
          >
            <Card
              rect={{x: 0, y: 0, w: c.rect.w, h: c.rect.h}}
              style={{boxShadow: `0 ${60 * e}px ${120 * e}px -40px rgba(28,28,30,${0.3 * e}), ${SHADOW}`}}
            >
              <EndBody k={c.key} f={f} settle={settle} />
            </Card>
          </div>
        );
      })}

      {audio && <ReelSound />}
    </AbsoluteFill>
  );
};
