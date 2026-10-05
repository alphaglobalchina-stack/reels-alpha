import React from 'react';
import {Img, staticFile} from 'remotion';
import {Cam} from './camera';
import {BRAND, C, CITIES, CONTACT, CTA, FEATURES, IMG, PHOTO_SIZE, PRICE, ROW2, Rect, T, TEXT, TITLE, TOWERS_ROWS} from './data';
import {FEATURE_ICONS, Glyph, HeartsIcon, Sparkle} from './icons';
import {Ar, Card, FONT, IconChip, Ltr, SlotDigit, clamp01, easeInOut, easeOut, prog, rand} from './ui';

type SP = {f: number; cam: Cam; blur?: number};

// ───────────────────────────── 1. title ─────────────────────────────
export const TitleCard: React.FC<SP> = ({f, cam, blur = 0}) => {
  const {card, inset, photoH, photoScale: k, srcTop, srcCenterX, fontSize} = TITLE;
  const winW = card.w - 2 * inset;
  const imgW = PHOTO_SIZE.w * k;
  const imgH = PHOTO_SIZE.h * k;
  const imgLeft = winW / 2 - srcCenterX * k;
  const imgTop = -srcTop * k;
  // photo + towers move together (seamless across the window edge): in-window parallax, float, rise
  const para = Math.max(-70, Math.min(20, (520 - cam.cy) * 0.03));
  const bob = Math.sin((f / 30) * 1.7) * 5;
  const rise = (1 - prog(f, T.titleIn - 14, 34)) * 46;
  const dy = para + bob + rise;
  const t = prog(f, T.titleIn, 30);
  const logoIn = prog(f, T.titleIn + 14, 24);
  return (
    <>
      <Card rect={card} blur={blur}>
        <div style={{position: 'absolute', left: inset, top: inset, width: winW, height: photoH, borderRadius: 40, overflow: 'hidden', background: '#0E1424'}}>
          <Img src={staticFile(IMG.kl)} style={{position: 'absolute', left: imgLeft, top: imgTop + dy, width: imgW, height: imgH}} />
          <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(14,20,36,0) 60%, rgba(14,20,36,0.35) 100%)'}} />
          <div
            style={{
              position: 'absolute',
              left: 30,
              top: 30,
              width: 128,
              height: 128,
              borderRadius: 64,
              background: 'rgba(20,20,22,0.55)',
              border: '1px solid rgba(232,217,181,0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: logoIn,
              transform: `scale(${0.8 + 0.2 * logoIn})`,
            }}
          >
            <Img src={staticFile(IMG.mark)} style={{width: 92, height: 107}} />
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: inset + photoH,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ar
            size={fontSize}
            weight={800}
            align="center"
            lh={1.05}
            style={{
              opacity: t,
              transform: `translateY(${(1 - t) * 60}px) scale(${1.08 - 0.08 * t})`,
              filter: t < 0.99 ? `blur(${(1 - t) * 14}px)` : undefined,
              marginTop: -18,
            }}
          >
            {TEXT.title}
          </Ar>
        </div>
      </Card>
      {/* the towers leave the card: same pixel grid as the photo, so they continue it exactly */}
      <Img
        src={staticFile(IMG.towers)}
        style={{
          position: 'absolute',
          left: card.x + inset + imgLeft,
          top: card.y + inset + imgTop + dy,
          width: imgW,
          height: TOWERS_ROWS * k,
          filter: `${blur > 0.15 ? `blur(${blur.toFixed(2)}px) ` : ''}drop-shadow(0 26px 30px rgba(28,28,30,0.22))`,
        }}
      />
    </>
  );
};

// ───────────────────────────── 2. duration + type ─────────────────────────────
export const counterValue = (f: number, start: number, target: number, dur = 28) => target * prog(f, start, dur, easeInOut);

export const DurationCard: React.FC<SP> = ({f, blur = 0}) => {
  const r = ROW2.duration;
  const v7 = counterValue(f, T.countersStart, TEXT.days.n);
  const v6 = counterValue(f, T.countersStart + 6, TEXT.nights.n);
  const half = (v: number, word: string, delay: number) => {
    const w = prog(f, T.countersStart + delay, 20);
    return (
      <div style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
        <SlotDigit v={v} size={230} color={C.ink} />
        <Ar size={68} align="center" style={{marginTop: -8, opacity: 0.25 + 0.75 * w, transform: `translateY(${(1 - w) * 16}px)`}}>
          {word}
        </Ar>
      </div>
    );
  };
  return (
    <Card rect={r} blur={blur}>
      <div dir="rtl" style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '0 24px'}}>
        {half(v7, TEXT.days.word, 4)}
        <div style={{width: 3, height: 300, borderRadius: 2, background: `linear-gradient(180deg, rgba(232,217,181,0), ${C.champagneDeep}, rgba(232,217,181,0))`}} />
        {half(v6, TEXT.nights.word, 10)}
      </div>
    </Card>
  );
};

