import React from 'react';
import {AbsoluteFill, Html5Audio, staticFile, useCurrentFrame} from 'remotion';
import {AUDIO, CAMERA, COLORS, IMAGES, WORLD} from './data';
import {cameraAt, CameraState} from './lib/camera';
import {Background} from './layers/Background';
import {LensGlints, LightRays, MeshGradient} from './layers/Atmosphere';
import {Dust} from './layers/Dust';
import {Foreground} from './layers/Foreground';
import {PlaneRider, ThreadLine} from './layers/Thread';
import {TitleStation} from './stations/Title';
import {TicketStation} from './stations/Ticket';
import {StampsStation} from './stations/Stamps';
import {FeaturesStation} from './stations/Features';
import {PriceStation} from './stations/Price';
import {BookingStation} from './stations/Booking';

const worldTransform = (cam: CameraState, p = 1) => {
  const ref = WORLD.parallaxRef;
  const x = 540 + (cam.x - 540) * p;
  const y = ref + (cam.y - ref) * p;
  const z = 1 + (cam.zoom - 1) * p;
  return `translate(540px, 960px) rotate(${cam.roll.toFixed(3)}deg) scale(${z.toFixed(4)}) translate(${(-x).toFixed(2)}px, ${(-y).toFixed(2)}px)`;
};

const Layer: React.FC<{transform: string; children: React.ReactNode}> = ({transform, children}) => (
  <div style={{position: 'absolute', left: 0, top: 0, width: WORLD.width, height: 0, transformOrigin: '0 0', transform}}>{children}</div>
);

export const Reel: React.FC<{withAudio?: boolean}> = ({withAudio = true}) => {
  const frame = useCurrentFrame();
  const cam = cameraAt(frame);
  return (
    <AbsoluteFill style={{background: `linear-gradient(180deg, #F9F8F5 0%, ${COLORS.pearl} 45%, #F3F1EC 100%)`, overflow: 'hidden'}}>
      {/* living atmosphere, screen space: pastel mesh + slow diagonal light shafts */}
      <MeshGradient frame={frame} cam={cam} />
      <LightRays frame={frame} cam={cam} />
      <div style={{position: 'absolute', inset: 0, perspective: CAMERA.perspective, perspectiveOrigin: '540px 960px'}}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transformOrigin: '540px 960px',
            transform: `rotateX(${cam.tiltX.toFixed(3)}deg) rotateY(${cam.tiltY.toFixed(3)}deg)`,
          }}
        >
          <Layer transform={worldTransform(cam, WORLD.bgParallax)}>
            <Background frame={frame} cam={cam} />
          </Layer>
          <Layer transform={worldTransform(cam)}>
            <ThreadLine frame={frame} cam={cam} />
            <Dust frame={frame} cam={cam} />
            <TitleStation frame={frame} cam={cam} />
            <TicketStation frame={frame} cam={cam} />
            <StampsStation frame={frame} cam={cam} />
            <FeaturesStation frame={frame} cam={cam} />
            <PriceStation frame={frame} cam={cam} />
            <BookingStation frame={frame} cam={cam} />
            <PlaneRider frame={frame} />
          </Layer>
          <Layer transform={worldTransform(cam, WORLD.fgParallax)}>
            <Foreground frame={frame} cam={cam} />
          </Layer>
        </div>
      </div>
      {/* lens glints when the camera lands on a station (above the world, under vignette / grain) */}
      <LensGlints frame={frame} cam={cam} />
      {/* very light warm vignette (corners darken ~3.5 %) + near-invisible canvas grain */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 75% 60% at 50% 48%, rgba(0,0,0,0) 58%, rgba(128,106,78,0.075) 100%)'}} />
      <AbsoluteFill style={{backgroundImage: `url(${staticFile(IMAGES.grain)})`, backgroundSize: '512px 512px', opacity: 0.06}} />
      {withAudio && <Html5Audio src={staticFile(AUDIO.soundtrack)} />}
    </AbsoluteFill>
  );
};
