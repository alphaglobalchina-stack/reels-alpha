import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import vo from '../../../../content/reel2-vo.json';
import {LineIcon} from '../../components/LineIcon';
import {LogoMark, Wordmark} from '../../components/Logo';
import {rand} from '../../lib/anim';
import {lerp, tw} from '../../lib/gs';
import {ANTON, Big, C, Center, Label, Letters, Mask, MONT, Photo, Shade, at, exit, fadeUp, rise, slam} from './fx';
import {BoothField, GoldGlobe, GoldTitle, Gold140, IconFlip, Stage} from './objects3d';

type S = {f: number};
const pitch = (vo as unknown as {cta: {whatsapp: string; footer: string; line: string}}).cta;

/** Wrapper that only mounts its children inside [from, to). */
export const Range: React.FC<{f: number; from: number; to: number; children: React.ReactNode}> = ({f, from, to, children}) =>
  f >= from && f < to ? <>{children}</> : null;

// ════════════════════════════════════════════════════════════════════════════════════
// S1 — HOOK: "The world's biggest trade event is just days away."
// ════════════════════════════════════════════════════════════════════════════════════
export const S1: React.FC<S> = ({f}) => {
  const push = tw(f, 92, 20, 'expo.in');
  const away = at('away');
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{transform: `scale(${1 + push * 2.2})`, transformOrigin: '74% 30%', filter: push > 0.05 ? `blur(${push * 10}px)` : undefined}}>
        <Photo src="canton/tower-night.webp" f={f} from={0} dur={110} zoom={[1.32, 1.08]} pan={[30, 40, 0, 0]} grade={0.78} />
        <Shade top={0.55} bottom={0.75} all={0.3} />
      </AbsoluteFill>
      <AbsoluteFill style={exit(f, 94, 14, 1.7)}>
        <Center top={330}>
          <div style={slam(f, -3, 1.18, 10)}>
            <Big size={124}>THE WORLD'S</Big>
          </div>
        </Center>
        <Center top={448}>
          <div style={slam(f, at('biggest') - 2, 1.9, 13)}>
            <Big size={318} gold>BIGGEST</Big>
          </div>
        </Center>
        <Center top={770} style={{flexDirection: 'row', justifyContent: 'center', gap: 34}}>
          <Mask>
            <div style={rise(f, at('trade') - 2)}>
              <Big size={168}>TRADE</Big>
            </div>
          </Mask>
          <Mask>
            <div style={rise(f, at('event') - 2)}>
              <Big size={168}>EVENT</Big>
            </div>
          </Mask>
        </Center>
        <Center top={962}>
          <div style={fadeUp(f, at('is') - 2)}>
            <Label size={44} spacing={16} color={C.cream}>is just</Label>
          </div>
        </Center>
        <Center top={1030}>
          <div style={{position: 'relative', padding: '10px 40px 4px'}}>
            <div style={{position: 'absolute', inset: 0, background: C.red, transformOrigin: '0 50%', transform: `scaleX(${tw(f, at('days') - 3, 10, 'expo.out')}) skewX(-8deg)`, boxShadow: `0 0 50px ${C.red}99`}} />
            <div style={{position: 'relative', display: 'flex', gap: 26}}>
              <div style={slam(f, at('days'), 1.5, 10)}>
                <Big size={150}>DAYS</Big>
              </div>
              <div style={slam(f, away, 1.5, 10)}>
                <Big size={150}>AWAY</Big>
              </div>
            </div>
          </div>
        </Center>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ════════════════════════════════════════════════════════════════════════════════════
