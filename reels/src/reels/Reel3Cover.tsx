import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {Emblem} from './Reel3';

const C = {navy: '#0F1B2D', navy2: '#172841', gold: '#C99A16', kick: '#E8C766', goldL: '#F4ECD6'};
const AR = '"IBM Plex Sans Arabic", "IBM Plex Sans", system-ui, sans-serif';
const LAT = '"IBM Plex Sans", "IBM Plex Sans Arabic", sans-serif';

/**
 * Reel cover, 1080 x 1920. Everything that matters sits inside the centre 1080 x 1350
 * (y 285..1635), so the Instagram profile grid's 4:5 crop keeps it.
 */
export const Reel3Cover: React.FC = () => (
  <AbsoluteFill style={{background: C.navy}}>
    {/* the site's hero shot: port under the clouds */}
    <Img src={staticFile('site/hero-ending.jpg')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 50%', transform: 'scale(1.06)'}} />
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(10,18,32,.94) 0%, rgba(10,18,32,.72) 30%, rgba(10,18,32,.55) 48%, rgba(10,18,32,.82) 68%, rgba(10,18,32,.97) 100%)'}} />
    <AbsoluteFill style={{background: `radial-gradient(620px 480px at 50% 27%, rgba(10,18,32,.75), transparent 75%), radial-gradient(760px 560px at 50% 27%, rgba(201,154,22,.16), transparent 72%)`}} />
    {/* fine gold frame */}
    <div style={{position: 'absolute', left: 54, right: 54, top: 54, bottom: 54, border: '1.5px solid rgba(232,199,102,.35)', borderRadius: 34}} />

    <AbsoluteFill style={{alignItems: 'center'}}>
      {/* lock-up */}
      <div style={{position: 'absolute', top: 330, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22}}>
        <div style={{filter: 'drop-shadow(0 18px 40px rgba(0,0,0,.45))'}}>
          <Emblem width={250} />
        </div>
        <Img src={staticFile('brand/wordmark-gold.png')} style={{width: 340, filter: 'drop-shadow(0 6px 18px rgba(0,0,0,.7))'}} />
      </div>

      {/* headline */}
      <div dir="rtl" style={{position: 'absolute', top: 860, display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: AR}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 18, color: C.kick, fontWeight: 600, fontSize: 42, marginBottom: 18}}>
          <span style={{width: 60, height: 3, background: C.gold}} />
          قوانزو، الصين
          <span style={{width: 60, height: 3, background: C.gold}} />
        </div>
        <div style={{fontWeight: 700, fontSize: 132, lineHeight: 1.22, color: '#fff', textAlign: 'center', textShadow: '0 10px 40px rgba(0,0,0,.5)'}}>
          من مصانع الصين
          <br />
          <span style={{color: C.kick}}>إلى ميناء بلدك</span>
        </div>
      </div>

      {/* services strip */}
      <div dir="rtl" style={{position: 'absolute', top: 1290, display: 'flex', alignItems: 'center', gap: 22, fontFamily: AR, fontWeight: 500, fontSize: 36, color: 'rgba(255,255,255,.9)'}}>
        {['خطوط إنتاج', 'مكائن صناعية', 'فحص', 'شحن بحري وجوي'].map((s, i) => (
          <React.Fragment key={s}>
            {i > 0 && <span style={{width: 9, height: 9, borderRadius: '50%', background: C.gold}} />}
            <span>{s}</span>
          </React.Fragment>
        ))}
      </div>

      {/* website */}
      <div style={{position: 'absolute', top: 1440, padding: '18px 44px', borderRadius: 999, border: `2px solid ${C.gold}`, background: 'rgba(15,27,45,.6)', fontFamily: LAT, fontWeight: 600, fontSize: 40, letterSpacing: '0.04em', color: C.goldL}}>
        www.alphaglobalcargo.com
      </div>
    </AbsoluteFill>
  </AbsoluteFill>
);
