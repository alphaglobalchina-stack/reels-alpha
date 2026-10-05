import React from 'react';
import {Img, spring, staticFile} from 'remotion';
import {CAMERA, COLORS, EVENTS, FONTS, IMAGES, LAYOUT, TEXT, VIDEO} from '../data';
import {CameraState} from '../lib/camera';
import {clamp, smoothstep} from '../lib/math';
import {GlassPlinth} from '../components/Glass';
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
// glass plinth each stamp stands on (stamp-local px): an ellipse at the stamp's bottom edge
const GLASS = {cy: S + LAYOUT.stampGlass.dy, rx: LAYOUT.stampGlass.rx, ry: LAYOUT.stampGlass.ry, th: LAYOUT.stampGlass.th};
// The next stamp's target (glass, dashed ring, fill) only fades in once the camera has left the
// previous stop, so it never sits over a stamp that is still in focus.
const PREV_STOP = EVENTS.stampTargets.prevStops;
const PRE_LEAD = EVENTS.stampTargets.preLead; // frames before the hit at the earliest
const PRE_RAMP = EVENTS.stampTargets.preRamp; // fade-in length (frames)
const prevLeave = PREV_STOP.map((id) => {
  const p = CAMERA.points.find((q) => q.id === id)!;
  return p.leave ?? p.arrive ?? 0;
});
/** 0 → 1 as the camera heads for stamp i (after the previous hold has ended). */
const preArrival = (i: number, frame: number) => {
  const s0 = Math.max(EVENTS.stampHits[i] - PRE_LEAD, prevLeave[i]);
  return smoothstep(s0, s0 + PRE_RAMP, frame);
};

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
  const air = 1 - clamp(p); // shadow is wide and soft while the stamp is still in the air
  const idle = landed ? Math.sin((frame - hit) / 26) * 0.35 : 0;
  const city = IMAGES.cities[i];
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: S, height: S}}>
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
        }}
      >
        {/* soft shadow (radial gradient, no blur filter): wide and faint while in the air */}
        <StampShadow air={air} />
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

/** Equivalent of drop-shadow(0 dy blur) for the round stamp, as a cheap radial gradient. */
const StampShadow: React.FC<{air: number}> = ({air}) => {
  const dy = 18 + 40 * air;
  const sigma = 26 + 50 * air;
  const o = 0.13 - 0.05 * air;
  const rad = R + sigma;
  const inner = ((R - sigma) / rad) * 100;
  return (
    <div
      style={{
        position: 'absolute',
        left: R - rad,
        top: R + dy - rad,
        width: rad * 2,
        height: rad * 2,
        borderRadius: '50%',
        background: `radial-gradient(circle closest-side, rgba(58,48,36,${o.toFixed(3)}) ${inner.toFixed(1)}%, rgba(58,48,36,${(o * 0.45).toFixed(3)}) ${((inner + 100) / 2).toFixed(1)}%, rgba(58,48,36,0) 100%)`,
      }}
    />
  );
};

/** Target ring the camera flies to before the stamp lands (under every stamp body). */
const StampTarget: React.FC<{i: number; frame: number}> = ({i, frame}) => {
  const hit = EVENTS.stampHits[i];
  const ghost = preArrival(i, frame) * (1 - smoothstep(hit - 2, hit + 6, frame));
  if (ghost <= 0.01) return null;
  return (
    <svg width={S} height={S} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: ghost}}>
      <circle cx={R} cy={R} r={R - 8} fill="none" stroke={COLORS.champagneDeep} strokeWidth={2.5} strokeDasharray="3 13" strokeLinecap="round" opacity={0.75} />
      <circle cx={R} cy={R} r={R - 60} fill={COLORS.champagne} opacity={0.12} />
    </svg>
  );
};

/** Glass plinth under one stamp: lights up in champagne for a moment when the stamp lands. */
const StampGlass: React.FC<{i: number; frame: number}> = ({i, frame}) => {
  const hit = EVENTS.stampHits[i];
  const flash = frame >= hit ? 1 - smoothstep(hit, hit + 22, frame) : 0;
  const appear = preArrival(i, frame); // fades in once the camera heads for this stamp
  if (appear <= 0.005) return null;
  return (
    <GlassPlinth
      id={`stamp-glass-${i}`}
      cx={R}
      cy={GLASS.cy}
      rx={GLASS.rx}
      ry={GLASS.ry}
      thickness={GLASS.th}
      sheen={0.8}
      glow={0.9 * flash}
      opacity={appear}
      shadows={[
        {dx: 90, dy: 44, rx: 430, ry: 74, opacity: 0.08}, // long, diffused (light from the upper left)
        {dx: 0, dy: 22, rx: 330, ry: 46, opacity: 0.08},
      ]}
    />
  );
};

/**
 * Station 3 — three passport stamps, stamped in order as the camera lands on each.
 * Two passes, so nothing of a later stamp's target is ever painted over an earlier stamp:
 *  1. glass plinths + target rings of all three stamps (soft, no depth blur needed),
 *  2. the stamp bodies, in order 0, 1, 2 (later stamps overlap earlier ones, like real stamps).
 */
export const StampsStation: React.FC<{frame: number; cam: CameraState}> = ({frame, cam}) => {
  const st = LAYOUT.stamps;
  const ys = st.map((s) => s.y);
  return (
    <>
      <Station cam={cam} top={Math.min(...ys) - R - 140} bottom={Math.max(...ys) + R + 160} focus={{x: 540, y: (Math.min(...ys) + Math.max(...ys)) / 2}} blur={false}>
        {st.map((s, i) => (
          <div key={i} style={{position: 'absolute', left: s.x - R, top: s.y - R}}>
            <StampGlass i={i} frame={frame} />
            <StampTarget i={i} frame={frame} />
          </div>
        ))}
      </Station>
      {st.map((s, i) => (
        <Station key={i} cam={cam} top={s.y - R - 140} bottom={s.y + R + 160} focus={{x: s.x, y: s.y}}>
          <div style={{position: 'absolute', left: s.x - R, top: s.y - R}}>
            <Stamp i={i} frame={frame} />
          </div>
        </Station>
      ))}
    </>
  );
};
