import React from 'react';
import {Img, spring, staticFile} from 'remotion';
import {COLORS, EVENTS, FONTS, IMAGES, LAYOUT, TEXT, VIDEO} from '../data';
import {CameraState} from '../lib/camera';
import {clamp, smoothstep} from '../lib/math';
import {Station} from './Station';

const R = LAYOUT.stampR; // 380
const S = R * 2;
// 4:5 photo window — exactly the photos' ratio (1122 x 1402), so the whole picture is shown.
const PW = 384;
const PH = 480;
const PR = 60;
const PX = R - PW / 2;
const PY = R - 50 - PH / 2;
const TEXT_R = 318;

const teeth = (() => {
  const n = 120;
  const pts: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const a = (i * Math.PI) / n;
    const r = i % 2 ? R - 12 : R;
    pts.push(`${(R + r * Math.sin(a)).toFixed(1)},${(R - r * Math.cos(a)).toFixed(1)}`);
  }
  return pts.join(' ');
})();

const starPts = (cx: number, cy: number, r: number) => {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.42 : r;
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(' ');
};

const polar = (deg: number, r: number) => ({x: R + r * Math.sin((deg * Math.PI) / 180), y: R - r * Math.cos((deg * Math.PI) / 180)});

// bottom arc, left → right through 6 o'clock, so the glyphs stand upright
const arc = (() => {
  const a = 72;
  const p0 = polar(180 + a, TEXT_R);
  const p1 = polar(180 - a, TEXT_R);
  return `M${p0.x.toFixed(1)} ${p0.y.toFixed(1)} A${TEXT_R} ${TEXT_R} 0 0 0 ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
})();

const Stamp: React.FC<{i: number; frame: number}> = ({i, frame}) => {
  const hit = EVENTS.stampHits[i];
  const {rot} = LAYOUT.stamps[i];
  const p = spring({frame: frame - hit, fps: VIDEO.fps, config: {damping: 10, stiffness: 170, mass: 0.75}});
  const landed = frame >= hit;
  const scale = landed ? 1.42 - 0.42 * p : 1.42;
  const opacity = clamp((frame - hit + 4) / 5);
  const ripple = clamp((frame - hit) / 18);
  const ghost = 1 - smoothstep(hit - 2, hit + 6, frame);
  const air = 1 - clamp(p); // shadow is wide and soft while the stamp is still in the air
  const idle = landed ? Math.sin((frame - hit) / 26) * 0.35 : 0;
  const city = IMAGES.cities[i];
  return (
    <div style={{position: 'relative', width: S, height: S}}>
      {/* target ring the camera flies to before the stamp lands */}
      {ghost > 0.01 && (
        <svg width={S} height={S} style={{position: 'absolute', inset: 0, overflow: 'visible', opacity: ghost}}>
          <circle cx={R} cy={R} r={R - 8} fill="none" stroke={COLORS.champagneDeep} strokeWidth={2.5} strokeDasharray="3 13" strokeLinecap="round" opacity={0.75} />
          <circle cx={R} cy={R} r={R - 60} fill={COLORS.champagne} opacity={0.12} />
        </svg>
      )}
      {ripple > 0 && ripple < 1 && (
        <svg width={S} height={S} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
          <circle cx={R} cy={R} r={R + 10 + ripple * 110} fill="none" stroke={COLORS.champagneDeep} strokeWidth={6 * (1 - ripple) + 1} opacity={0.6 * (1 - ripple)} />
        </svg>
      )}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity,
          transform: `rotate(${rot + (1 - clamp(p)) * 9 + idle}deg) scale(${scale})`,
          filter: `drop-shadow(0 ${18 + 40 * air}px ${26 + 50 * air}px rgba(28,28,30,${0.13 - 0.05 * air}))`,
        }}
      >
        <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
          <defs>
            <radialGradient id={`st-body-${i}`} cx="0.42" cy="0.38" r="0.7">
              <stop offset="0" stopColor="#FFFFFF" />
              <stop offset="0.75" stopColor="#FBFAF7" />
              <stop offset="1" stopColor="#F1EEE8" />
            </radialGradient>
            <linearGradient id={`st-gold-${i}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#E9D6A8" />
              <stop offset="1" stopColor="#B8975A" />
            </linearGradient>
            <path id={`st-arc-${i}`} d={arc} />
          </defs>
          <polygon points={teeth} fill={`url(#st-body-${i})`} stroke="#E7E1D6" strokeWidth={1} />
          <circle cx={R} cy={R} r={R - 24} fill="none" stroke={`url(#st-gold-${i})`} strokeWidth={3.5} />
          <circle cx={R} cy={R} r={R - 33} fill="none" stroke={`url(#st-gold-${i})`} strokeWidth={1.3} />
          {/* top ornaments */}
          <polygon points={starPts(R, R - TEXT_R + 8, 13)} fill={`url(#st-gold-${i})`} />
          {[-56, 56].map((d) => {
            const q = polar(d, TEXT_R - 4);
            return <polygon key={d} points={starPts(q.x, q.y, 10)} fill={`url(#st-gold-${i})`} />;
          })}
          {[-72, 72, -40 + 180, 40 + 180].map((d) => {
            const q = polar(d, TEXT_R - 6);
            return <circle key={d} cx={q.x} cy={q.y} r={4} fill={`url(#st-gold-${i})`} />;
          })}
          {/* city name on the ring */}
          <text fontFamily={FONTS.arabic} fontWeight={700} fontSize={62} fill={COLORS.ink} direction="rtl">
            <textPath href={`#st-arc-${i}`} startOffset="50%" textAnchor="middle">
              {TEXT.cities[i]}
            </textPath>
          </text>
        </svg>
        {/* the photo, whole (4:5 window = 4:5 photo) */}
        <div
          style={{
            position: 'absolute',
            left: PX,
            top: PY,
            width: PW,
            height: PH,
            borderRadius: PR,
            overflow: 'hidden',
            boxShadow: `0 0 0 6px #FFFFFF, 0 0 0 7.5px ${COLORS.champagneDeep}, 0 10px 22px rgba(28,28,30,0.12)`,
            background: COLORS.warmGrey,
          }}
        >
          <Img src={staticFile(city.file)} style={{width: '100%', height: '100%', objectFit: 'cover', display: 'block'}} />
        </div>
      </div>
    </div>
  );
};

/** Station 3 — three passport stamps, stamped in order as the camera lands on each. */
export const StampsStation: React.FC<{frame: number; cam: CameraState}> = ({frame, cam}) => (
  <>
    {LAYOUT.stamps.map((s, i) => (
      <Station key={i} cam={cam} top={s.y - R - 140} bottom={s.y + R + 140} focus={{x: s.x, y: s.y}}>
        <div style={{position: 'absolute', left: s.x - R, top: s.y - R}}>
          <Stamp i={i} frame={frame} />
        </div>
      </Station>
    ))}
  </>
);
