import React from 'react';
import {Img, staticFile} from 'remotion';
import {CAMERA, COLORS, EVENTS, FONTS, IMAGES, LAYOUT, TEXT} from '../data';
import {CameraState} from '../lib/camera';
import {clamp, smoothstep} from '../lib/math';
import {Station} from './Station';

const L = LAYOUT.title;
const TOWERS_W = (L.towersH * IMAGES.towers.w) / IMAGES.towers.h;

/** Station 1 — huge "ماليزيا" with the cut-out Petronas towers floating behind it. No card. */
export const TitleStation: React.FC<{frame: number; cam: CameraState}> = ({frame, cam}) => {
  const top = L.top;
  // towers sit "deeper" than the word: they lag a little behind the camera (inner parallax)
  const camRestY = CAMERA.points.find((p) => p.id === 'title')!.y;
  const depth = (cam.y - camRestY) * 0.14;
  const floatY = Math.sin(frame / 38) * 9;
  const floatR = Math.sin(frame / 53) * 0.5;
  const shine = clamp((frame - EVENTS.titleShine) / 34);
  const breathe = 1 + 0.006 * Math.sin(frame / 22);
  return (
    <Station cam={cam} top={top} bottom={top + 1920} focus={{x: 540, y: top + 930}}>
      <div style={{position: 'absolute', left: 0, top, width: 1080, height: 1920}}>
        {/* champagne halo behind the towers */}
        <div
          style={{
            position: 'absolute',
            left: 540 - 560,
            top: L.towersTop + 120 + depth,
            width: 1120,
            height: 1120,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${COLORS.champagne}99 0%, ${COLORS.champagne}33 38%, ${COLORS.pearl}00 68%)`,
          }}
        />
        {/* towers cut-out */}
        <div
          style={{
            position: 'absolute',
            left: 540 - TOWERS_W / 2,
            top: L.towersTop + depth + floatY,
            width: TOWERS_W,
            height: L.towersH,
            transform: `rotate(${floatR}deg)`,
            transformOrigin: '50% 80%',
            filter: 'drop-shadow(0 30px 40px rgba(28,28,30,0.10))',
          }}
        >
          <Img src={staticFile(IMAGES.towers.file)} style={{width: '100%', height: '100%', display: 'block'}} />
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
          }}
        >
          <Img src={staticFile(IMAGES.logo.file)} style={{height: 84, width: (84 * IMAGES.logo.w) / IMAGES.logo.h}} />
          <span style={{fontFamily: FONTS.arabic, fontWeight: 500, fontSize: 54, color: COLORS.ink, lineHeight: 1}}>
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
            transform: `scale(${breathe})`,
          }}
        >
          <TitleWord shine={shine} />
        </div>

        {/* ornament */}
        <svg width={1080} height={40} style={{position: 'absolute', left: 0, top: L.titleY + 180}} viewBox="0 0 1080 40">
          <line x1={540 - 170} y1={20} x2={540 - 26} y2={20} stroke={COLORS.champagneDeep} strokeWidth={2} opacity={0.8 * smoothstep(20, 40, frame)} />
          <line x1={540 + 26} y1={20} x2={540 + 170} y2={20} stroke={COLORS.champagneDeep} strokeWidth={2} opacity={0.8 * smoothstep(20, 40, frame)} />
          <rect x={540 - 9} y={11} width={18} height={18} transform="rotate(45 540 20)" fill={COLORS.champagneDeep} />
        </svg>
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
