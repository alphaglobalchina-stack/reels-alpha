import React from 'react';
import {spring} from 'remotion';
import {COLORS, EVENTS, FONTS, LAYOUT, TEXT, VIDEO} from '../data';
import {CameraState} from '../lib/camera';
import {clamp, smoothstep} from '../lib/math';
import {Icon3D} from '../components/Icon3D';
import {FEATURE_ICONS} from '../components/icons';
import {Station} from './Station';

const D = LAYOUT.discD;
const ICON = LAYOUT.iconSize;

const Disc: React.FC<{k: number; frame: number}> = ({k, frame}) => {
  const T = EVENTS.featureFocus[k];
  const near = 1 - clamp(Math.abs(frame - T) / 18);
  const focus = near * near * (3 - 2 * near);
  // the icon turns to face the camera as it arrives (spring), then idles with a gentle sway
  const turn = spring({frame: frame - (T - 12), fps: VIDEO.fps, config: {damping: 12, stiffness: 90, mass: 0.8}});
  const dir = k % 2 ? 1 : -1;
  const ry = dir * -46 * (1 - turn) + Math.sin((frame - T) / 14) * 8 * turn;
  const rx = -8 + 5 * (1 - turn);
  const shine = (frame - (T - 3)) / 16;
  const pop = 1 + 0.06 * focus;
  const glow = 0.25 + 0.75 * focus;
  const bob = Math.sin(frame / 20 + k) * 4;
  return (
    <div style={{position: 'relative', width: D, height: D + 120, transform: `translateY(${bob}px)`}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: D,
          height: D,
          borderRadius: '50%',
          transform: `scale(${pop})`,
          background: 'radial-gradient(circle at 36% 30%, #FFFFFF 0%, #FCFBF8 42%, #F0EDE7 78%, #E8E4DC 100%)',
          boxShadow: [
            `0 26px 48px rgba(28,28,30,0.10)`,
            `0 5px 12px rgba(28,28,30,0.06)`,
            `inset 0 -12px 26px rgba(28,28,30,0.05)`,
            `inset 0 10px 18px rgba(255,255,255,0.95)`,
            `0 0 0 ${2 + 8 * focus}px rgba(232,217,181,${0.55 * glow})`,
            `0 0 ${30 + 60 * focus}px rgba(232,217,181,${0.65 * glow})`,
          ].join(', '),
        }}
      >
        {/* soft contact shadow under the icon */}
        <div
          style={{
            position: 'absolute',
            left: D / 2 - 90,
            top: D / 2 + ICON * 0.36,
            width: 180,
            height: 26,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(28,28,30,0.16), rgba(28,28,30,0) 70%)',
          }}
        />
        <div style={{position: 'absolute', left: (D - ICON) / 2, top: (D - ICON) / 2 - 6}}>
          <Icon3D id={`feat-${k}`} def={FEATURE_ICONS[k]} size={ICON} ry={ry} rx={rx} depth={16} layers={10} side={['#EFE6D2', '#C2A874']} shine={shine} />
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: D / 2 - 300,
          width: 600,
          top: D + 26,
          textAlign: 'center',
          direction: 'rtl',
          fontFamily: FONTS.arabic,
          fontWeight: 500,
          fontSize: 54,
          lineHeight: 1.2,
          color: COLORS.ink,
          whiteSpace: 'nowrap',
        }}
      >
        {TEXT.features[k]}
      </div>
    </div>
  );
};

/** Station 4 — seven porcelain discs strung on the thread like beads, one 3D icon each. */
export const FeaturesStation: React.FC<{frame: number; cam: CameraState}> = ({frame, cam}) => (
  <>
    {LAYOUT.features.map((p, k) => (
      <Station key={k} cam={cam} top={p.y - D / 2 - 60} bottom={p.y + D / 2 + 160} focus={{x: p.x, y: p.y + 40}}>
        <div style={{position: 'absolute', left: p.x - D / 2, top: p.y - D / 2, opacity: 0.7 + 0.3 * smoothstep(-80, -30, frame - EVENTS.featureFocus[k])}}>
          <Disc k={k} frame={frame} />
        </div>
      </Station>
    ))}
  </>
);