/** Two-beat heart pulse, ~1 beat pair per second. */
const heartbeat = (f: number, offset: number) => {
  const p = ((f + offset) % 28) / 28;
  const beat = (c: number) => Math.exp(-Math.pow((p - c) / 0.05, 2));
  return 1 + 0.1 * beat(0.1) + 0.07 * beat(0.32);
};

export const TypeCard: React.FC<SP> = ({f, blur = 0}) => {
  const r = ROW2.type;
  const on = f >= T.row2Arrive - 20;
  return (
    <Card rect={r} blur={blur} bg={`linear-gradient(165deg, #F6F4F0 0%, ${C.warm} 100%)`}>
      <div style={{position: 'absolute', top: 40, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
        <HeartsIcon id="hearts" size={230} beatA={on ? heartbeat(f, 0) : 1} beatB={on ? heartbeat(f, 9) : 1} />
      </div>
      <div style={{position: 'absolute', bottom: 54, left: 0, right: 0}}>
        <Ar size={64} align="center" lh={1.22}>
          برنامج خاص
          <br />
          لشخصين
        </Ar>
      </div>
    </Card>
  );
};

// ───────────────────────────── 3. cities ─────────────────────────────
export const CityCard: React.FC<SP & {i: number}> = ({f, cam, blur = 0, i}) => {
  const c = CITIES[i];
  const r = c.rect;
  const sc = Math.max(r.w / PHOTO_SIZE.w, r.h / PHOTO_SIZE.h) * 1.2;
  const iw = PHOTO_SIZE.w * sc;
  const ih = PHOTO_SIZE.h * sc;
  const slackY = ih - r.h;
  const baseLeft = Math.min(0, Math.max(r.w - iw, r.w / 2 - c.focus[0] * iw));
  const baseTop = Math.min(0, Math.max(-slackY, r.h / 2 - c.focus[1] * ih));
  // parallax: the photo slides inside its window opposite to the camera's travel
  const py = Math.max(-slackY - baseTop, Math.min(-baseTop, (r.y + r.h / 2 - cam.cy) * 0.12));
  const reveal = prog(f, T.citiesStart + (i === 0 ? 4 : 26 + (i - 1) * 6), 22);
  return (
    <Card rect={r} blur={blur} sheen={false} bg="#1A1A1C">
      <Img src={staticFile(c.img)} style={{position: 'absolute', left: baseLeft, top: baseTop + py, width: iw, height: ih}} />
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 48%, rgba(10,10,12,0.62) 100%)'}} />
      <div
        style={{
          position: 'absolute',
          right: 44,
          bottom: 38,
          display: 'flex',
          flexDirection: 'row-reverse',
          alignItems: 'center',
          gap: 14,
          opacity: reveal,
          transform: `translateY(${(1 - reveal) * 30}px)`,
        }}
      >
        <Glyph name="pin" size={54} color={C.champagne} />
        <Ar size={66} weight={800} color="#FFFFFF" style={{textShadow: '0 4px 18px rgba(0,0,0,0.35)'}}>
          {c.name}
        </Ar>
      </div>
    </Card>
  );
};

// ───────────────────────────── 4. features ─────────────────────────────
export const featureSpin = (f: number, i: number) => {
  const fs = T.featureStops[i];
  return {
    spin: 360 * prog(f, fs - 10, 24, easeOut),
    glint: f < fs + 2 ? -1 : (f - fs - 2) / 16,
    lift: 10 * Math.sin(Math.PI * prog(f, fs - 10, 24, easeInOut)),
  };
};

export const FeatureCard: React.FC<SP & {i: number}> = ({f, blur = 0, i}) => {
  const ft = FEATURES[i];
  const r = ft.rect;
  const Icon = FEATURE_ICONS[ft.icon];
  const {spin, glint, lift} = featureSpin(f, i);
  if (ft.dark) {
    return (
      <Card rect={r} dark blur={blur}>
        <div style={{position: 'absolute', right: 70, top: (r.h - 210) / 2}}>
          <IconChip size={210} spin={spin} glint={glint} lift={lift} dark>
            <Icon id={`fi${i}`} size={178} />
          </IconChip>
        </div>
        <div style={{position: 'absolute', right: 330, top: 0, bottom: 0, display: 'flex', alignItems: 'center'}}>
          <Ar size={84} weight={800} color="#FFFFFF">
            استقبال <span style={{color: C.champagne}}>VIP</span>
          </Ar>
        </div>
      </Card>
    );
  }
  return (
    <Card rect={r} blur={blur} bg={i % 3 === 1 ? `linear-gradient(165deg, #F7F5F2 0%, ${C.cardAlt} 100%)` : undefined}>
      <div style={{position: 'absolute', right: 46, top: 46}}>
        <IconChip size={212} spin={spin} glint={glint} lift={lift}>
          <Icon id={`fi${i}`} size={178} />
        </IconChip>
      </div>
      <div style={{position: 'absolute', right: 50, left: 40, bottom: 42}}>
        <Ar size={64} weight={800} lh={1.2} style={{whiteSpace: 'normal'}}>
          {ft.text}
        </Ar>
      </div>
    </Card>
  );
};

// ───────────────────────────── 5. price ─────────────────────────────
const PRICE_WHEELS = [
  {target: 5, turns: 0, land: 1.0},
  {target: 9, turns: 1, land: 0.86},
  {target: 5, turns: 2, land: 0.74},
  {target: 0, turns: 3, land: 0.62},
];
export const priceWheelValues = (f: number) => {
  const [a, b] = T.priceCount;
  return PRICE_WHEELS.map((w) => (w.target + 10 * w.turns) * prog(f, a, (b - a) * w.land, easeInOut));
};

export const PriceCard: React.FC<SP> = ({f, blur = 0}) => {
  const r = PRICE;
  const vals = priceWheelValues(f);
  const landed = f >= T.priceCount[1];
  const shine = prog(f, T.priceShine, 20, easeInOut);
  const glow = prog(f, T.priceCount[1] - 6, 16) * (1 - 0.25 * prog(f, T.priceCount[1] + 14, 30));
  const cur = prog(f, T.priceArrive - 6, 22);
  const numStyle: React.CSSProperties = {fontFamily: FONT, fontSize: 250, fontWeight: 800, lineHeight: `${250 * 1.08}px`, color: '#FFFFFF'};
  return (
    <Card rect={r} dark blur={blur}>
      <div style={{position: 'absolute', left: '50%', top: 330, width: 900, height: 520, marginLeft: -450, marginTop: -260, borderRadius: '50%', background: `radial-gradient(closest-side, rgba(232,217,181,${0.24 * glow}), rgba(232,217,181,0))`}} />
      {/* behind the number: the burst never covers the digits */}
      <PriceSpray f={f} />
      <div style={{position: 'absolute', top: 54, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
        <Img src={staticFile(IMG.mark)} style={{width: 112, height: 130, opacity: 0.95}} />
      </div>
      <div style={{position: 'absolute', top: 205, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 2}}>
        <div dir="ltr" style={{position: 'relative', direction: 'ltr', display: 'flex', ...numStyle}}>
          {landed ? (
            <span style={numStyle}>{TEXT.price.display}</span>
          ) : (
            <>
              <SlotDigit v={vals[0]} size={250} color="#FFFFFF" />
              <span style={numStyle}>,</span>
              <SlotDigit v={vals[1]} size={250} color="#FFFFFF" />
              <SlotDigit v={vals[2]} size={250} color="#FFFFFF" />
              <SlotDigit v={vals[3]} size={250} color="#FFFFFF" />
            </>
          )}
          {landed && shine > 0 && shine < 1 && (
            <span
              style={{
                ...numStyle,
                position: 'absolute',
                inset: 0,
                backgroundImage: 'linear-gradient(105deg, rgba(255,255,255,0) 35%, #F6E9C8 47%, #FFFFFF 50%, #F6E9C8 53%, rgba(255,255,255,0) 65%)',
                backgroundSize: '300% 100%',
                backgroundPosition: `${100 - shine * 100}% 0`,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {TEXT.price.display}
            </span>
          )}
        </div>
      </div>
      <div style={{position: 'absolute', top: 505, left: 0, right: 0, zIndex: 2, opacity: cur, transform: `translateY(${(1 - cur) * 24}px)`}}>
        <Ar size={76} weight={700} color={C.champagne} align="center">
          {TEXT.price.currency}
        </Ar>
      </div>
    </Card>
  );
};

/** Small, light burst of icons when the price lands. */
const PriceSpray: React.FC<{f: number}> = ({f}) => {
  const t0 = T.priceCount[1];
  if (f < t0 || f > t0 + 50) return null;
  const t = (f - t0) / 30;
  return (
    <>
      {Array.from({length: 22}, (_, i) => {
        const a = rand(i + 3) * Math.PI * 2;
        const sp = 260 + rand(i + 40) * 300;
        // starts on a ring around the number, so nothing shows through the digits' counters
        const d = 1 - Math.exp(-t * 3);
        const x = 500 + Math.cos(a) * (360 + sp * 0.5 * d);
        const y = 340 + Math.sin(a) * (190 + sp * 0.35 * d) + 90 * t * t;
        const life = clamp01(1 - (f - t0) / (34 + rand(i + 9) * 16));
        const size = 18 + rand(i + 17) * 26;
        const kind = i % 3;
        return (
          <div key={i} style={{position: 'absolute', zIndex: 0, left: x - size / 2, top: y - size / 2, opacity: life * clamp01((f - t0) / 3), transform: `rotate(${(rand(i) - 0.5) * 360 * t}deg)`}}>
            {kind === 2 ? (
              <div style={{width: size * 0.5, height: size * 0.5, borderRadius: '50%', background: '#F6E9C8', boxShadow: '0 0 12px rgba(232,217,181,0.8)'}} />
            ) : (
              <Sparkle size={size} color={kind === 0 ? C.champagne : '#FFFFFF'} />
            )}
          </div>
        );
      })}
    </>
  );
};

// ───────────────────────────── 6. CTA / contact / brand ─────────────────────────────
export const ctaPulse = (f: number) => {
  if (f < T.zoomOut[0]) return 0;
  const p = ((f - T.zoomOut[0]) % 18) / 18;
  return Math.sin(Math.PI * Math.min(1, p / 0.55)) * (p < 0.55 ? 1 : 0);
};

export const CtaCardBody: React.FC<{f: number}> = ({f}) => {
  const p = ctaPulse(f);
  const ringP = f < T.zoomOut[0] ? 0 : ((f - T.zoomOut[0]) % 18) / 18;
  return (
    <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{position: 'relative', width: 780, height: 184}}>
        {ringP > 0 && (
          <div style={{position: 'absolute', inset: -10 - ringP * 34, borderRadius: 120, border: `3px solid rgba(201,174,120,${0.55 * (1 - ringP)})`}} />
        )}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 100,
            background: `linear-gradient(160deg, #F6EDD8 0%, ${C.champagne} 55%, #D9C59A 100%)`,
            boxShadow: `0 24px 50px -20px rgba(150,120,60,0.45), inset 0 2px 0 rgba(255,255,255,0.8)`,
            transform: `scale(${1 + 0.05 * p})`,
            display: 'flex',
            flexDirection: 'row-reverse',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 26,
          }}
        >
          <Ar size={92} weight={800} lh={1}>
            {TEXT.cta}
          </Ar>
          <Glyph name="arrow" size={72} color={C.ink} />
        </div>
      </div>
    </div>
  );
};

export const ContactCardBody: React.FC = () => {
  const ct = TEXT.contact;
  const rows: {icon: 'whatsapp' | 'globe' | 'mail' | 'instagram'; node: React.ReactNode}[] = [
    {icon: 'whatsapp', node: <>{ct.whatsappLabel} <Ltr>{ct.whatsapp}</Ltr></>},
    {icon: 'globe', node: <Ltr>{ct.web}</Ltr>},
    {icon: 'mail', node: <Ltr>{ct.email}</Ltr>},
    {icon: 'instagram', node: <>{ct.instagramLabel} <Ltr>{ct.instagram}</Ltr></>},
  ];
  return (
    <div style={{position: 'absolute', inset: '44px 60px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
      {rows.map((r) => (
        <div key={r.icon} dir="rtl" style={{display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 30}}>
          <div style={{width: 92, height: 92, borderRadius: 30, flexShrink: 0, background: `linear-gradient(150deg, #F7EFDD, ${C.champagne})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.8)'}}>
            <Glyph name={r.icon} size={52} color={C.ink} />
          </div>
          <Ar size={56} weight={700}>
            {r.node}
          </Ar>
        </div>
      ))}
    </div>
  );
};

export const BrandCardBody: React.FC<{f: number; settle?: number}> = ({settle = 1}) => (
  <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
    <Img src={staticFile(IMG.mark)} style={{width: 150, height: 175, transform: `scale(${0.9 + 0.1 * settle})`}} />
    <Ar size={70} weight={800} align="center" lh={1.25} style={{marginTop: 10, opacity: settle, transform: `translateY(${(1 - settle) * 22}px)`}}>
      {TEXT.companyAr}
    </Ar>
    <div style={{fontFamily: FONT, fontSize: 54, fontWeight: 700, color: C.grey, direction: 'ltr', lineHeight: 1.2, opacity: settle, transform: `translateY(${(1 - settle) * 30}px)`}}>
      {TEXT.companyEn}
    </div>
  </div>
);

export const EndCards = {CTA, CONTACT, BRAND};
export const rectCenter = (r: Rect) => ({x: r.x + r.w / 2, y: r.y + r.h / 2});