// S2 — "The 140th Canton Fair kicks off this October 15th in Guangzhou, China"
// gold 3D 140 → calendar page flips down → turns over to Guangzhou → grows full screen
// ════════════════════════════════════════════════════════════════════════════════════
const CARD = {x: 250, y: 300, w: 580, h: 600};
export const S2: React.FC<S> = ({f}) => {
  const oct = at('october');
  const gz = at('guangzhou');
  const drop = tw(f, oct - 2, 18, 'back.out(1.4)');
  const turn = tw(f, gz - 6, 16, 'power3.inOut');
  const grow = tw(f, at('china') + 2, 18, 'expo.inOut');
  const r = {
    x: lerp(CARD.x, 0, grow),
    y: lerp(CARD.y, 0, grow),
    w: lerp(CARD.w, 1080, grow),
    h: lerp(CARD.h, 1920, grow),
  };
  const textOut = tw(f, at('china'), 10, 'power3.in');
  const bgIn = tw(f, 96, 20, 'power2.out');
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{opacity: bgIn}}>
        <Photo src="canton/aerial-sunset.webp" f={f} from={96} dur={170} zoom={[1.25, 1.1]} grade={0.32} imgStyle={{filter: 'brightness(0.32) blur(14px) saturate(1.2)'}} />
        <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 35%, rgba(201,151,28,0.18), transparent 60%)'}} />
      </AbsoluteFill>
      {f < oct + 14 && <Stage><Gold140 f={f} /></Stage>}
      {/* calendar page → Guangzhou card (shared element into S3) */}
      {f >= oct - 3 && (
        <div style={{position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, perspective: 1800}}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              transformStyle: 'preserve-3d',
              transformOrigin: '50% 0%',
              transform: `rotateX(${(1 - drop) * -100}deg) rotateY(${turn * 180}deg)`,
            }}
          >
            {/* front: calendar page */}
            <div style={{position: 'absolute', inset: 0, backfaceVisibility: 'hidden', borderRadius: 34, overflow: 'hidden', background: '#FFF9EE', boxShadow: '0 40px 120px rgba(0,0,0,0.6)'}}>
              <div style={{height: 150, background: `linear-gradient(180deg, ${C.red}, #B8261A)`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <Big size={92} spacing={6}>OCTOBER</Big>
              </div>
              <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 10}}>
                <div style={{transform: `scale(${1 + 0.12 * Math.max(0, 1 - Math.abs(f - at('fifteenth') - 3) / 6)})`}}>
                  <Big size={330} color={C.ink}>15</Big>
                </div>
                <Label size={30} color="#8F6A10" spacing={10}>2026 · Opening day</Label>
              </div>
              {[0, 1].map((i) => (
                <div key={i} style={{position: 'absolute', top: 18, left: i ? 'auto' : 110, right: i ? 110 : 'auto', width: 26, height: 60, borderRadius: 13, background: '#2A1A10', boxShadow: 'inset 0 4px 6px rgba(0,0,0,0.5)'}} />
              ))}
            </div>
            {/* back: Guangzhou */}
            <div style={{position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', borderRadius: 34 * (1 - grow), overflow: 'hidden'}}>
              <Img src={staticFile('canton/aerial-sunset.webp')} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.82) contrast(1.08) saturate(1.12)', transform: 'scale(1.12)'}} />
              <AbsoluteFill style={{background: 'linear-gradient(to bottom, rgba(5,5,8,0.55), transparent 45%)', opacity: 1 - grow}} />
              <div style={{position: 'absolute', left: 0, right: 0, top: 36, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 1 - grow}}>
                <LineIcon name="pin" size={64} progress={tw(f, gz, 14, 'power2.out')} strokeWidth={2.2} />
                <Big size={84}>GUANGZHOU</Big>
                <Label size={28} spacing={14} color={C.cream}>China</Label>
              </div>
            </div>
          </div>
        </div>
      )}
      <AbsoluteFill style={{opacity: 1 - textOut, transform: `translateY(${textOut * 60}px)`}}>
        <Center top={960}>
          <Letters text="CANTON FAIR" f={f} start={at('canton') - 3} stagger={1.3} size={150} spacing={4} />
          <div style={{height: 4, marginTop: 10, width: 640 * tw(f, at('fair'), 16, 'expo.out'), background: 'linear-gradient(90deg, transparent, #F2D27A, transparent)'}} />
        </Center>
        <Center top={1200}>
          <div style={{transform: `scale(${tw(f, at('kicks') - 2, 12, 'back.out(2)')})`, padding: '10px 34px 6px', borderRadius: 999, background: C.red, boxShadow: `0 0 40px ${C.red}88`}}>
            <Big size={58} spacing={4}>KICKS OFF</Big>
          </div>
        </Center>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ════════════════════════════════════════════════════════════════════════════════════
// S3 — "and runs through November 4th, 2026."  (timeline over the aerial)
// ════════════════════════════════════════════════════════════════════════════════════
export const S3: React.FC<S> = ({f}) => {
  const runs = at('runs');
  const nov = at('november');
  const yr = at('twenty');
  const whip = tw(f, 346, 14, 'power3.in');
  const line = tw(f, runs, 30, 'power2.inOut');
  const dotX = 120 + 840 * line;
  return (
    <AbsoluteFill style={{transform: `translateY(${-whip * 1500}px)`, filter: whip > 0.02 ? `blur(${whip * 24}px)` : undefined}}>
      <Photo src="canton/aerial-sunset.webp" f={f} from={262} dur={100} zoom={[1.12, 1.24]} pan={[0, 0, 0, -60]} />
      <Shade top={0.7} bottom={0.75} all={0.35} />
      <Center top={320}>
        <Mask>
          <div style={rise(f, runs - 2)}>
            <Label size={46} spacing={18} color={C.cream}>Runs through</Label>
          </div>
        </Mask>
      </Center>
      {/* timeline */}
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <line x1={120} y1={720} x2={960} y2={720} stroke="rgba(255,255,255,0.18)" strokeWidth={4} />
        <line x1={120} y1={720} x2={dotX} y2={720} stroke="#F2D27A" strokeWidth={6} style={{filter: 'drop-shadow(0 0 10px #F2D27A)'}} />
        {[0, 1, 2].map((i) => {
          const x = 120 + 840 * ([0, 0.38, 0.76][i] + 0.12);
          const p = tw(f, runs + 8 + i * 4, 12, 'back.out(2)');
          return (
            <g key={i} opacity={p}>
              <line x1={x} y1={700} x2={x} y2={740} stroke="#F2D27A" strokeWidth={3} />
              <text x={x} y={790} textAnchor="middle" fill="#FFF4DC" fontFamily={MONT} fontWeight={800} fontSize={24} letterSpacing={4}>
                {`PHASE ${i + 1}`}
              </text>
            </g>
          );
        })}
        <circle cx={120} cy={720} r={16} fill="#F2D27A" />
        <circle cx={dotX} cy={720} r={12 + 4 * Math.sin(f / 3)} fill="#FFF4DC" style={{filter: 'drop-shadow(0 0 16px #FFD978)'}} />
        <circle cx={960} cy={720} r={22 * tw(f, nov - 2, 12, 'back.out(3)')} fill={C.red} style={{filter: `drop-shadow(0 0 18px ${C.red})`}} />
      </svg>
      <div style={{position: 'absolute', left: 70, top: 560, ...fadeUp(f, runs + 2)}}>
        <Big size={88}>OCT 15</Big>
      </div>
      <div style={{position: 'absolute', right: 60, top: 520, textAlign: 'right', ...slam(f, nov, 1.6, 12)}}>
        <Big size={128} gold>NOV 4</Big>
      </div>
      {/* 2026: outline, then gold fills on "six" */}
      <Center top={900}>
        <div style={{position: 'relative', transform: `scale(${0.85 + 0.15 * tw(f, yr - 2, 18, 'expo.out')})`, opacity: tw(f, yr - 2, 6, 'none')}}>
          <Big size={400} stroke="#F2D27A">2026</Big>
          <div style={{position: 'absolute', inset: 0, clipPath: `inset(${(1 - tw(f, at('six') - 6, 16, 'power2.inOut')) * 100}% 0 0 0)`}}>
            <Big size={400} gold>2026</Big>
          </div>
        </div>
      </Center>
    </AbsoluteFill>
  );
};

