import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import copy from '../../../content/alpha-opening.json';
import {C, FONT, IMG, goldText} from '../film/brand';
import {back, clamp, ease, H, lerp, noise1, ramp, rnd, W} from '../film/lib';
import {Ar, At, CanvasLayer, glowSprite, GOLD_RGBA, La, WHITE_RGBA} from '../film/ui';
import {DURATION, LOGO, wordF, wordsF} from './plan';
const T_NAME = LOGO.hit;

/**
 * Scene 10 — the journey converges into ALPHA.
 * Dark cinematic end card: shockwave + anamorphic flare on the hit, light rays and orbit
 * rings behind a floating ivory plaque that carries the official logo (pixels untouched),
 * tagline revealed word-by-word with the voice, CTA, website and contact chips.
 */
export const S10 = {start: LOGO.start, end: DURATION + 1};

const TAG = wordF('شريكك');
const TAG_WORDS = wordsF.slice(TAG.i, TAG.i + 4);
const T_TAG = TAG.start;
const T_CTA = TAG_WORDS[3].end + 0.25;
const T_WEB = T_CTA + 0.45;
const T_CONTACT = T_WEB + 0.4;

const PX = 540, PY = 640; // plaque centre
const PW = 940, PH = 330;
const LOGO_W = 860;
const LOGO_H = Math.round((LOGO_W * 180) / 610);

const Phone = () => (
  <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke={C.goldLight} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2" />
  </svg>
);
const Mail = () => (
  <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke={C.goldLight} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <rect x={3} y={5} width={18} height={14} rx={2} />
    <path d="M3 7l9 6 9-6" />
  </svg>
);
const Globe = () => (
  <svg width={34} height={34} viewBox="0 0 24 24" fill="none" stroke={C.goldLight} strokeWidth={1.6} strokeLinecap="round">
    <circle cx={12} cy={12} r={9} />
    <path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18" />
  </svg>
);

