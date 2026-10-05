import React from 'react';
import {COLORS, COUNTERS, EVENTS, FONTS, LAYOUT, TEXT} from '../data';
import {CameraState, threadS} from '../lib/camera';
import {clamp, smoothstep} from '../lib/math';
import {columnAt, ColumnState, CountDigit, FADE_FRAMES} from '../components/Odometer';
import {GlassPlinth} from '../components/Glass';
import {Icon3D} from '../components/Icon3D';
import {heartsIcon} from '../components/icons';
import {ThreadFront} from '../layers/Thread';
import {Station} from './Station';

const T = LAYOUT.ticket;
const W = T.w;
const H = T.h;
const X0 = T.x - W / 2;
const Y0 = T.y - H / 2;
const EY = T.eyeletY - Y0; // eyelet, local y
const NOTCH = 30;
const R = 36;
const SC = 9; // perforation bite radius
const GLASS_Y = T.ribbonY + T.glassDy; // centre of the glass plane under the ticket / ribbon

const ticketPath = (() => {
  const c = W / 2;
  let d = `M${R} 0 L${c - NOTCH} 0 A${NOTCH} ${NOTCH} 0 0 0 ${c + NOTCH} 0 L${W - R} 0 A${R} ${R} 0 0 1 ${W} ${R}`;
  const ys: number[] = [];
  for (let y = 64; y <= H - 64; y += 32) ys.push(y);
  for (const y of ys) d += ` L${W} ${y - SC} A${SC} ${SC} 0 0 0 ${W} ${y + SC}`;
  d += ` L${W} ${H - R} A${R} ${R} 0 0 1 ${W - R} ${H} L${c + NOTCH} ${H} A${NOTCH} ${NOTCH} 0 0 0 ${c - NOTCH} ${H} L${R} ${H} A${R} ${R} 0 0 1 0 ${H - R}`;
  for (const y of [...ys].reverse()) d += ` L0 ${y + SC} A${SC} ${SC} 0 0 0 0 ${y - SC}`;
  d += ` L0 ${R} A${R} ${R} 0 0 1 ${R} 0 Z`;
  const er = T.eyeletR;
  d += ` M${c + er} ${EY} A${er} ${er} 0 1 0 ${c - er} ${EY} A${er} ${er} 0 1 0 ${c + er} ${EY} Z`;
  return d;
})();

const Sun: React.FC = () => (
  <svg width={76} height={76} viewBox="0 0 76 76">
    <defs>
      <linearGradient id="tk-sun" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#F6E8C6" />
        <stop offset="1" stopColor="#C6A468" />
      </linearGradient>
    </defs>
    <circle cx="38" cy="38" r="15" fill="url(#tk-sun)" />
    {Array.from({length: 8}, (_, i) => {
      const a = (i * Math.PI) / 4;
      return (
        <line key={i} x1={38 + Math.cos(a) * 23} y1={38 + Math.sin(a) * 23} x2={38 + Math.cos(a) * 33} y2={38 + Math.sin(a) * 33} stroke="url(#tk-sun)" strokeWidth="5" strokeLinecap="round" />
      );
    })}
  </svg>
);

const Moon: React.FC = () => (
  <svg width={76} height={76} viewBox="0 0 76 76">
    <defs>
      <linearGradient id="tk-moon" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#F6E8C6" />
        <stop offset="1" stopColor="#C6A468" />
      </linearGradient>
    </defs>
    <path d="M48 10 A30 30 0 1 0 66 52 A24 24 0 1 1 48 10 Z" fill="url(#tk-moon)" />
    <circle cx="58" cy="20" r="3" fill="#D8BF8C" />
  </svg>
);

const Barcode: React.FC = () => {
  const bars = [3, 1, 2, 1, 4, 1, 1, 3, 2, 1, 1, 2, 3, 1, 2, 4, 1, 1, 2, 1, 3, 2, 1, 1, 4, 2, 1, 3, 1, 2];
  let x = 0;
  return (
    <svg width={200} height={34} viewBox="0 0 200 34">
      {bars.map((w, i) => {
        const r = i % 2 === 0 ? <rect key={i} x={x} y={0} width={w * 1.6} height={34} fill={COLORS.ink} opacity={0.45} /> : null;
        x += w * 1.6 + 1.6;
        return r;
      })}
    </svg>
  );
};

// 0 → 7 / 0 → 6: gentle ease-out (start ≤ 0.45 digit/frame, so every step stays ≥ 2 frames).
// The last digit lands FADE_FRAMES-1 frames early so its soft crossfade completes exactly on
// EVENTS.counters.to.
const COUNT_FROM = EVENTS.counters.from;
const COUNT_END = EVENTS.counters.to - (FADE_FRAMES - 1);
const countEase = (t: number) => {
  const u = clamp(t);
  return COUNTERS.ticketEase.a * u + COUNTERS.ticketEase.b * (1 - (1 - u) * (1 - u));
};
const countAt = (n: number) => (f: number) => n * countEase((f - COUNT_FROM) / (COUNT_END - COUNT_FROM));

const Half: React.FC<{side: 'right' | 'left'; n: number; word: string; col: ColumnState}> = ({side, n, word, col}) => (
  <div
    style={{
      position: 'absolute',
      top: 0,
      left: side === 'right' ? W / 2 : 0,
      width: W / 2,
      height: H,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 30,
    }}
  >
    {side === 'right' ? <Sun /> : <Moon />}
    <div style={{display: 'flex', direction: 'rtl', alignItems: 'center', gap: 18, marginTop: 4}}>
      <CountDigit c={col.c} rate={col.rate} since={col.since} prev={col.prev} size={210} color={COLORS.ink} width={150} />
      <span style={{fontFamily: FONTS.arabic, fontWeight: 600, fontSize: 86, color: COLORS.ink, lineHeight: 1, marginTop: 26}}>{word}</span>
    </div>
    <span style={{display: 'none'}}>{n}</span>
  </div>
);

