import React from 'react';
import {Img, staticFile} from 'remotion';
import {COLORS, EVENTS, FONTS, IMAGES, LAYOUT, TEXT} from '../data';
import {CameraState} from '../lib/camera';
import {clamp, smoothstep} from '../lib/math';
import {GlassPanel} from '../components/Glass';
import {Station} from './Station';

const B = LAYOUT.booking;
const CTA_X = 540 - B.ctaW / 2;
// one subtle frosted-glass panel behind the four contact rows (station-local px)
const ROWS_H = TEXT.contacts.length * B.rowH + (TEXT.contacts.length - 1) * B.rowGap;
const PANEL = {x: B.panel.x, w: B.panel.w, y: B.rowsTop - B.panel.padY, h: ROWS_H + 2 * B.panel.padY, r: B.panel.r};
// outline of the bar starting at its right cap (where the thread ends), running clockwise
const tracePath = (() => {
  const r = B.ctaH / 2;
  const W = B.ctaW;
  const H = B.ctaH;
  const o = 10;
  return `M${o + W} ${o + r} A${r} ${r} 0 0 1 ${o + W - r} ${o + H} L${o + r} ${o + H} A${r} ${r} 0 0 1 ${o + r} ${o} L${o + W - r} ${o} A${r} ${r} 0 0 1 ${o + W} ${o + r}`;
})();

/** Point at distance d along tracePath (same start / direction). */
const stadiumPoint = (d: number) => {
  const r = B.ctaH / 2;
  const W = B.ctaW;
  const o = 10;
  const L = W - 2 * r;
  const q = (Math.PI * r) / 2;
  const cR = {x: o + W - r, y: o + r};
  const cL = {x: o + r, y: o + r};
  if (d < q) {
    const a = d / r; // 0 → 90°, clockwise from 3 o'clock
    return {x: cR.x + r * Math.cos(a), y: cR.y + r * Math.sin(a)};
  }
  d -= q;
  if (d < L) return {x: o + W - r - d, y: o + 2 * r};
  d -= L;
  if (d < Math.PI * r) {
    const a = Math.PI / 2 + d / r;
    return {x: cL.x + r * Math.cos(a), y: cL.y + r * Math.sin(a)};
  }
  d -= Math.PI * r;
  if (d < L) return {x: o + r + d, y: o};
  d -= L;
  const a = -Math.PI / 2 + d / r;
  return {x: cR.x + r * Math.cos(a), y: cR.y + r * Math.sin(a)};
};

