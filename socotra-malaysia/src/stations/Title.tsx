import React from 'react';
import {Img, staticFile} from 'remotion';
import {CAMERA, COLORS, EVENTS, FONTS, IMAGES, LAYOUT, TEXT} from '../data';
import {CameraState} from '../lib/camera';
import {clamp} from '../lib/math';
import {GlassPlinth, SoftShadows} from '../components/Glass';
import {Station} from './Station';

const L = LAYOUT.title;
const TOWERS_W = (L.towersH * IMAGES.towers.w) / IMAGES.towers.h; // ≈ 340
const BASE = L.towersTop + L.towersH; // 1180: the towers stand on the glass floor here
// glass floor under the towers (station-local px)
const FLOOR = {cx: 540, cy: BASE + L.floor.dy, rx: L.floor.rx, ry: L.floor.ry, th: L.floor.th};
const REFL_H = L.reflection.h; // mirrored towers fade out within this many px
const REFL_OPACITY = L.reflection.opacity;
// On the opening frames the camera is zoomed out (CAMERA 'start' zoom 0.86), which would put the
// company line under 52 px and the title under 240 px on screen (frame 0 is also the cover frame).
// Until the camera reaches the title stop, both are scaled up just enough to stay at these on-screen
// sizes; at the hold (zoom 1) the scale is exactly 1.
const COMPANY_PX = L.companySize;
const MIN_COMPANY_PX = L.minCompanyPx;
const MIN_TITLE_PX = L.minTitlePx;
const TITLE_STOP = CAMERA.points.find((p) => p.id === 'title')!;