/** Station 2 — a big boarding ticket; the light thread runs through its eyelet. */
export const TicketStation: React.FC<{frame: number; cam: CameraState}> = ({frame, cam}) => {
  const days = columnAt(countAt(TEXT.duration.days), frame);
  const nights = columnAt(countAt(TEXT.duration.nights), frame);
  const float = Math.sin(frame / 31) * 3.5;
  const beat = Math.pow(Math.max(0, Math.sin(frame / 4.6)), 6);
  const heartsRy = Math.sin(frame / 17) * 22;
  const heartShine = clamp((frame - 104) / 26);
  const sEye = threadS('eyelet');
  const ribbonIn = smoothstep(70, 100, frame);
  return (
    <Station cam={cam} top={Y0 - 80} bottom={T.ribbonY + 230} focus={{x: T.x, y: T.y + 60}}>
      {/* wide glass plane the ticket + ribbon rest on (shows around and below the ribbon) */}
      <GlassPlinth
        id="ticket-glass"
        cx={T.x}
        cy={GLASS_Y + float * 0.3}
        rx={500}
        ry={74}
        thickness={9}
        sheen={0.9}
        shadows={[
          {dx: 90, dy: 46, rx: 640, ry: 86, opacity: 0.08}, // long diffused shadow, light from the upper left
          {dx: 0, dy: 26, rx: 520, ry: 54, opacity: 0.08},
        ]}
      />
      {/* ticket */}
      <div style={{position: 'absolute', left: X0, top: Y0 + float, width: W, height: H}}>
        <svg
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          style={{position: 'absolute', inset: 0, overflow: 'visible', filter: 'drop-shadow(0 34px 44px rgba(28,28,30,0.11)) drop-shadow(0 6px 10px rgba(28,28,30,0.06))'}}
        >
          <defs>
            <linearGradient id="tk-paper" x1="0" y1="0" x2="0.3" y2="1">
              <stop offset="0" stopColor="#FFFFFF" />
              <stop offset="1" stopColor="#F7F4EE" />
            </linearGradient>
            <linearGradient id="tk-ring" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#FBF2DC" />
              <stop offset="0.5" stopColor="#D9BE86" />
              <stop offset="1" stopColor="#A8874E" />
            </linearGradient>
          </defs>
          <path d={ticketPath} fill="url(#tk-paper)" fillRule="evenodd" stroke="#E6E0D5" strokeWidth={2} />
          {/* tear line */}
          {Array.from({length: 26}, (_, i) => 52 + i * 16.8)
            .filter((y) => Math.abs(y - EY) > 44 && y < H - 40)
            .map((y) => (
              <circle key={y} cx={W / 2} cy={y} r={3.4} fill="#D3CCC0" />
            ))}
          {/* grommet */}
          <circle cx={W / 2} cy={EY} r={T.eyeletR + 6} fill="none" stroke="url(#tk-ring)" strokeWidth={12} />
          <circle cx={W / 2} cy={EY} r={T.eyeletR + 0.5} fill="none" stroke="rgba(28,28,30,0.25)" strokeWidth={1.5} />
          <path d={`M${W / 2 - 22} ${EY - 12} A25 25 0 0 1 ${W / 2 + 10} ${EY - 24}`} stroke="#FFFFFF" strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.85} />
        </svg>
        <Half side="right" n={TEXT.duration.days} word={TEXT.duration.daysWord} col={days} />
        <Half side="left" n={TEXT.duration.nights} word={TEXT.duration.nightsWord} col={nights} />
        <div style={{position: 'absolute', left: 130, top: H - 70}}>
          <Barcode />
        </div>
      </div>

      {/* thread coming out of the eyelet, over the paper */}
      <ThreadFront frame={frame} from={sEye} to={sEye + 100} win={{x: T.x - 200, y: T.eyeletY - 260, w: 400, h: 400}} />

      {/* ribbon: private program for two */}
      <div
        style={{
          position: 'absolute',
          left: T.x - 370,
          top: T.ribbonY - 52 + float * 0.6,
          width: 740,
          height: 104,
          transform: `rotate(-1.5deg) scale(${0.96 + 0.04 * ribbonIn})`,
          filter: 'drop-shadow(0 16px 22px rgba(28,28,30,0.10))',
        }}
      >
        <svg width={740} height={104} viewBox="0 0 740 104" style={{position: 'absolute', inset: 0}}>
          <defs>
            <linearGradient id="rb-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#F8F0DD" />
              <stop offset="1" stopColor="#E5D0A0" />
            </linearGradient>
          </defs>
          <path d="M0 0 H740 L708 52 L740 104 H0 L32 52 Z" fill="url(#rb-fill)" />
          <path d="M14 10 H726 M14 94 H726" stroke="#FFFFFF" strokeOpacity={0.7} strokeWidth={2} />
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            right: 170,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            direction: 'rtl',
            fontFamily: FONTS.arabic,
            fontWeight: 500,
            fontSize: 56,
            color: COLORS.ink,
            lineHeight: 1,
            paddingBottom: 6,
          }}
        >
          {TEXT.tripType}
        </div>
        <div style={{position: 'absolute', right: 6, top: -82, transform: `scale(${1 + 0.07 * beat})`}}>
          <Icon3D id="hearts" def={heartsIcon} size={196} ry={heartsRy} rx={-8} depth={22} layers={12} shine={heartShine} />
        </div>
      </div>
    </Station>
  );
};