// Clean line icons (graphite on porcelain). Deliberately no brand green.
const ContactIcon: React.FC<{kind: string}> = ({kind}) => {
  const s = {fill: 'none', stroke: COLORS.ink, strokeWidth: 3.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
  return (
    <svg width={44} height={44} viewBox="0 0 44 44">
      {kind === 'whatsapp' && (
        <>
          <path {...s} d="M22 5.5c-9.1 0-16.5 7.2-16.5 16.1 0 3.1.9 6 2.5 8.5L5.8 38.4l8.6-2.3c2.3 1.2 4.9 1.9 7.6 1.9 9.1 0 16.5-7.2 16.5-16.2S31.1 5.5 22 5.5z" />
          <path
            d="M16.4 13.8c.4 0 .8 0 1.1.8l1.6 3.8c.2.4.1.8-.2 1.2l-1.2 1.4c-.2.3-.2.6 0 .9 1.4 2.4 3.3 4.2 5.8 5.4.3.2.7.1.9-.2l1.4-1.6c.3-.4.7-.4 1.1-.3l3.7 1.7c.4.2.7.6.6 1.1-.3 2-2 3.6-4.1 3.7-2.6.1-6.6-1.4-9.9-4.7-3.2-3.2-4.6-6.9-4.4-9.6.1-1.9 1.6-3.6 3.6-3.6z"
            fill={COLORS.ink}
          />
        </>
      )}
      {kind === 'web' && (
        <>
          <circle {...s} cx="22" cy="22" r="16" />
          <ellipse {...s} cx="22" cy="22" rx="7" ry="16" />
          <path {...s} d="M6.5 17h31M6.5 27h31" />
        </>
      )}
      {kind === 'email' && (
        <>
          <rect {...s} x="5.5" y="10" width="33" height="24" rx="5" />
          <path {...s} d="M7.5 13l14.5 11 14.5-11" />
        </>
      )}
      {kind === 'instagram' && (
        <>
          <rect {...s} x="6" y="6" width="32" height="32" rx="10" />
          <circle {...s} cx="22" cy="22" r="7.5" />
          <circle cx="31.5" cy="12.5" r="2.4" fill={COLORS.ink} />
        </>
      )}
    </svg>
  );
};

const Row: React.FC<{c: (typeof TEXT.contacts)[number]; glow: number}> = ({c, glow}) => (
  <div style={{display: 'flex', direction: 'rtl', alignItems: 'center', height: B.rowH, gap: 22}}>
    <div
      style={{
        width: 80,
        height: 80,
        borderRadius: '50%',
        flex: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at 35% 30%, #FFFFFF, #F3F0EA)',
        boxShadow: `0 8px 18px rgba(28,28,30,0.08), 0 0 0 2px rgba(205,178,123,${0.55 + 0.35 * glow}), 0 0 ${18 * glow}px rgba(232,217,181,${0.8 * glow})`,
      }}
    >
      <ContactIcon kind={c.kind} />
    </div>
    {c.label && (
      <span style={{fontFamily: FONTS.arabic, fontWeight: 500, fontSize: 52, color: COLORS.inkSoft, lineHeight: 1}}>{c.label}</span>
    )}
    <span
      style={{
        fontFamily: FONTS.latin,
        fontWeight: 600,
        fontSize: 52,
        color: COLORS.ink,
        lineHeight: 1,
        direction: 'ltr',
        unicodeBidi: 'isolate',
        letterSpacing: -0.5,
      }}
    >
      {c.value}
    </span>
  </div>
);

/** Station 6 — booking: pulsing "احجز الآن" bar, four contact rows, company signature. */
export const BookingStation: React.FC<{frame: number; cam: CameraState}> = ({frame, cam}) => {
  const top = B.top;
  const t = frame - EVENTS.ctaTrace.from;
  const pulse = 0.5 - 0.5 * Math.cos((2 * Math.PI * Math.max(0, t)) / 34);
  const trace = clamp((frame - EVENTS.ctaTrace.from) / (EVENTS.ctaTrace.to - EVENTS.ctaTrace.from));
  const sweep = ((frame - EVENTS.ctaTrace.to) % 46) / 46;
  const per = 2 * (B.ctaW - B.ctaH) + Math.PI * B.ctaH;
  const headPt = stadiumPoint(trace * per);
  const traceOn = smoothstep(EVENTS.ctaTrace.from, EVENTS.ctaTrace.from + 3, frame) * (1 - 0.45 * smoothstep(EVENTS.ctaTrace.to, EVENTS.ctaTrace.to + 20, frame));
  return (
    <Station cam={cam} top={top} bottom={top + 1500} focus={{x: 540, y: top + 900}}>
      <div style={{position: 'absolute', left: 0, top, width: 1080, height: 1500}}>
        {/* CTA bar */}
        <div
          style={{
            position: 'absolute',
            left: CTA_X,
            top: B.ctaY - B.ctaH / 2,
            width: B.ctaW,
            height: B.ctaH,
            transform: `scale(${1 + 0.02 * pulse})`,
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: B.ctaH / 2,
              background: 'linear-gradient(180deg, #F7EDD6 0%, #EAD5A5 55%, #DEC38A 100%)',
              boxShadow: `0 22px 44px rgba(184,151,90,${0.28 + 0.12 * pulse}), 0 0 ${26 + 34 * pulse}px rgba(232,217,181,${0.55 + 0.35 * pulse}), inset 0 3px 0 rgba(255,255,255,0.75), inset 0 -4px 10px rgba(150,120,70,0.18)`,
              overflow: 'hidden',
            }}
          >
            {frame > EVENTS.ctaTrace.to && (
              <div
                style={{
                  position: 'absolute',
                  top: -40,
                  left: -260 + sweep * (B.ctaW + 520),
                  width: 160,
                  height: B.ctaH + 80,
                  transform: 'rotate(20deg)',
                  background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.55), rgba(255,255,255,0))',
                }}
              />
            )}
          </div>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              direction: 'rtl',
              fontFamily: FONTS.arabic,
              fontWeight: 700,
              fontSize: 86,
              color: COLORS.ink,
              lineHeight: 1,
              paddingBottom: 8,
            }}
          >
            {TEXT.cta}
          </div>
          {/* the thread's light traces the bar, starting from its right cap where the thread ends */}
          <svg width={B.ctaW + 20} height={B.ctaH + 20} style={{position: 'absolute', left: -10, top: -10, overflow: 'visible'}}>
            <path d={tracePath} fill="none" stroke={COLORS.champagne} strokeWidth={10} strokeLinecap="round" strokeOpacity={0.55 * traceOn} strokeDasharray={`${(trace * per).toFixed(1)} ${per + 10}`} />
            <path d={tracePath} fill="none" stroke="#FFF8E8" strokeWidth={3} strokeLinecap="round" strokeOpacity={traceOn} strokeDasharray={`${(trace * per).toFixed(1)} ${per + 10}`} />
            {trace > 0 && trace < 1 && (
              <>
                <circle cx={headPt.x} cy={headPt.y} r={30} fill="url(#cta-head)" />
                <circle cx={headPt.x} cy={headPt.y} r={6} fill="#FFFFFF" />
              </>
            )}
            <defs>
              <radialGradient id="cta-head">
                <stop offset="0" stopColor="#FFFFFF" stopOpacity={1} />
                <stop offset="0.35" stopColor={COLORS.champagne} stopOpacity={0.8} />
                <stop offset="1" stopColor={COLORS.champagne} stopOpacity={0} />
              </radialGradient>
            </defs>
          </svg>
        </div>

        {/* frosted glass behind the contact rows (brightens the backdrop → higher text contrast) */}
        <GlassPanel id="booking-glass" x={PANEL.x} y={PANEL.y} w={PANEL.w} h={PANEL.h} r={PANEL.r} opacity={smoothstep(470, 494, frame)} />

        {/* contact rows */}
        <div style={{position: 'absolute', top: B.rowsTop, left: 0, width: 1080, display: 'flex', justifyContent: 'center'}}>
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: B.rowGap}}>
            {TEXT.contacts.map((c, i) => (
              <Row key={c.kind} c={c} glow={smoothstep(486 + i * 4, 498 + i * 4, frame) * (1 - 0.6 * smoothstep(510, 530, frame))} />
            ))}
          </div>
        </div>

        {/* company signature */}
        <div
          style={{
            position: 'absolute',
            top: B.companyY - 75,
            left: 0,
            width: 1080,
            height: 150,
            display: 'flex',
            direction: 'rtl',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 26,
          }}
        >
          <Img src={staticFile(IMAGES.logo.file)} style={{height: 132, width: (132 * IMAGES.logo.w) / IMAGES.logo.h}} />
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10}}>
            <span style={{fontFamily: FONTS.arabic, fontWeight: 700, fontSize: 60, color: COLORS.ink, lineHeight: 1.1}}>{TEXT.companyAr}</span>
            <span style={{fontFamily: FONTS.latin, fontWeight: 600, fontSize: 52, color: COLORS.inkSoft, lineHeight: 1.05, direction: 'ltr', letterSpacing: -0.5}}>
              {TEXT.companyEn}
            </span>
          </div>
        </div>
      </div>
    </Station>
  );
};