/** Station 1 — huge "ماليزيا" under the cut-out Petronas towers standing on a glass floor. */
export const TitleStation: React.FC<{frame: number; cam: CameraState}> = ({frame, cam}) => {
  const top = L.top;
  // towers + floor sit a touch "deeper" than the word: a small, clamped inner parallax plus a
  // gentle float, so the clear gap above the title never closes (base moves ≤ ±6 px).
  const camRestY = TITLE_STOP.y;
  const depth = clamp((cam.y - camRestY) * 0.1, -3.5, 3.5);
  const floatY = Math.sin(frame / 38) * 2.5;
  const lift = depth + floatY;
  const shine = clamp((frame - EVENTS.titleShine) / 34);
  const breathe = 1 + 0.006 * Math.sin(frame / 22);
  const opening = frame < (TITLE_STOP.arrive ?? 0);
  const companyK = opening ? Math.max(1, MIN_COMPANY_PX / (COMPANY_PX * cam.zoom)) : 1;
  const titleK = opening ? Math.max(1, MIN_TITLE_PX / (L.titleSize * cam.zoom)) : 1;
  return (
    <Station cam={cam} top={top} bottom={top + 1920} focus={{x: 540, y: top + 930}}>
      <div style={{position: 'absolute', left: 0, top, width: 1080, height: 1920}}>
        {/* champagne halo behind the towers */}
        <div
          style={{
            position: 'absolute',
            left: 540 - 560,
            top: L.towersTop + 330 - 560 + lift,
            width: 1120,
            height: 1120,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${COLORS.champagne}99 0%, ${COLORS.champagne}33 38%, ${COLORS.pearl}00 68%)`,
          }}
        />
        {/* towers on their glass floor (one group: they float together) */}
        <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 0, transform: `translateY(${lift.toFixed(2)}px)`}}>
          <GlassPlinth
            id="title-floor"
            cx={FLOOR.cx}
            cy={FLOOR.cy}
            rx={FLOOR.rx}
            ry={FLOOR.ry}
            thickness={FLOOR.th}
            sheen={0.7}
            shadows={[
              {dx: 70, dy: 18, rx: 470, ry: 40, opacity: 0.07}, // long, diffused, to the light's far side
              {dx: 0, dy: 10, rx: 330, ry: 26, opacity: 0.09},
            ]}
          />
          {/* faint mirrored reflection on the glass (flipped copy, fades within REFL_H) */}
          <div
            style={{
              position: 'absolute',
              left: 540 - TOWERS_W / 2,
              top: BASE,
              width: TOWERS_W,
              height: REFL_H,
              overflow: 'hidden',
              opacity: REFL_OPACITY,
              clipPath: `ellipse(${FLOOR.rx}px ${FLOOR.ry}px at ${FLOOR.cx - (540 - TOWERS_W / 2)}px ${FLOOR.cy - BASE}px)`,
              WebkitMaskImage: 'linear-gradient(180deg, #000 0%, rgba(0,0,0,0.45) 40%, rgba(0,0,0,0) 100%)',
              maskImage: 'linear-gradient(180deg, #000 0%, rgba(0,0,0,0.45) 40%, rgba(0,0,0,0) 100%)',
            }}
          >
            <Img
              src={staticFile(IMAGES.towers.file)}
              style={{position: 'absolute', left: 0, top: 0, width: TOWERS_W, height: L.towersH, display: 'block', transform: 'scaleY(-1)', transformOrigin: '50% 50%'}}
            />
          </div>
          {/* contact shadows of the two shafts on the glass */}
          <SoftShadows
            id="title-contact"
            cx={540}
            cy={BASE + 2}
            shadows={[
              {dx: -97, rx: 82, ry: 9, opacity: 0.16},
              {dx: 103, rx: 76, ry: 9, opacity: 0.16},
            ]}
          />
          {/* towers cut-out: fully opaque down to the base */}
          <Img
            src={staticFile(IMAGES.towers.file)}
            style={{position: 'absolute', left: 540 - TOWERS_W / 2, top: L.towersTop, width: TOWERS_W, height: L.towersH, display: 'block'}}
          />
        </div>

        {/* company, small, at the top (below the 250 px safe line) */}
        <div
          style={{
            position: 'absolute',
            top: L.companyY - 44,
            left: 0,
            width: 1080,
            height: 88,
            display: 'flex',
            direction: 'rtl',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 18,
            transform: companyK > 1 ? `scale(${companyK.toFixed(4)})` : undefined,
          }}
        >
          <Img src={staticFile(IMAGES.logo.file)} style={{height: 84, width: (84 * IMAGES.logo.w) / IMAGES.logo.h}} />
          <span style={{fontFamily: FONTS.arabic, fontWeight: 500, fontSize: COMPANY_PX, color: COLORS.ink, lineHeight: 1}}>
            {TEXT.companyAr}
          </span>
        </div>

        {/* the title */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            width: 1080,
            top: L.titleY - 200,
            height: 400,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `scale(${(breathe * titleK).toFixed(4)})`,
          }}
        >
          <TitleWord shine={shine} />
        </div>
      </div>
    </Station>
  );
};

const TitleWord: React.FC<{shine: number}> = ({shine}) => {
  const base: React.CSSProperties = {
    fontFamily: FONTS.arabic,
    fontWeight: 700,
    fontSize: LAYOUT.title.titleSize,
    lineHeight: 1.25,
    direction: 'rtl',
    whiteSpace: 'nowrap',
  };
  const pos = 130 - shine * 160; // background-position % (sweeps right → left, with the reading direction)
  return (
    <div style={{position: 'relative'}}>
      <div
        style={{
          ...base,
          color: COLORS.ink,
          textShadow: `0 0 34px ${COLORS.pearl}, 0 0 60px ${COLORS.pearl}, 0 18px 40px rgba(28,28,30,0.12)`,
        }}
      >
        {TEXT.title}
      </div>
      <div
        style={{
          ...base,
          position: 'absolute',
          inset: 0,
          color: 'transparent',
          backgroundImage: `linear-gradient(105deg, rgba(232,217,181,0) 45%, rgba(214,188,130,0.95) 48.5%, #FFF6E2 50%, rgba(214,188,130,0.95) 51.5%, rgba(232,217,181,0) 55%)`,
          backgroundSize: '300% 100%',
          backgroundPosition: `${pos}% 0`,
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          opacity: shine > 0 && shine < 1 ? 1 : 0,
        }}
      >
        {TEXT.title}
      </div>
    </div>
  );
};