// ════════════════════════════════════════════════════════════════════════════════════
// S4 — "60,000 booths. Thousands of exhibitors. Every industry under one roof."
// ════════════════════════════════════════════════════════════════════════════════════
const CARDS4 = [
  {src: 'canton/hall-92.webp', x: 60, y: 300, w: 470, r: -7, dx: -900},
  {src: 'canton/buyers-pumps.webp', x: 560, y: 380, w: 470, r: 6, dx: 900},
  {src: 'canton/buyers-bags.webp', x: 300, y: 690, w: 480, r: -2, dx: 0},
];
export const S4: React.FC<S> = ({f}) => {
  const s0 = at('sixty');
  const th = at('thousands');
  const ev = at('every');
  const un = at('under');
  const roof = at('roof');
  const inP = tw(f, 348, 16, 'expo.out');
  const count = Math.round(60000 * tw(f, s0 - 2, 34, 'power3.out'));
  const cOut = tw(f, th - 6, 10, 'power3.in');
  const cardsOut = tw(f, ev - 11, 8, 'power3.in');
  const maskGrow = tw(f, roof + 4, 22, 'expo.in');
  const fieldOut = tw(f, un - 4, 16, 'power2.in');
  return (
    <AbsoluteFill style={{transform: `translateY(${(1 - inP) * 1300}px)`, filter: inP < 0.98 ? `blur(${(1 - inP) * 24}px)` : undefined}}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 30%, #1a140a, #060508 70%)'}} />
      <AbsoluteFill style={{opacity: 1 - fieldOut}}>
        <Stage fov={42}>
          <BoothField f={f} />
        </Stage>
      </AbsoluteFill>
      {/* counter */}
      <AbsoluteFill style={{opacity: 1 - cOut, transform: `translateY(${-cOut * 120}px)`}}>
        <Center top={300}>
          <div style={slam(f, s0 - 2, 1.4, 12)}>
            <Big size={230} gold>{count.toLocaleString('en-US')}</Big>
          </div>
          <Mask>
            <div style={rise(f, at('booths') - 2)}>
              <Big size={120} spacing={10}>BOOTHS</Big>
            </div>
          </Mask>
        </Center>
      </AbsoluteFill>
      {/* exhibitors: photo cards fly in through depth */}
      {f >= th - 6 && f < ev + 10 && (
        <AbsoluteFill style={{perspective: 1400}}>
          {CARDS4.map((c, i) => {
            const p = tw(f, th - 4 + i * 6, 18, 'expo.out');
            const o = tw(f, ev - 12 + i * 2, 10, 'power3.in');
            const fl = Math.sin((f + i * 20) / 18) * 8;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: c.x,
                  top: c.y + fl,
                  width: c.w,
                  height: c.w * 0.78,
                  borderRadius: 26,
                  overflow: 'hidden',
                  border: '2px solid rgba(242,210,122,0.6)',
                  boxShadow: '0 40px 90px rgba(0,0,0,0.7)',
                  opacity: Math.min(1, p * 2) * (1 - o),
                  transform: `translate3d(${c.dx * o}px, ${-o * 300}px, ${(1 - p) * -1600}px) rotateY(${(1 - p) * (i % 2 ? -50 : 50)}deg) rotateZ(${c.r}deg)`,
                }}
              >
                <Img src={staticFile(c.src)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.15 - 0.1 * p})`}} />
              </div>
            );
          })}
          <Center top={1150} style={{opacity: 1 - cardsOut}}>
            <div style={slam(f, th, 1.5, 12)}>
              <Big size={170} gold>THOUSANDS</Big>
            </div>
            <Mask>
              <div style={rise(f, at('exhibitors') - 2)}>
                <Big size={96} spacing={6}>OF EXHIBITORS</Big>
              </div>
            </Mask>
          </Center>
        </AbsoluteFill>
      )}
      {/* every industry */}
      {f >= ev - 4 && (
        <Center top={390} style={{...exit(f, un - 6, 10, 1.4)}}>
          <Letters text="EVERY" f={f} start={ev - 3} size={190} />
          <Letters text="INDUSTRY" f={f} start={at('industry') - 3} size={190} gold />
        </Center>
      )}
      {/* UNDER ONE ROOF — the words are a window onto the roofs, then open up */}
      {f >= un - 4 && (
        <AbsoluteFill>
          <AbsoluteFill style={{opacity: tw(f, roof + 10, 14, 'power2.in')}}>
            <Photo src="canton/aerial-day.webp" f={f} from={un} dur={60} zoom={[1.3, 1.1]} grade={0.9} />
          </AbsoluteFill>
          <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', transform: `scale(${1 + maskGrow * 18})`, transformOrigin: '50% 47%', opacity: 1 - tw(f, roof + 20, 6, 'none')}}>
            {[
              ['UNDER', un - 3],
              ['ONE ROOF', at('one', 1) - 3],
            ].map(([w, s], i) => (
              <div key={i} style={{...slam(f, s as number, 1.3, 10), textShadow: undefined}}>
                <div
                  style={{
                    fontFamily: ANTON,
                    fontSize: 230,
                    lineHeight: 0.95,
                    backgroundImage: `url(${staticFile('canton/aerial-day.webp')})`,
                    backgroundSize: '1080px 1080px',
                    backgroundPosition: `center ${i ? -260 : -40}px`,
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    color: 'transparent',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.4)) brightness(1.25)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {w}
                </div>
              </div>
            ))}
          </AbsoluteFill>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

// ════════════════════════════════════════════════════════════════════════════════════
// S5 — Electronics · Furniture · Machinery · Innovation · Opportunity (3D coin flips)
// ════════════════════════════════════════════════════════════════════════════════════
const IND = ['ELECTRONICS', 'FURNITURE', 'MACHINERY', 'INNOVATION', 'OPPORTUNITY'];
export const S5: React.FC<S> = ({f}) => {
  const times = ['electronics', 'furniture', 'machinery', 'innovation', 'opportunity'].map((w) => at(w));
  const bgIn = tw(f, 536, 14, 'power2.out');
  let k = 0;
  times.forEach((t, i) => {
    if (f >= t - 3) k = i;
  });
  const out = tw(f, times[4] + 26, 12, 'power3.in');
  return (
    <AbsoluteFill style={{opacity: bgIn}}>
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 38%, #2a1a08 0%, #0b0806 55%, #050407 100%)`}} />
      {/* perspective floor grid */}
      <AbsoluteFill style={{perspective: 900, perspectiveOrigin: '50% 40%'}}>
        <div
          style={{
            position: 'absolute',
            left: -1200,
            right: -1200,
            top: 1050,
            height: 2400,
            transform: 'rotateX(78deg)',
            transformOrigin: '50% 0%',
            backgroundImage: 'linear-gradient(rgba(242,210,122,0.22) 2px, transparent 2px), linear-gradient(90deg, rgba(242,210,122,0.22) 2px, transparent 2px)',
            backgroundSize: '120px 120px',
            backgroundPosition: `0 ${(f * 14) % 120}px`,
            maskImage: 'linear-gradient(to bottom, transparent, black 30%, black 60%, transparent)',
          }}
        />
      </AbsoluteFill>
      {/* giant ghost word */}
      <div style={{position: 'absolute', top: 360, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: 0.1, transform: `translateX(${Math.sin(f / 40) * 80 - 100}px)`}}>
        <Big size={420} stroke="#F2D27A">{IND[k]}</Big>
      </div>
      <Stage>
        <IconFlip f={f} times={times} />
      </Stage>
      <AbsoluteFill style={{opacity: 1 - out}}>
        <Center top={1112}>
          <Label size={30} spacing={12} color={C.goldLight}>{`0${k + 1} / 05 · every industry`}</Label>
        </Center>
        {IND.map((w, i) => {
          const s = times[i] - 3;
          const e = i < 4 ? times[i + 1] - 3 : 99999;
          if (f < s - 1 || f > e + 8) return null;
          const p = tw(f, s, 10, 'expo.out');
          const o = tw(f, e, 8, 'expo.in');
          const dir = i % 2 ? -1 : 1;
          return (
            <Center key={w} top={1170}>
              <div style={{transform: `translateX(${(1 - p) * 500 * dir - o * 500 * dir}px) skewX(${(1 - p - o) * -14 * dir}deg)`, opacity: Math.min(1, p * 2) * (1 - o), filter: p + o < 0.98 || o > 0 ? `blur(${(1 - p + o) * 10}px)` : undefined}}>
                <Big size={i === 4 ? 150 : 160} gold={i === 4}>{w}</Big>
              </div>
            </Center>
          );
        })}
        {/* progress pips */}
        <div style={{position: 'absolute', top: 1375, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 14}}>
          {IND.map((_, i) => (
            <div key={i} style={{width: i === k ? 60 : 16, height: 8, borderRadius: 4, background: i <= k ? '#F2D27A' : 'rgba(255,255,255,0.2)'}} />
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ════════════════════════════════════════════════════════════════════════════════════
// S6 — "For over sixty years, the Canton Fair has turned ambitious traders into global players."
// ════════════════════════════════════════════════════════════════════════════════════
export const S6: React.FC<S> = ({f}) => {
  const sx = at('sixty', 1);
  const amb = at('ambitious');
  const glob = at('global');
  const inP = tw(f, 690, 8, 'power2.out');
  const yrs = Math.round(60 * tw(f, sx - 4, 24, 'power3.out'));
  const g1Out = tw(f, at('the', 2) - 2, 12, 'power3.in');
  const darken = tw(f, glob - 16, 20, 'power2.inOut');
  return (
    <AbsoluteFill style={{opacity: inP}}>
      <AbsoluteFill style={{opacity: 1 - darken * 0.92}}>
        <Photo src="canton/hall-banner.webp" f={f} from={686} dur={140} zoom={[1.3, 1.05]} pan={[0, 80, 0, -20]} grade={0.72} />
        <Shade top={0.75} bottom={0.75} all={0.35} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 70%, #1d1406, #050407 70%)', opacity: darken}} />
      {/* 60+ years */}
      <AbsoluteFill style={{opacity: 1 - g1Out, transform: `translateY(${-g1Out * 160}px) scale(${1 - g1Out * 0.2})`}}>
        <Center top={340}>
          <div style={fadeUp(f, at('for') - 2)}>
            <Label size={44} spacing={18} color={C.cream}>For over</Label>
          </div>
        </Center>
        <Center top={400}>
          <div style={slam(f, sx - 3, 1.5, 12)}>
            <Big size={420} gold>{`${yrs}+`}</Big>
          </div>
        </Center>
        <Center top={810}>
          <Mask>
            <div style={rise(f, at('years') - 2)}>
              <Big size={150} spacing={8}>YEARS</Big>
            </div>
          </Mask>
          <div style={{marginTop: 18, padding: '8px 26px', borderRadius: 999, border: '2px solid #F2D27A', ...fadeUp(f, at('years') + 6)}}>
            <Label size={28} spacing={10}>Since 1957</Label>
          </div>
        </Center>
      </AbsoluteFill>
      {/* ambitious traders */}
      {f >= at('the', 2) - 4 && (
        <AbsoluteFill style={exit(f, glob - 12, 12, 1.3)}>
          <Center top={380}>
            <div style={fadeUp(f, at('the', 2))}>
              <Label size={34} spacing={10} color={C.cream}>The Canton Fair has turned</Label>
            </div>
          </Center>
          <Center top={470}>
            <Letters text="AMBITIOUS" f={f} start={amb - 3} size={170} stagger={1.2} />
            <Letters text="TRADERS" f={f} start={at('traders') - 3} size={170} stagger={1.2} gold />
          </Center>
        </AbsoluteFill>
      )}
      {/* into global players */}
      {f >= glob - 14 && (
        <>
          <Stage>
            <GoldGlobe f={f} start={glob - 12} />
          </Stage>
          <AbsoluteFill style={exit(f, 852, 12, 1.6)}>
            <Center top={330}>
              <div style={fadeUp(f, at('into') - 2)}>
                <Label size={40} spacing={18} color={C.cream}>into</Label>
              </div>
            </Center>
            <Center top={390}>
              <div style={slam(f, glob - 2, 1.5, 12)}>
                <Big size={170} gold>GLOBAL</Big>
              </div>
              <Mask>
                <div style={rise(f, at('players') - 2)}>
                  <Big size={170}>PLAYERS</Big>
                </div>
              </Mask>
            </Center>
          </AbsoluteFill>
        </>
      )}
    </AbsoluteFill>
  );
};

// ════════════════════════════════════════════════════════════════════════════════════
// S7 — "This is where deals are signed. This is where partnerships are born."
// ════════════════════════════════════════════════════════════════════════════════════
const SIGN =
  'M20 120 C60 40 90 20 100 60 C110 100 70 150 60 120 C50 90 120 40 150 80 C170 110 150 140 170 120 C190 100 210 60 240 80 C262 96 240 130 262 120 C290 104 310 70 340 90 C366 108 350 140 380 126 C420 108 470 96 560 100';
const PhotoCard: React.FC<{src: string; f: number; start: number; from: 'left' | 'right'}> = ({src, f, start, from}) => {
  const p = tw(f, start, 20, 'expo.out');
  const d = from === 'left' ? -1 : 1;
  return (
    <div style={{position: 'absolute', left: 60, top: 280, width: 960, height: 600, perspective: 1600}}>
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 34,
          overflow: 'hidden',
          border: '2px solid rgba(242,210,122,0.55)',
          boxShadow: '0 50px 120px rgba(0,0,0,0.7)',
          transform: `translateX(${(1 - p) * 700 * d}px) rotateY(${(1 - p) * 38 * d}deg) rotateZ(${(1 - p) * 4 * d}deg)`,
          opacity: Math.min(1, p * 2),
        }}
      >
        <Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.18 - 0.1 * tw(f, start, 80, 'sine.out')}) translateY(-4%)`, filter: 'contrast(1.06) saturate(1.1)'}} />
      </div>
    </div>
  );
};
export const S7: React.FC<S> = ({f}) => {
  const d0 = at('this', 1);
  const signed = at('signed');
  const p2 = at('this', 2);
  const push = tw(f, p2 - 8, 16, 'power3.inOut');
  const born = at('born');
  const draw = tw(f, signed - 2, 22, 'power2.inOut');
  const inP = tw(f, 856, 12, 'expo.out');
  return (
    <AbsoluteFill style={{opacity: inP}}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 30%, #1d1508, #050407 70%)'}} />
      <AbsoluteFill style={{transform: `translateY(${-push * 1920}px)`}}>
        <PhotoCard src="canton/buyers-pumps.webp" f={f} start={d0 - 6} from="right" />
        <Center top={920}>
          <div style={fadeUp(f, d0)}>
            <Label size={36} spacing={14} color={C.cream}>This is where</Label>
          </div>
          <Mask>
            <div style={rise(f, at('deals') - 2)}>
              <Big size={160}>DEALS</Big>
            </div>
          </Mask>
          <div style={slam(f, signed - 2, 1.4, 12)}>
            <Big size={150} gold>ARE SIGNED</Big>
          </div>
        </Center>
        <svg width={1080} height={300} style={{position: 'absolute', top: 1255, left: 0}} viewBox="0 0 1080 300">
          <g transform="translate(250 30)">
            <path d={SIGN} fill="none" stroke="#F2D27A" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} style={{filter: 'drop-shadow(0 0 8px #F2D27A)'}} />
          </g>
        </svg>
        {/* panel 2 sits one screen below */}
        <div style={{position: 'absolute', left: 0, top: 1920, width: 1080, height: 1920}}>
          <PhotoCard src="canton/buyers-bags.webp" f={f} start={p2 - 4} from="left" />
          {/* connection graphic */}
          <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
            {[0, 1, 2, 3, 4].map((i) => {
              const p = tw(f, born - 6 + i * 2, 14, 'power2.out');
              const y = 940;
              const x1 = 200 + i * 40;
              const x2 = 880 - i * 40;
              return <path key={i} d={`M${x1} ${y} Q540 ${y - 70 - i * 18} ${x2} ${y}`} fill="none" stroke="#F2D27A" strokeOpacity={0.5 - i * 0.08} strokeWidth={3} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} />;
            })}
            <circle cx={200} cy={940} r={14 * tw(f, born - 8, 10, 'back.out(3)')} fill={C.red} />
            <circle cx={880} cy={940} r={14 * tw(f, born - 8, 10, 'back.out(3)')} fill={C.red} />
          </svg>
          <Center top={980}>
            <div style={fadeUp(f, p2)}>
              <Label size={36} spacing={14} color={C.cream}>This is where</Label>
            </div>
            <div style={slam(f, at('partnerships') - 2, 1.4, 12)}>
              <Big size={150} gold>PARTNERSHIPS</Big>
            </div>
            <Mask>
              <div style={rise(f, at('are', 1) - 2)}>
                <Big size={150}>ARE BORN</Big>
              </div>
            </Mask>
          </Center>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ════════════════════════════════════════════════════════════════════════════════════
// S8 — "Don't just follow the market. Meet it face to face."
// ════════════════════════════════════════════════════════════════════════════════════
export const S8: React.FC<S> = ({f}) => {
  const iris = tw(f, 990, 18, 'expo.inOut');
  const fol = at('follow');
  const meet = at('meet');
  const strike = tw(f, at('market') + 6, 8, 'expo.out');
  const up = tw(f, meet - 6, 12, 'power3.inOut');
  const whip = tw(f, 1094, 14, 'power3.in');
  const f1 = at('face');
  const f2 = at('face', 1);
  return (
    <AbsoluteFill style={{clipPath: `circle(${iris * 120}% at 50% 52%)`, transform: `translateX(${-whip * 1300}px)`, filter: whip > 0.02 ? `blur(${whip * 26}px)` : undefined}}>
      <Photo src="canton/entrance.webp" f={f} from={990} dur={120} zoom={[1.35, 1.08]} pan={[0, 0, 0, 40]} grade={0.7} />
      <Shade top={0.7} bottom={0.8} all={0.4} />
      <AbsoluteFill style={{transform: `translateY(${-up * 150}px) scale(${1 - up * 0.22})`, transformOrigin: '50% 20%', opacity: 1 - up * 0.45}}>
        <Center top={330}>
          <Mask>
            <div style={rise(f, at("don't") - 2)}>
              <Big size={120}>DON'T JUST</Big>
            </div>
          </Mask>
        </Center>
        <Center top={460}>
          <div style={{position: 'relative', ...slam(f, fol - 2, 1.4, 12)}}>
            <Big size={250} color={strike > 0 ? `rgba(255,255,255,${1 - strike * 0.55})` : C.white}>FOLLOW</Big>
            <div style={{position: 'absolute', left: -20, right: -20, top: '48%', height: 22, background: C.red, transformOrigin: '0 50%', transform: `scaleX(${strike}) rotate(-4deg)`, boxShadow: `0 0 30px ${C.red}`}} />
          </div>
        </Center>
        <Center top={730}>
          <Mask>
            <div style={rise(f, at('market') - 2)}>
              <Big size={120}>THE MARKET</Big>
            </div>
          </Mask>
        </Center>
      </AbsoluteFill>
      {f >= meet - 4 && (
        <>
          <Center top={830}>
            <Mask>
              <div style={rise(f, meet - 2)}>
                <Label size={52} spacing={20} color={C.cream}>Meet it</Label>
              </div>
            </Mask>
          </Center>
          <Center top={930} style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 24}}>
            <div style={{transform: `translateX(${(1 - tw(f, f1 - 3, 12, 'expo.out')) * -500}px)`, opacity: tw(f, f1 - 3, 5, 'none')}}>
              <Big size={210} gold>FACE</Big>
            </div>
            <div style={slam(f, at('to') - 1, 1.8, 10)}>
              <Big size={90}>TO</Big>
            </div>
            <div style={{transform: `translateX(${(1 - tw(f, f2 - 3, 12, 'expo.out')) * 500}px)`, opacity: tw(f, f2 - 3, 5, 'none')}}>
              <Big size={210} gold>FACE</Big>
            </div>
          </Center>
        </>
      )}
    </AbsoluteFill>
  );
};

// ════════════════════════════════════════════════════════════════════════════════════
// S9 — "Register now and book your trip, and get ready for the event of the year."
// ════════════════════════════════════════════════════════════════════════════════════
const Barcode: React.FC = () => (
  <div style={{display: 'flex', gap: 3, height: 110, alignItems: 'stretch'}}>
    {Array.from({length: 34}, (_, i) => (
      <div key={i} style={{width: 2 + Math.floor(rand(i + 4) * 4), background: '#1a1206'}} />
    ))}
  </div>
);
export const S9: React.FC<S> = ({f}) => {
  const reg = at('register');
  const book = at('book');
  const get = at('get');
  const ev = at('event', 1);
  const inP = tw(f, 1094, 16, 'expo.out');
  const tap = at('now');
  const press = Math.max(0, 1 - Math.abs(f - tap) / 4);
  const ripple = tw(f, tap, 14, 'power2.out');
  const cur = tw(f, reg + 2, 12, 'power3.out');
  const pass = tw(f, book - 4, 20, 'back.out(1.2)');
  const passOut = tw(f, get - 6, 14, 'power3.in');
  const bg2 = tw(f, get - 8, 18, 'power2.inOut');
  const regOut = tw(f, get - 6, 10, 'power3.in');
  return (
    <AbsoluteFill style={{transform: `translateX(${(1 - inP) * 1300}px)`, filter: inP < 0.98 ? `blur(${(1 - inP) * 26}px)` : undefined}}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 30%, #1f160a, #060508 70%)'}} />
      <Photo src="canton/hall-92.webp" f={f} from={1092} dur={90} zoom={[1.2, 1.32]} grade={0.3} imgStyle={{filter: 'brightness(0.22) blur(10px) saturate(1.1)'}} />
      <AbsoluteFill style={{opacity: bg2}}>
        <Photo src="canton/tower-sunset.webp" f={f} from={get - 8} dur={90} zoom={[1.25, 1.05]} pan={[0, 60, 0, 0]} grade={0.85} />
        <Shade top={0.55} bottom={0.75} all={0.25} />
      </AbsoluteFill>
      {/* register button + tap */}
      <AbsoluteFill style={{opacity: 1 - regOut, transform: `translateY(${-regOut * 120}px)`}}>
        <Center top={330}>
          <div style={{position: 'relative', transform: `scale(${tw(f, reg - 3, 14, 'back.out(2)') * (1 - press * 0.07)})`}}>
            <div style={{padding: '18px 54px 12px', borderRadius: 999, background: `linear-gradient(180deg, #FF5A44, ${C.red} 55%, #B8261A)`, boxShadow: `0 20px 60px ${C.red}88, inset 0 2px 0 rgba(255,255,255,0.35)`, display: 'flex', alignItems: 'center', gap: 22}}>
              <Big size={92} spacing={3}>REGISTER NOW</Big>
              <svg width={60} height={60} viewBox="0 0 60 60">
                <path d="M10 30 L48 30 M34 16 L48 30 L34 44" stroke="#fff" strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            {ripple > 0 && ripple < 1 && (
              <div style={{position: 'absolute', left: '72%', top: '60%', width: 40, height: 40, marginLeft: -20, marginTop: -20, borderRadius: '50%', border: '4px solid #fff', transform: `scale(${1 + ripple * 6})`, opacity: 1 - ripple}} />
            )}
            {/* cursor */}
            <svg
              width={70}
              height={70}
              viewBox="0 0 24 24"
              style={{position: 'absolute', left: `${lerp(110, 72, cur)}%`, top: `${lerp(260, 60, cur)}%`, transform: `scale(${1 - press * 0.15})`, filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.5))', opacity: cur}}
            >
              <path d="M4 2 L4 20 L9 15 L12.5 22 L15.5 20.6 L12 13.8 L19 13.8 Z" fill="#fff" stroke="#111" strokeWidth={1.2} />
            </svg>
          </div>
        </Center>
      </AbsoluteFill>
      {/* boarding pass */}
      {f >= book - 6 && f < get + 12 && (
        <div style={{position: 'absolute', left: 70, top: 560, width: 940, height: 560, perspective: 1800}}>
          <div
            style={{
              width: '100%',
              height: '100%',
              transformOrigin: '50% 0%',
              transform: `rotateX(${(1 - pass) * -95}deg) rotateY(${passOut * 95}deg) translateY(${Math.sin(f / 16) * 6}px)`,
              borderRadius: 36,
              background: 'linear-gradient(135deg, #FFF8EA, #F4E3BD)',
              boxShadow: '0 50px 120px rgba(0,0,0,0.65)',
              display: 'flex',
              overflow: 'hidden',
            }}
          >
            <div style={{flex: 1, padding: '34px 40px', display: 'flex', flexDirection: 'column', gap: 18}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <Label size={26} color="#8F6A10" spacing={8}>Boarding pass</Label>
                <div style={{padding: '4px 16px', borderRadius: 999, background: C.red}}>
                  <Label size={22} color="#fff" spacing={4}>Canton Fair 140</Label>
                </div>
              </div>
              <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <div>
                  <Label size={22} color="#8F6A10" spacing={6}>From</Label>
                  <Big size={110} color={C.ink}>YOU</Big>
                </div>
                <svg width={250} height={90} viewBox="0 0 250 90">
                  <path d="M10 70 Q125 -10 240 70" fill="none" stroke="#C9971C" strokeWidth={4} strokeDasharray="10 10" pathLength={1} />
                  <g transform={`translate(${10 + 230 * tw(f, book + 2, 26, 'power2.inOut')} ${70 - Math.sin(Math.PI * tw(f, book + 2, 26, 'power2.inOut')) * 58}) rotate(${lerp(-30, 30, tw(f, book + 2, 26, 'power2.inOut'))})`}>
                    <path d="M-16 -4 L10 -4 L18 0 L10 4 L-16 4 L-10 0 Z M-4 -4 L2 -16 L8 -16 L6 -4 Z M-4 4 L2 16 L8 16 L6 4 Z" fill={C.red} />
                  </g>
                </svg>
                <div style={{textAlign: 'right'}}>
                  <Label size={22} color="#8F6A10" spacing={6}>To</Label>
                  <Big size={110} color={C.ink}>CAN</Big>
                </div>
              </div>
              <div style={{display: 'flex', gap: 34, borderTop: '2px dashed rgba(143,106,16,0.4)', paddingTop: 20}}>
                {[
                  ['Date', '15 OCT – 04 NOV'],
                  ['City', 'GUANGZHOU'],
                  ['Gate', 'A · B · C'],
                ].map(([k, v]) => (
                  <div key={k}>
                    <Label size={20} color="#8F6A10" spacing={6}>{k}</Label>
                    <div style={{fontFamily: MONT, fontWeight: 900, fontSize: 32, color: C.ink}}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{width: 190, borderLeft: '3px dashed rgba(143,106,16,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: 'rgba(201,151,28,0.12)'}}>
              <Big size={64} color={C.ink}>2026</Big>
              <Barcode />
            </div>
          </div>
        </div>
      )}
      {f >= book - 4 && f < get + 6 && (
        <Center top={1180} style={{opacity: 1 - passOut}}>
          <Mask>
            <div style={rise(f, book - 2)}>
              <Big size={130} gold>BOOK YOUR TRIP</Big>
            </div>
          </Mask>
        </Center>
      )}
      {/* event of the year */}
      {f >= get - 4 && (
        <AbsoluteFill style={exit(f, 1226, 12, 1.4)}>
          <Center top={560}>
            <div style={fadeUp(f, get)}>
              <Label size={46} spacing={18} color={C.cream}>Get ready for</Label>
            </div>
          </Center>
          <Center top={640}>
            <div style={slam(f, ev - 3, 1.5, 12)}>
              <Big size={230}>THE EVENT</Big>
            </div>
            <Mask>
              <div style={rise(f, at('of', 1) - 2)}>
                <Big size={190} gold>OF THE YEAR</Big>
              </div>
            </Mask>
          </Center>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

// ════════════════════════════════════════════════════════════════════════════════════
// S10 — "The Canton Fair. Where the world does business. See you there." + ALPHA CTA
// ════════════════════════════════════════════════════════════════════════════════════
export const S10: React.FC<S> = ({f}) => {
  const can = at('canton', 2);
  const wh = at('where', 2);
  const see = at('see');
  const inP = tw(f, 1226, 16, 'power2.out');
  const tagOut = tw(f, see - 8, 10, 'power3.in');
  const ctaT = see + 8;
  const pill = tw(f, ctaT + 18, 16, 'back.out(1.8)');
  const pulse = 1 + 0.03 * Math.sin((f - ctaT) / 5);
  return (
    <AbsoluteFill style={{opacity: inP}}>
      <Photo src="canton/tower-night.webp" f={f} from={1226} dur={200} zoom={[1.18, 1.0]} pan={[0, -40, 0, 20]} grade={0.42} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 35%, rgba(201,151,28,0.22), rgba(5,5,8,0.75) 70%)'}} />
      <Stage>
        <GoldTitle f={f} start={can} out={see - 6} />
      </Stage>
      <AbsoluteFill style={{opacity: 1 - tagOut, transform: `translateY(${tagOut * 60}px)`}}>
        <Center top={1000}>
          <div style={{width: 520 * tw(f, can + 14, 18, 'expo.out'), height: 3, background: 'linear-gradient(90deg, transparent, #F2D27A, transparent)', marginBottom: 30}} />
          <Mask>
            <div style={rise(f, wh - 2)}>
              <Big size={104} spacing={2}>WHERE THE WORLD</Big>
            </div>
          </Mask>
          <div style={slam(f, at('business') - 3, 1.4, 12)}>
            <Big size={140} gold>DOES BUSINESS</Big>
          </div>
        </Center>
      </AbsoluteFill>
      {f >= see - 2 && (
        <>
          <Center top={640}>
            <div style={{display: 'flex', gap: 26}}>
              {['SEE', 'YOU', 'THERE'].map((w, i) => (
                <div key={w} style={slam(f, [see, at('you'), at('there')][i] - 1, 1.6, 10)}>
                  <Big size={150} gold={i === 2}>{w}</Big>
                </div>
              ))}
            </div>
          </Center>
          <Center top={850}>
            <div style={{display: 'flex', alignItems: 'center', gap: 22, direction: 'ltr', ...fadeUp(f, ctaT)}}>
              <LogoMark t={f - ctaT} size={130} />
              <Wordmark t={f - ctaT - 6} size={82} shimmerAt={40} letterDelay={2} />
            </div>
          </Center>
          <Center top={1030}>
            <div style={fadeUp(f, ctaT + 10)}>
              <Label size={30} spacing={7} color={C.cream}>{pitch.line}</Label>
            </div>
          </Center>
          <Center top={1110}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 22,
                padding: '16px 46px 16px 22px',
                borderRadius: 999,
                background: 'linear-gradient(135deg, #8F6A10, #C9971C 35%, #F2D27A 52%, #C9971C 70%, #8F6A10)',
                boxShadow: `0 0 60px rgba(201,151,28,0.55)`,
                transform: `scale(${(0.5 + 0.5 * pill) * pulse})`,
                opacity: Math.min(1, pill * 2),
              }}
            >
              <div style={{width: 84, height: 84, borderRadius: 42, background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <LineIcon name="whatsapp" size={52} progress={tw(f, ctaT + 20, 16, 'power2.out')} strokeWidth={1.8} />
              </div>
              <div style={{display: 'flex', flexDirection: 'column'}}>
                <Label size={22} color="#111" spacing={6}>WhatsApp</Label>
                <div style={{fontFamily: MONT, fontWeight: 900, fontSize: 54, color: '#111', letterSpacing: 1}}>{pitch.whatsapp}</div>
              </div>
            </div>
          </Center>
          <Center top={1290}>
            <div style={{...fadeUp(f, ctaT + 26), fontFamily: MONT, fontWeight: 700, fontSize: 30, color: C.goldLight, letterSpacing: 2}}>{pitch.footer}</div>
          </Center>
        </>
      )}
    </AbsoluteFill>
  );
};