export const ShotLogo: React.FC<{t: number}> = ({t}) => {
  const open = ramp(t, S10.start, T_NAME + 0.35, ease.out);
  const plaque = ramp(t, T_NAME + 0.02, T_NAME + 0.95, (x) => back(x, 1.25));
  const plaqueOp = ramp(t, T_NAME, T_NAME + 0.3);
  const settle = ramp(t, T_NAME + 0.5, S10.end, ease.soft);
  const sweep = ramp(t, T_NAME + 0.75, T_NAME + 1.55, ease.inOut);
  const floatY = Math.sin((t - T_NAME) * 1.1) * 5 * settle;
  const tiltX = Math.sin((t - T_NAME) * 0.8) * 2.2 * settle;
  const tiltY = lerp(-78, 0, plaque) + Math.sin((t - T_NAME) * 0.6 + 1) * 3 * settle;
  const nameP = ramp(t, T_NAME + 0.75, T_NAME + 1.6, ease.out);

  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse 90% 60% at 50% 34%, #141b2b 0%, ${C.navy} 45%, ${C.ink} 100%)`, opacity: open, overflow: 'hidden'}}>
      {/* light rays, orbit rings, shockwave, flare, rising sparks */}
      <CanvasLayer
        draw={(ctx) => {
          const k = t - T_NAME;
          // god rays from behind the plaque
          ctx.globalCompositeOperation = 'lighter';
          const rays = ramp(t, T_NAME, T_NAME + 1.2, ease.out);
          for (let i = 0; i < 16; i++) {
            const a = (i / 16) * Math.PI * 2 + k * 0.05 + rnd(i) * 0.3;
            const len = 900 + rnd(i * 3) * 700;
            const wdt = 0.05 + rnd(i * 7) * 0.08;
            const al = rays * (0.05 + 0.05 * (0.5 + 0.5 * Math.sin(k * 0.9 + i)));
            const g = ctx.createRadialGradient(PX, PY, 0, PX, PY, len);
            g.addColorStop(0, `rgba(240,200,120,${al})`);
            g.addColorStop(1, 'rgba(240,200,120,0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(PX, PY);
            ctx.arc(PX, PY, len, a - wdt, a + wdt);
            ctx.closePath();
            ctx.fill();
          }
          // orbit rings (tilted ellipses) with travelling nodes — the trade routes
          const rings = ramp(t, T_NAME + 0.2, T_NAME + 1.4, ease.out);
          for (let r = 0; r < 3; r++) {
            const rx = 560 + r * 120, ry = 120 + r * 34;
            const rot = -0.18 + r * 0.16;
            ctx.save();
            ctx.translate(PX, PY + 10);
            ctx.rotate(rot);
            ctx.strokeStyle = `rgba(214,170,74,${0.28 * rings})`;
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.ellipse(0, 0, rx * lerp(0.6, 1, rings), ry * lerp(0.6, 1, rings), 0, Math.PI * (1 - rings), Math.PI * (1 + rings) + Math.PI * rings);
            ctx.stroke();
            for (let n = 0; n < 2; n++) {
              const th = k * (0.5 + r * 0.17) * (r % 2 ? -1 : 1) + n * Math.PI + r;
              const x = Math.cos(th) * rx, y = Math.sin(th) * ry;
              const front = Math.sin(th) > 0 ? 1 : 0.45;
              ctx.globalAlpha = rings * front;
              ctx.drawImage(glowSprite(GOLD_RGBA, 0.2), x - 16, y - 16, 32, 32);
              ctx.globalAlpha = 1;
            }
            ctx.restore();
          }
          // shockwave on the hit
          if (k > -0.05 && k < 1.2) {
            const p = clamp(k / 1.2);
            const R = ease.out(p) * 1400;
            ctx.strokeStyle = `rgba(255,226,160,${0.7 * (1 - p)})`;
            ctx.lineWidth = 3 + 30 * (1 - p);
            ctx.beginPath();
            ctx.arc(PX, PY, R, 0, Math.PI * 2);
            ctx.stroke();
            ctx.strokeStyle = `rgba(255,255,255,${0.5 * (1 - p)})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(PX, PY, R * 0.82, 0, Math.PI * 2);
            ctx.stroke();
          }
          // anamorphic flare streak
          if (k > -0.05 && k < 1.4) {
            const p = clamp(k / 1.4);
            const a = Math.pow(1 - p, 1.6);
            const w = 1200 * (0.4 + 0.6 * ease.out(clamp(k / 0.3)));
            const g = ctx.createLinearGradient(PX - w, 0, PX + w, 0);
            g.addColorStop(0, 'rgba(255,210,140,0)');
            g.addColorStop(0.5, `rgba(255,236,200,${0.85 * a})`);
            g.addColorStop(1, 'rgba(255,210,140,0)');
            ctx.fillStyle = g;
            ctx.fillRect(PX - w, PY - 3, w * 2, 6);
            ctx.globalAlpha = 0.6 * a;
            ctx.drawImage(glowSprite(WHITE_RGBA, 0.25), PX - 140, PY - 140, 280, 280);
            ctx.globalAlpha = 1;
          }
          // burst of sparks that settles into slow rising embers
          for (let i = 0; i < 90; i++) {
            const ang = rnd(i * 2.3) * Math.PI * 2;
            const sp = 300 + rnd(i * 4.1) * 900;
            const burst = k > 0 ? 1 - Math.exp(-k * 2.2) : 0;
            const bx = PX + Math.cos(ang) * sp * burst * 0.9;
            const by = PY + Math.sin(ang) * sp * burst * 0.75 - k * (20 + rnd(i) * 40);
            const fade = k > 0 ? clamp(1.4 - k * 0.35) * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(k * 3 + i))) : 0;
            const r = 3 + rnd(i * 9) * 7;
            ctx.globalAlpha = clamp(fade * 0.8);
            ctx.drawImage(glowSprite(GOLD_RGBA, 0.18), bx - r, by - r, r * 2, r * 2);
          }
          for (let i = 0; i < 46; i++) {
            const y = H + 40 - (((k + 3) * (40 + rnd(i * 3) * 60) + rnd(i * 5) * H) % (H + 80));
            const x = rnd(i * 7.3) * W + noise1(k * 0.4 + i, i) * 30;
            ctx.globalAlpha = 0.35 * open * (0.4 + 0.6 * rnd(i * 11));
            const r = 2 + rnd(i) * 5;
            ctx.drawImage(glowSprite(GOLD_RGBA, 0.15), x - r, y - r, r * 2, r * 2);
          }
          ctx.globalAlpha = 1;
          ctx.globalCompositeOperation = 'source-over';
        }}
      />

      {/* floor glow under the plaque */}
      <div style={{position: 'absolute', left: PX - 520, top: PY + PH / 2 + 10, width: 1040, height: 140, background: 'radial-gradient(ellipse 50% 50% at 50% 0%, rgba(226,182,80,0.22) 0%, rgba(0,0,0,0) 70%)', opacity: plaqueOp}} />

      {/* ivory plaque with the official logo */}
      <div style={{position: 'absolute', left: PX - PW / 2, top: PY - PH / 2 + floatY, width: PW, height: PH, perspective: 1400, opacity: plaqueOp}}>
        <div
          style={{
            width: PW,
            height: PH,
            borderRadius: 30,
            position: 'relative',
            overflow: 'hidden',
            transform: `rotateY(${tiltY}deg) rotateX(${tiltX}deg) scale(${lerp(0.82, 1, plaque)})`,
            background: 'linear-gradient(160deg, #FFFEFB 0%, #F7F2E8 55%, #EFE6D4 100%)',
            boxShadow: `0 40px 90px rgba(0,0,0,0.65), 0 0 ${70 * plaqueOp}px rgba(226,182,80,0.35)`,
          }}
        >
          <div style={{position: 'absolute', inset: 10, borderRadius: 22, border: '1.5px solid rgba(201,151,28,0.55)'}} />
          <div style={{position: 'absolute', left: (PW - LOGO_W) / 2, top: (PH - LOGO_H) / 2, width: LOGO_W, height: LOGO_H, mixBlendMode: 'multiply'}}>
            <Img src={staticFile(IMG.logo)} style={{width: LOGO_W, height: LOGO_H}} />
          </div>
          {/* one light sweep across the plaque */}
          {sweep > 0 && sweep < 1 && (
            <div style={{position: 'absolute', top: -60, bottom: -60, width: 180, left: lerp(-260, PW + 80, sweep), transform: 'skewX(-22deg)', background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,250,235,0.55), rgba(255,255,255,0))', mixBlendMode: 'screen'}} />
          )}
        </div>
      </div>

      {/* company name (on screen only — not spoken) */}
      <At y={PY + PH / 2 + 62} style={{opacity: nameP}}>
        <div style={{fontFamily: FONT.la, fontWeight: 700, fontSize: 25, letterSpacing: `${lerp(0.5, 0.17, nameP)}em`, color: C.goldPale, whiteSpace: 'nowrap', filter: nameP < 1 ? `blur(${(1 - nameP) * 6}px)` : undefined}}>{copy.companyName}</div>
      </At>

      {/* tagline, word by word with the voice */}
      <At y={1010}>
        <div dir="rtl" style={{display: 'flex', gap: 22, alignItems: 'baseline'}}>
          {TAG_WORDS.map((w, i) => {
            const p = ramp(t, w.start - 0.06, w.start + 0.4, (x) => back(x, 1.3));
            const gold = i >= 2;
            return (
              <div key={w.i} style={{opacity: clamp(p * 1.4), transform: `translateY(${(1 - p) * 30}px) scale(${0.9 + 0.1 * p})`, filter: p < 1 ? `blur(${(1 - p) * 10}px)` : undefined}}>
                <Ar size={78} weight={800} color={C.white} gold={gold} shimmer={ramp(t, w.start, w.start + 1.6, ease.inOut)} lh={1.3} style={{textShadow: gold ? undefined : '0 6px 30px rgba(0,0,0,0.6)'}}>
                  {w.text.replace(/[.،,]/g, '')}
                </Ar>
              </div>
            );
          })}
        </div>
        <div style={{marginTop: 10, height: 2, width: 560 * ramp(t, TAG_WORDS[3].start, TAG_WORDS[3].start + 0.7), background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)`}} />
      </At>

      {/* CTA */}
      <At y={1170} style={{opacity: ramp(t, T_CTA, T_CTA + 0.45), transform: `translate(-50%,-50%) translateY(${(1 - ramp(t, T_CTA, T_CTA + 0.5, ease.out)) * 18}px)`}}>
        <Ar size={46} weight={700} color="rgba(255,255,255,0.92)">
          {copy.ctaArabic}
        </Ar>
        <La size={17} track={0.44} color={C.goldLight} weight={600} style={{marginTop: 10}}>
          {copy.ctaEnglish}
        </La>
      </At>

      {/* website pill with a light running around its border */}
      {(() => {
        const p = ramp(t, T_WEB, T_WEB + 0.55, (x) => back(x, 1.3));
        const spin = ((t - T_WEB) * 120) % 360;
        return (
          <At y={1318} style={{opacity: clamp(p * 1.5), transform: `translate(-50%,-50%) scale(${0.92 + 0.08 * p})`}}>
            <div style={{padding: 2, borderRadius: 60, background: `conic-gradient(from ${spin}deg, rgba(201,151,28,0.35) 0deg, ${C.goldLight} 40deg, rgba(201,151,28,0.35) 90deg, rgba(201,151,28,0.35) 360deg)`, boxShadow: '0 0 40px rgba(226,182,80,0.25)'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: 18, padding: '20px 50px 22px', borderRadius: 58, background: 'linear-gradient(180deg, #181a1f, #0b0c0f)'}}>
                <Globe />
                <div style={{fontFamily: FONT.la, fontWeight: 600, fontSize: 42, letterSpacing: '0.03em', whiteSpace: 'nowrap', ...goldText(ramp(t, T_WEB + 0.3, T_WEB + 1.8, ease.inOut))}}>{copy.website}</div>
              </div>
            </div>
          </At>
        );
      })()}

      {/* contact chips */}
      <At y={1452}>
        <div style={{display: 'flex', gap: 18}}>
          {copy.contacts.map((c, i) => {
            const p = ramp(t, T_CONTACT + i * 0.14, T_CONTACT + 0.5 + i * 0.14, ease.out);
            return (
              <div key={i} style={{opacity: p, transform: `translateY(${(1 - p) * 16}px)`, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 22px', borderRadius: 18, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(233,207,143,0.28)'}}>
                {i === 0 ? <Phone /> : <Mail />}
                <div style={{display: 'flex', flexDirection: 'column'}}>
                  <div style={{fontFamily: FONT.la, fontSize: 11, letterSpacing: '0.3em', fontWeight: 700, color: C.goldPale, textTransform: 'uppercase'}}>{c.label}</div>
                  <div style={{fontFamily: FONT.la, fontSize: 23, fontWeight: 600, color: C.white, whiteSpace: 'nowrap', marginTop: 2}}>{c.value}</div>
                </div>
              </div>
            );
          })}
        </div>
      </At>

    </AbsoluteFill>
  );
};
