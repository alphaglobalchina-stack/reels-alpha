import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import copy from '../../../../content/alpha-opening.json';
import land from '../../../../content/land-dots.json';
import {C, FONT, IMG} from '../brand';
import {clamp, ease, H, ramp, W} from '../lib';
import {Ar, At, CanvasLayer, La, Reveal} from '../ui';
import {at, DURATION} from '../timing';
import {S9, T_NAME} from './S9Partner';

/** Scene 10 — the journey converges into ALPHA: ivory end card, official logo (unaltered), CTA hold. */
const T_TAG = at('شريكك');
export const S10 = {start: S9.end - 0.18, end: DURATION + 1};

const T_CTA = T_TAG + 1.25;
const T_WEB = T_CTA + 0.5;
const T_CONTACT = T_WEB + 0.4;
const LOGO_W = 930;
const LOGO_H = Math.round((LOGO_W * 180) / 610); // crop is 610×180

const MAP = land as [number, number][];

export const Scene10: React.FC<{t: number}> = ({t}) => {
  const open = ramp(t, S10.start, S10.start + 0.75, ease.out);
  const logo = ramp(t, T_NAME - 0.02, T_NAME + 0.95, ease.inOut);
  const drift = ramp(t, T_NAME, S10.end, ease.soft);
  const r = open * 1300;
  return (
    <AbsoluteFill style={{clipPath: open < 1 ? `circle(${r}px at 540px 860px)` : undefined}}>
      <AbsoluteFill style={{transform: `scale(${1.0 + 0.018 * drift})`, background: `radial-gradient(ellipse 85% 60% at 50% 42%, #FFFDF8 0%, ${C.ivory} 45%, ${C.ivory2} 100%)`}}>
      {/* the world the film travelled, as a quiet texture */}
      <CanvasLayer
        style={{opacity: 0.55}}
        draw={(ctx) => {
          const sx = W / 230, sy = sx;
          const ox = -30 * sx - drift * 40, oy = 1080;
          ctx.fillStyle = 'rgba(124,91,14,0.16)';
          for (const [lon, lat] of MAP) {
            if (lat < -40) continue;
            const x = (lon + 140) * sx + ox;
            const y = oy - lat * sy;
            ctx.fillRect(x - 1.4, y - 1.4, 2.8, 2.8);
          }
          // one gold line — the route — passing under the brand
          const p = ramp(t, T_NAME + 0.3, T_NAME + 2.0, ease.inOut);
          ctx.strokeStyle = 'rgba(201,151,28,0.32)';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          const x0 = (113.3 + 140) * sx + ox, y0 = oy - 23 * sy;
          const x1 = (55 + 140) * sx + ox, y1 = oy - 25 * sy;
          const n = 60;
          for (let i = 0; i <= n * p; i++) {
            const u = i / n;
            const x = x0 + (x1 - x0) * u;
            const y = y0 + (y1 - y0) * u + 640 - Math.sin(u * Math.PI) * 70;
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
          }
          ctx.stroke();
        }}
      />
        {/* official logo — pixels untouched, revealed by a soft wipe */}
        <div
          style={{
            position: 'absolute',
            left: (W - LOGO_W) / 2,
            top: 640 - LOGO_H / 2,
            width: LOGO_W,
            height: LOGO_H,
            opacity: clamp(logo * 2),
            WebkitMaskImage: `linear-gradient(90deg, #000 ${logo * 120 - 20}%, transparent ${logo * 120}%)`,
            maskImage: `linear-gradient(90deg, #000 ${logo * 120 - 20}%, transparent ${logo * 120}%)`,
            transform: `scale(${1.04 - 0.04 * logo})`,
            mixBlendMode: 'multiply',
          }}
        >
          <Img src={staticFile(IMG.logo)} style={{width: LOGO_W, height: LOGO_H}} />
        </div>
        <At y={862}>
          <div style={{width: 520 * ramp(t, T_NAME + 0.7, T_NAME + 1.5), height: 1.5, background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)`}} />
        </At>
        <At y={912}>
          <Reveal t={t} at={T_NAME + 0.55} dur={0.6} rise={12} blur={8}>
            <div style={{fontFamily: FONT.la, fontWeight: 700, fontSize: 27, letterSpacing: '0.16em', color: '#1b1d22', whiteSpace: 'nowrap'}}>{copy.companyName}</div>
          </Reveal>
        </At>
        <At y={1050}>
          <Reveal t={t} at={T_TAG - 0.04} dur={0.55} blur={10}>
            <Ar size={78} weight={800} color="#15171b" lh={1.3}>
              شريكك التجاري <span style={{color: C.goldDark}}>من الصين</span>
            </Ar>
          </Reveal>
        </At>
        <At y={1192}>
          <Reveal t={t} at={T_CTA} dur={0.55} rise={14}>
            <Ar size={44} weight={700} color="#3b3e45">
              {copy.ctaArabic}
            </Ar>
            <La size={17} track={0.42} color={C.goldDark} weight={700} style={{marginTop: 14}}>
              {copy.ctaEnglish}
            </La>
          </Reveal>
        </At>
        <At y={1352}>
          <Reveal t={t} at={T_WEB} dur={0.55} rise={14} from={0.96}>
            <div style={{padding: '22px 54px 24px', borderRadius: 60, background: 'linear-gradient(180deg, #17191d, #0c0d10)', boxShadow: '0 18px 40px rgba(40,30,10,0.22)', border: `1.5px solid ${C.gold}`}}>
              <div style={{fontFamily: FONT.la, fontWeight: 600, fontSize: 42, letterSpacing: '0.04em', color: C.goldLight, whiteSpace: 'nowrap'}}>{copy.website}</div>
            </div>
          </Reveal>
        </At>
        <At y={1478}>
          <Reveal t={t} at={T_CONTACT} dur={0.55} rise={10}>
            <div style={{display: 'flex', gap: 34, alignItems: 'center'}}>
              {copy.contacts.map((c, k) => (
                <React.Fragment key={k}>
                  {k > 0 && <div style={{width: 5, height: 5, borderRadius: 3, background: C.gold}} />}
                  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                    <div style={{fontFamily: FONT.la, fontSize: 13, letterSpacing: '0.3em', fontWeight: 700, color: C.goldDark, textTransform: 'uppercase'}}>{c.label}</div>
                    <div style={{fontFamily: FONT.la, fontSize: 25, fontWeight: 600, color: '#2a2c31', marginTop: 4, whiteSpace: 'nowrap'}}>{c.value}</div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </Reveal>
        </At>
      </AbsoluteFill>
      {/* soft edge vignette on ivory */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 70% at 50% 45%, rgba(0,0,0,0) 60%, rgba(70,52,20,0.14) 100%)'}} />
      {open < 1 && (
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          <circle cx={540} cy={860} r={r} fill="none" stroke={C.goldLight} strokeWidth={3} opacity={1 - open} />
        </svg>
      )}
    </AbsoluteFill>
  );
};
