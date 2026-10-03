import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {AbsoluteFill, Html5Audio, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import cfg from '../../../content/reel3.json';
import {EMBLEM_A, EMBLEM_SWOOSH} from '../components/emblemPaths';
import {useSafeId} from '../components/Swoosh';
import {Cam, H, Key, L, P, W, World, camAt, project, toEye} from '../three/camera';
import {SITE_ICONS} from '../three/siteIcons';
import {easeInOut, easeOut, prog, rand} from '../lib/anim';

// ── alphaglobalcargo.com design tokens (from its :root) ───────────────────────────
const C = {
  navy: '#0F1B2D', navy2: '#172841', gold: '#C99A16', goldD: '#9C7710', goldL: '#F4ECD6', kick: '#E8C766',
  bg: '#F7F6F2', ivory: '#F3EFE6', white: '#FFFFFF', muted: '#566173', line: '#E3E0D7', cream: '#F7F3EA',
};
const AR = '"IBM Plex Sans Arabic", "IBM Plex Sans", system-ui, sans-serif';
const LAT = '"IBM Plex Sans", "IBM Plex Sans Arabic", sans-serif';
const FPS = cfg.fps;
export const reel3Frames = Math.round(cfg.duration * FPS);
const S = cfg.shots;
const PORTAL = cfg.portal;
const img = (f: string) => staticFile(`site/${f}`);

const back = (x: number) => {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const p01 = (t: number, a: number, d: number) => clamp01((t - a) / d);

// ── brand atoms ───────────────────────────────────────────────────────────────
const VB = {x: 70, y: 100, w: 800, h: 870};

/** The vector emblem from the site's favicon.svg: swoosh sweeps in, the "A" drops into place. */
export const Emblem: React.FC<{width: number; aColor?: string; sweep?: number; drop?: number}> = ({width, aColor = C.cream, sweep = 1, drop = 1}) => {
  const id = useSafeId('em');
  const D = sweep * (VB.w + VB.h) * 1.05;
  const x0 = VB.x, y1 = VB.y + VB.h;
  const e = back(clamp01(drop));
  return (
    <svg viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`} width={width} height={(width * VB.h) / VB.w} style={{overflow: 'visible'}}>
      <defs>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F3D27A" />
          <stop offset=".55" stopColor="#C99A16" />
          <stop offset="1" stopColor="#A67E0F" />
        </linearGradient>
        <clipPath id={`${id}c`}>
          <path d={`M${x0 - 10} ${y1 + 10} L${x0 - 10 + D} ${y1 + 10} L${x0 - 10} ${y1 + 10 - D} Z`} />
        </clipPath>
      </defs>
      <g style={{opacity: clamp01(drop * 3), transform: `translate(${(1 - e) * -60}px, ${(1 - e) * -120}px) rotate(${(1 - e) * -10}deg)`, transformOrigin: '450px 500px'}}>
        <path d={EMBLEM_A} fill={aColor} />
      </g>
      <path d={EMBLEM_SWOOSH} fill={`url(#${id}g)`} clipPath={`url(#${id}c)`} />
    </svg>
  );
};

const Icon: React.FC<{name: string; size: number; color: string; stroke?: number}> = ({name, size, color, stroke}) => {
  const ic = SITE_ICONS[name];
  const attrs = ic.attrs.replace(/stroke-width="[^"]*"/, stroke ? `stroke-width="${stroke}"` : '$&');
  return (
    <span
      style={{display: 'inline-flex', width: size, height: size, color, flex: 'none'}}
      dangerouslySetInnerHTML={{__html: `<svg viewBox="0 0 24 24" width="${size}" height="${size}" ${attrs}>${ic.body}</svg>`}}
    />
  );
};

/** Arabic headline, word by word on the beat: each word lands with weight (overshoot + blur). */
const Words: React.FC<{text: string; t: number; start: number; stagger?: number; size: number; color: string; weight?: number; gap?: number}> = ({
  text, t, start, stagger = 0.125, size, color, weight = 700, gap = 0.26,
}) => (
  <div dir="rtl" style={{display: 'flex', flexDirection: 'row', gap: size * gap, direction: 'rtl', whiteSpace: 'nowrap', justifyContent: 'center'}}>
    {text.split(' ').map((w, i) => {
      const p = p01(t, start + i * stagger, 0.5);
      const e = back(p);
      return (
        <span
          key={i}
          style={{
            display: 'inline-block', fontFamily: AR, fontSize: size, fontWeight: weight, color, lineHeight: 1.3,
            opacity: clamp01(p * 2.5), transform: `translateY(${(1 - e) * size * 0.55}px) scale(${0.82 + 0.18 * e})`,
            filter: p < 1 ? `blur(${(1 - p) * 14}px)` : undefined,
          }}
        >
          {w}
        </span>
      );
    })}
  </div>
);

const Kicker: React.FC<{text: string; color: string; size?: number; t: number; start: number}> = ({text, color, size = 40, t, start}) => {
  const p = easeOut(p01(t, start, 0.6));
  return (
    <div dir="rtl" style={{display: 'flex', alignItems: 'center', gap: 18, opacity: p, fontFamily: AR, fontWeight: 600, fontSize: size, color}}>
      <span style={{width: 70 * p, height: 4, background: C.gold, display: 'inline-block'}} />
      <span style={{transform: `translateX(${(1 - p) * -40}px)`}}>{text}</span>
    </div>
  );
};

const Dots: React.FC<{cam: Cam; color?: string}> = ({cam, color = 'rgba(15,27,45,.10)'}) => {
  const s = 1.6 * (P / (P + cam.z * 0.25 + 400));
  return (
    <AbsoluteFill
      style={{
        backgroundImage: `radial-gradient(${color} ${1.9 * s}px, transparent ${2.6 * s}px)`,
        backgroundSize: `${42 * s}px ${42 * s}px`,
        backgroundPosition: `${-cam.x * 0.3 + cam.ry * 6}px ${-cam.y * 0.3 - cam.rx * 6}px`,
      }}
    />
  );
};

// ── particles: the emblem is built from points sampled out of its own vector paths ──
type Pt = {tx: number; ty: number; sx: number; sy: number; sz: number; d: number; gold: boolean; r: number; spin: number};

const useEmblemPoints = (count: number, seed: number) =>
  useMemo(() => {
    if (typeof document === 'undefined') return [] as {u: number; v: number; gold: boolean}[];
    const k = 0.5;
    const cv = document.createElement('canvas');
    cv.width = Math.ceil(VB.w * k);
    cv.height = Math.ceil(VB.h * k);
    const ctx = cv.getContext('2d')!;
    ctx.scale(k, k);
    ctx.translate(-VB.x, -VB.y);
    ctx.fillStyle = '#f00';
    ctx.fill(new Path2D(EMBLEM_A));
    ctx.fillStyle = '#0f0';
    ctx.fill(new Path2D(EMBLEM_SWOOSH));
    const data = ctx.getImageData(0, 0, cv.width, cv.height).data;
    const pts: {u: number; v: number; gold: boolean}[] = [];
    for (let y = 0; y < cv.height; y += 3)
      for (let x = 0; x < cv.width; x += 3) {
        const i = (y * cv.width + x) * 4;
        if (data[i + 3] < 200) continue;
        pts.push({u: x / k + VB.x, v: y / k + VB.y, gold: data[i + 1] > data[i]});
      }
    // deterministic subsample
    const step = Math.max(1, pts.length / count);
    const out = [];
    for (let i = 0; i < pts.length && out.length < count; i += step) out.push(pts[Math.floor(i + rand(seed + i) * 0.5)]);
    return out;
  }, [count, seed]);

/** Points stream in from a 3D swirl and lock into the emblem; drawn on a canvas with the shot's camera. */
const ParticleEmblem: React.FC<{cam: Cam; t: number; center: [number, number, number]; width: number; start: number; land: number; fade: [number, number]; seed?: number; rings?: boolean}> = ({
  cam, t, center, width, start, land, fade, seed = 1, rings = true,
}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const raw = useEmblemPoints(1700, seed);
  const pts: Pt[] = useMemo(
    () =>
      raw.map((p, i) => {
        const a = rand(seed * 31 + i) * Math.PI * 2;
        const b = (rand(seed * 17 + i * 3) - 0.5) * Math.PI;
        const dist = 700 + rand(i * 7 + seed) * 1600;
        return {
          tx: center[0] + ((p.u - VB.x - VB.w / 2) / VB.w) * width,
          ty: center[1] + ((p.v - VB.y - VB.h / 2) / VB.w) * width,
          sx: Math.cos(a) * Math.cos(b) * dist,
          sy: Math.sin(b) * dist,
          sz: Math.sin(a) * Math.cos(b) * dist,
          d: start + Math.pow(rand(i * 13 + seed * 5), 0.8) * (land - start - 1.0),
          gold: p.gold,
          r: 1.6 + rand(i * 5) * 2.2,
          spin: 1.4 + rand(i * 11) * 2.2,
        };
      }),
    [raw, center[0], center[1], center[2], width, start, land, seed],
  );
  useLayoutEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d')!;
    ctx.clearRect(0, 0, W, H);
    const fadeOut = 1 - p01(t, fade[0], fade[1] - fade[0]);
    if (fadeOut <= 0) return;
    ctx.globalCompositeOperation = 'lighter';
    // orbiting construction rings (thin lines in tilted planes)
    if (rings) {
      const ringA = clamp01(p01(t, start, 0.6)) * (1 - p01(t, land - 0.6, 0.8));
      if (ringA > 0) {
        [[0.62, 70, 0], [0.78, -55, 40], [0.95, 20, -65]].forEach(([rr, tilt, yaw], k) => {
          const R = width * rr;
          const draw = easeInOut(p01(t, start + k * 0.15, 1.3));
          ctx.beginPath();
          for (let i = 0; i <= 140 * draw; i++) {
            const th = (i / 140) * Math.PI * 2 + t * (0.5 + k * 0.3);
            let x = Math.cos(th) * R, y = Math.sin(th) * R, z = 0;
            const tl = (tilt * Math.PI) / 180, yw = (yaw * Math.PI) / 180;
            const y2 = y * Math.cos(tl) - z * Math.sin(tl);
            z = y * Math.sin(tl) + z * Math.cos(tl);
            y = y2;
            const x2 = x * Math.cos(yw) + z * Math.sin(yw);
            z = -x * Math.sin(yw) + z * Math.cos(yw);
            x = x2;
            const q = project(cam, [center[0] + x, center[1] + y, center[2] + z]);
            if (i === 0) ctx.moveTo(q.x, q.y);
            else ctx.lineTo(q.x, q.y);
          }
          ctx.strokeStyle = `rgba(232,199,102,${0.55 * ringA * fadeOut})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        });
      }
    }
    for (const p of pts) {
      const u = p01(t, p.d, 1.0);
      if (u <= 0) continue;
      const e = easeInOut(u);
      const k = 1 - e;
      const ang = k * p.spin;
      const ox = p.sx * k, oy = p.sy * k;
      const x = p.tx + ox * Math.cos(ang) - oy * Math.sin(ang);
      const y = p.ty + ox * Math.sin(ang) + oy * Math.cos(ang);
      const z = center[2] + p.sz * k;
      const q = project(cam, [x, y, z]);
      if (q.ez > P - 30) continue;
      const a = Math.min(1, u * 4) * fadeOut;
      const rr = p.r * q.s * (1 + k * 1.5);
      ctx.fillStyle = p.gold ? `rgba(232,${180 + Math.round(k * 40)},90,${a})` : `rgba(247,243,234,${a * 0.9})`;
      ctx.beginPath();
      ctx.arc(q.x, q.y, Math.max(0.6, rr), 0, Math.PI * 2);
      ctx.fill();
    }
  });
  return <canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0}} />;
};

/** Floating dust that gives every world depth and parallax. */
const Dust: React.FC<{cam: Cam; t: number; seed: number; color: string; zRange: [number, number]; count?: number; spread?: number}> = ({cam, t, seed, color, zRange, count = 160, spread = 1600}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const ctx = ref.current!.getContext('2d')!;
    ctx.clearRect(0, 0, W, H);
    for (let i = 0; i < count; i++) {
      const x = (rand(seed + i) - 0.5) * spread * 2 + Math.sin(t * 0.4 + i) * 30;
      const y = (rand(seed + i * 3) - 0.5) * spread * 2.4 - t * 12 * (0.5 + rand(i));
      const z = zRange[0] + rand(seed + i * 7) * (zRange[1] - zRange[0]);
      const q = project(cam, [x, y, z]);
      if (q.ez > P - 80 || q.x < -20 || q.x > W + 20 || q.y < -20 || q.y > H + 20) continue;
      const near = clamp01((P - q.ez - 80) / 600);
      ctx.fillStyle = color;
      ctx.globalAlpha = (0.25 + 0.5 * rand(i * 9)) * near;
      ctx.beginPath();
      ctx.arc(q.x, q.y, Math.max(0.5, (1.2 + rand(i) * 2.4) * q.s), 0, Math.PI * 2);
      ctx.fill();
    }
  });
  return <canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0}} />;
};

const useT = () => {
  const frame = useCurrentFrame();
  return frame / FPS + React.useContext(OffsetCtx);
};

const withFocus = (cam: Cam, subject: [number, number, number]) => ({...cam, focus: P - toEye(cam, subject)[2]});

// ═══════════════════════ SHOT 1 · logo → hero ═══════════════════════
const EM1: [number, number, number] = [0, -440, 0];
const HERO_RING = {c: [0, 300, -2300] as [number, number, number], r: 600};
const k1: Key[] = [
  {t: 0, x: 0, y: -440, z: 330, rx: 5, ry: -18, rz: -2},
  {t: 1.5, x: 0, y: -440, z: 190, rx: 2, ry: -7, rz: 0},
  {t: 2.85, x: 0, y: -440, z: 150, rx: 0, ry: 0, rz: 0},
  {t: 4.3, x: 0, y: 250, z: 900, rx: -3, ry: 4, rz: 0},
  {t: 5.4, x: 110, y: 270, z: 320, rx: -2, ry: -5, rz: 2},
  {t: 6.6, x: -110, y: 300, z: -350, rx: 0, ry: 5, rz: -2},
  {t: 7.6, x: 70, y: 300, z: -880, rx: 0, ry: -3, rz: 1},
  {t: 8.5, x: 0, y: 300, z: -1240, rx: 0, ry: 0, rz: 0},
  {t: 9.5, x: 0, y: 300, z: -3000, rx: 0, ry: 0, rz: 0},
];
const subj1 = (t: number): [number, number, number] =>
  t < 3.6 ? EM1 : t < 5.2 ? [0, 300, 420] : t < 8.4 ? [0, 300, 900 - (t - 4.3) * 520] : HERO_RING.c;
const cam1 = (t: number) => ({...withFocus(camAt(k1, t), subj1(t)), aperture: t < 3 ? 0.004 : 0.009});

const CHIPS = [
  {icon: 'gear', ar: 'خطوط إنتاج كاملة', p: [-250, 60, -300]},
  {icon: 'ship', ar: 'شحن بحري وجوي', p: [250, 470, -820]},
  {icon: 'shield', ar: 'فحص قبل الشحن', p: [-250, 640, -1320]},
  {icon: 'pin', ar: 'تسليم في ميناء الوصول', p: [250, 160, -1800]},
];
const PORTS = ['GUANGZHOU CNGZG', 'NANSHA CNNSA', 'ADEN YEADE', 'HODEIDAH YEHOD', 'JEDDAH SAJED', 'DAMMAM SADMM', 'JEBEL ALI AEJEA', 'SOHAR OMSOH', 'HAMAD QAHMD', 'SHUWAIKH KWSWK', 'KHALIFA BIN SALMAN BHKBS', 'WORLDWIDE ALL PORTS'];

const Glass: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <div
    dir="rtl"
    style={{
      display: 'flex', alignItems: 'center', gap: 22, padding: '30px 40px', borderRadius: 24,
      background: 'rgba(10,18,32,.55)', border: '1.5px solid rgba(255,255,255,.18)', backdropFilter: 'blur(8px)',
      boxShadow: '0 30px 80px rgba(0,0,0,.35)', ...style,
    }}
  >
    {children}
  </div>
);

const Shot1: React.FC = () => {
  const t = useT();
  const cam = cam1(t);
  const reveal = (a: number, d = 0.7) => back(p01(t, a, d));
  const vid = p01(t, 3.1, 1.6);
  const hit = p01(t, 3.0, 0.9);
  const solid = easeInOut(p01(t, 2.45, 0.6));
  const ringRot = t * 14;
  return (
    <AbsoluteFill style={{background: C.navy}}>
      {/* the site's hero video, revealed as the camera pulls back */}
      <AbsoluteFill style={{opacity: vid, transform: `scale(${1.22 - 0.16 * easeInOut(p01(t, 3, 6.5))}) translate(${-cam.x * 0.06}px, ${-cam.y * 0.03}px)`}}>
        <Sequence from={Math.round(3.0 * FPS)} layout="none">
          <OffthreadVideo src={img('hero-loop-m.mp4')} muted style={{width: W, height: H, objectFit: 'cover'}} />
        </Sequence>
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'linear-gradient(180deg,rgba(10,18,32,.55) 0%,rgba(10,18,32,.25) 35%,rgba(10,18,32,.72) 78%,rgba(10,18,32,.9) 100%)', opacity: vid}} />
      <AbsoluteFill style={{background: `radial-gradient(900px 900px at 50% ${42 + t}%, rgba(201,154,22,${0.22 * (1 - vid * 0.6)}), transparent 70%)`}} />
      <Dust cam={cam} t={t} seed={7} color="#E8C766" zRange={[-2600, 700]} count={150} />
      <World cam={cam}>
        {/* emblem lock-up */}
        <L p={EM1} opacity={solid * (1 - 0.7 * p01(t, 5.0, 0.9))} dof={false}>
          <div style={{transform: `scale(${1 + 0.06 * Math.sin(Math.PI * hit) * (1 - hit)})`}}>
            <Emblem width={560} sweep={easeInOut(p01(t, 2.3, 0.7))} drop={p01(t, 2.45, 0.6)} />
          </div>
        </L>
        <L p={[0, -110, 0]} opacity={p01(t, 2.7, 0.3) * (1 - 0.7 * p01(t, 5.0, 0.9))} dof={false}>
          <div style={{width: 640, height: 158, overflow: 'hidden', clipPath: `inset(0 0 0 ${(1 - easeInOut(p01(t, 2.7, 0.7))) * 100}%)`}}>
            <Img src={staticFile('brand/wordmark-gold.png')} style={{width: 640}} />
          </div>
        </L>
        {/* hero copy assembles in front of the camera as it pulls back */}
        <L p={[0, 116, 350]} opacity={p01(t, 3.45, 0.3)}>
          <Kicker text="قوانزو، الصين" color={C.kick} size={46} t={t} start={3.45} />
        </L>
        <L p={[0, 250, 400]}>
          <Words text="من مصانع الصين" t={t} start={3.6} size={150} color={C.white} />
        </L>
        <L p={[0, 447, 400]}>
          <Words text="إلى ميناء بلدك" t={t} start={3.95} size={150} color={C.white} />
        </L>
        <L p={[0, 686, 450]} opacity={clamp01(reveal(4.3) * 1.5)}>
          <div style={{transform: `translateY(${(1 - reveal(4.3)) * 80}px)`}}>
            <div dir="rtl" style={{display: 'flex', alignItems: 'center', gap: 20, height: 124, padding: '0 56px', borderRadius: 22, background: C.gold, color: C.white, fontFamily: AR, fontWeight: 600, fontSize: 46, boxShadow: '0 20px 60px rgba(201,154,22,.35)'}}>
              <Icon name="wa" size={48} color={C.white} />
              تواصل عبر واتساب
            </div>
          </div>
        </L>
        <L p={[0, 865, 450]} opacity={clamp01(reveal(4.45) * 1.5)}>
          <div style={{transform: `translateY(${(1 - reveal(4.45)) * 80}px)`}}>
            <div dir="rtl" style={{display: 'flex', alignItems: 'center', gap: 20, height: 124, padding: '0 56px', borderRadius: 22, border: '3px solid rgba(255,255,255,.55)', color: C.white, fontFamily: AR, fontWeight: 600, fontSize: 46}}>
              تعرّف على خدماتنا
            </div>
          </div>
        </L>
        {/* hero-bar features float in depth: the camera flies past them */}
        {CHIPS.map((c, i) => {
          const a = 4.9 + i * 0.55;
          const e = back(p01(t, a, 0.6));
          const side = c.p[0] > 0 ? 1 : -1;
          return (
            <L key={i} p={[c.p[0] + (1 - e) * side * 260, c.p[1], c.p[2]]} r={[0, -side * 14 * (1 - e) - side * 8, 0]} opacity={clamp01(e * 1.4)}>
              <Glass>
                <Icon name={c.icon} size={64} color={C.kick} />
                <span style={{fontFamily: AR, fontSize: 52, fontWeight: 600, color: C.white, whiteSpace: 'nowrap'}}>{c.ar}</span>
              </Glass>
            </L>
          );
        })}
        {/* the ports ticker becomes a ring the camera flies through: the gateway to Services */}
        <L p={HERO_RING.c} r={[0, 0, ringRot]} dof={false} opacity={p01(t, 6.2, 1.0)}>
          <div style={{position: 'relative', width: HERO_RING.r * 2, height: HERO_RING.r * 2}}>
            <div style={{position: 'absolute', inset: -10, borderRadius: '50%', border: `6px solid ${C.gold}`, boxShadow: `0 0 60px ${C.gold}, inset 0 0 60px rgba(201,154,22,.5)`}} />
            {PORTS.map((pt, i) => {
              const a = (i / PORTS.length) * 360;
              return (
                <div key={i} style={{position: 'absolute', left: '50%', top: '50%', transform: `rotate(${a}deg) translateY(${-HERO_RING.r - 70}px)`, transformOrigin: '0 0'}}>
                  <div style={{transform: 'translateX(-50%)', fontFamily: LAT, fontWeight: 600, fontSize: 40, letterSpacing: '0.16em', color: i % 2 ? C.kick : C.white, whiteSpace: 'nowrap'}}>{pt}</div>
                </div>
              );
            })}
          </div>
        </L>
      </World>
      {/* particles that build the emblem */}
      <ParticleEmblem cam={cam} t={t} center={EM1} width={560} start={0.05} land={2.75} fade={[2.6, 3.2]} />
      {/* lock flash */}
      <AbsoluteFill style={{background: `radial-gradient(circle at 50% 50%, rgba(255,240,200,${0.75 * (1 - hit) * (t >= 3 ? 1 : 0)}), transparent 60%)`}} />
    </AbsoluteFill>
  );
};
const portal1 = (t: number) => {
  const cam = camAt(k1, t);
  const q = project(cam, HERO_RING.c);
  return {x: q.x, y: q.y, r: HERO_RING.r * q.s};
};

// ═══════════════════════ SHOT 2 · services cube ═══════════════════════
const k2: Key[] = [
  {t: 0, x: 0, y: -40, z: 2700, rx: 0, ry: 0, rz: 0},
  {t: 1.0, x: 0, y: -20, z: 1620},
  {t: 1.9, x: 0, y: 0, z: 1330, rx: 0},
  {t: 2.8, x: 0, y: 0, z: 0, rx: -7, ry: 0},
  {t: 3.1, x: 0, y: 0, z: 0},
  {t: 3.7, x: 0, y: 0, z: 0, ry: -90},
  {t: 4.6, x: 0, y: -20, z: 0, ry: -180, rx: -9},
  {t: 5.2, x: 0, y: -40, z: 0},
  {t: 5.5, x: 0, y: -60, z: 0, ry: -270, rx: -6},
  {t: 6.0, x: 100, y: -225, rx: 0, ry: -270},
  {t: 7.0, x: 1000, y: -225, z: 0, rx: 0, ry: -270},
];
const subj2 = (t: number, cam: Cam): [number, number, number] => (t < 2.0 ? [0, 0, 1300] : [cam.x, cam.y, cam.z]);
const cam2 = (t: number) => {
  const c = camAt(k2, t);
  return {...withFocus(c, subj2(t, c)), aperture: t < 2.1 ? 0.01 : 0.007};
};
const FACE = {w: 480, h: 770, R: 262};
const SERVICES = [
  {n: '01', ar: 'خطوط الإنتاج', p: 'خطوط إنتاج كاملة لأي صناعة', img: 'sec-factory.jpg'},
  {n: '02', ar: 'المكائن الصناعية', p: 'مكائن منفردة وقطع غيار', img: 'g-plastics.jpg'},
  {n: '03', ar: 'الفحص والتوريد', p: 'صور وتقارير قبل الشحن', img: 'sec-seal.jpg'},
  {n: '04', ar: 'الشحن والمستندات', p: 'بحراً وجواً حتى ميناء بلدك', img: 'hero-ending.jpg'},
];

const ServiceCard: React.FC<{s: (typeof SERVICES)[number]; t: number}> = ({s, t}) => (
  <div style={{width: FACE.w, height: FACE.h, background: C.white, border: `2px solid ${C.line}`, borderRadius: 26, overflow: 'hidden', boxShadow: '0 30px 70px rgba(15,27,45,.12)', display: 'flex', flexDirection: 'column'}}>
    <div style={{width: FACE.w, height: FACE.w * 0.75, overflow: 'hidden'}}>
      <Img src={img(s.img)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.12 - 0.08 * Math.min(1, t / 7)})`}} />
    </div>
    <div dir="rtl" style={{padding: '30px 34px', fontFamily: AR}}>
      <div style={{fontFamily: LAT, fontWeight: 600, fontSize: 32, color: C.goldD}}>{s.n}</div>
      <div style={{fontWeight: 700, fontSize: 48, color: C.navy, lineHeight: 1.3, margin: '8px 0 10px'}}>{s.ar}</div>
      <div style={{fontWeight: 400, fontSize: 31, color: C.muted, lineHeight: 1.5}}>{s.p}</div>
    </div>
  </div>
);

const Shot2: React.FC = () => {
  const t = useT();
  const cam = cam2(t);
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <Dots cam={cam} />
      <AbsoluteFill style={{background: `radial-gradient(1200px 900px at 50% 45%, rgba(255,255,255,.9), transparent 70%)`}} />
      <World cam={cam}>
        {/* floor with the site's dotted texture and a gold orbit line */}
        <L p={[0, FACE.h / 2 + 90, 0]} r={[90, 0, 0]} dof={false}>
          <div style={{width: 3400, height: 3400, borderRadius: '50%', backgroundImage: 'radial-gradient(rgba(15,27,45,.14) 2.4px, transparent 3.4px)', backgroundSize: '44px 44px', WebkitMaskImage: 'radial-gradient(circle, #000 25%, transparent 68%)'}} />
        </L>
        <L p={[0, FACE.h / 2 + 88, 0]} r={[90, 0, t * 20]} dof={false}>
          <div style={{width: 1300, height: 1300, borderRadius: '50%', border: `4px solid ${C.gold}`, opacity: 0.55}} />
        </L>
        <L p={[0, FACE.h / 2 + 86, 0]} r={[90, 0, 0]} dof={false}>
          <div style={{width: 900, height: 900, borderRadius: '50%', background: 'radial-gradient(circle, rgba(15,27,45,.22), transparent 65%)'}} />
        </L>
        {/* section header: the camera flies through it into the cube */}
        <L p={[0, -330, 1300]} opacity={1 - p01(t, 2.3, 0.3)} backface={false}>
          <Kicker text="خدماتنا" color={C.goldD} size={44} t={t} start={0.05} />
        </L>
        <L p={[0, -150, 1300]} opacity={1 - p01(t, 2.3, 0.3)} backface={false}>
          <Words text="كل ما تحتاجه" t={t} start={0.15} size={128} color={C.navy} />
        </L>
        <L p={[0, 30, 1300]} opacity={1 - p01(t, 2.3, 0.3)} backface={false}>
          <Words text="للاستيراد من الصين" t={t} start={0.4} size={128} color={C.navy} />
        </L>
        <L p={[0, 230, 1300]} opacity={easeOut(p01(t, 0.8, 0.5)) * (1 - p01(t, 2.3, 0.3))} backface={false}>
          <div dir="rtl" style={{fontFamily: AR, fontSize: 46, color: C.muted, whiteSpace: 'nowrap'}}>جهة واحدة تتابع طلبك من أول عرض سعر حتى التسليم</div>
        </L>
        {/* four service cards fold into a box */}
        {SERVICES.map((s, i) => {
          const a = i * 90;
          const e = back(p01(t, 2.15 + i * 0.12, 0.7));
          const x = FACE.R * Math.sin((a * Math.PI) / 180);
          const z = FACE.R * Math.cos((a * Math.PI) / 180);
          return (
            <L key={i} p={[x, (1 - e) * 500, z]} r={[(1 - e) * 35, a, 0]} opacity={clamp01(e * 1.6)} backface={false} maxBlur={10}>
              <ServiceCard s={s} t={t} />
            </L>
          );
        })}
      </World>
    </AbsoluteFill>
  );
};
const PORTAL2_P: [number, number, number] = [-FACE.R, -FACE.h / 2 + (FACE.w * 0.75) / 2, 0];
const portal2 = (t: number) => {
  const q = project(camAt(k2, t), PORTAL2_P);
  return {x: q.x, y: q.y, r: 175 * q.s};
};

// ═══════════════════════ SHOT 3 · about + numbers ═══════════════════════
const STATS = [
  {v: 2, ar: 'طريقتا شحن', p: [250, 700, 0]},
  {txt: 'الكل', ar: 'أنواع خطوط الإنتاج', p: [-250, 700, 0]},
  {txt: 'العالم', ar: 'نصدر لكل الدول', p: [250, 1070, 0]},
  {v: 6, ar: 'خطوات عمل واضحة', p: [-250, 1070, 0], badge: true},
];
const BADGE: [number, number, number] = [-250, 1010, 0];
const k3: Key[] = [
  {t: 0, x: 0, y: -380, z: -840, rx: 0, ry: 0, rz: 0},
  {t: 1.5, x: 0, y: -60, z: 520, rx: 4, ry: -4},
  {t: 2.7, x: 0, y: 560, z: 330, rx: -5, ry: 3},
  {t: 4.0, x: -60, y: 860, z: 180, rx: -3, ry: 0},
  {t: 5.0, x: -250, y: 1010, z: -150, rx: 0, ry: 0},
  {t: 6.0, x: -250, y: 1010, z: -1500, rx: 0, ry: 0},
];
const subj3 = (t: number): [number, number, number] => (t < 1.0 ? [0, -380, 0] : t < 2.2 ? [0, 300, 150] : t < 4.4 ? [0, 880, 0] : BADGE);
const cam3 = (t: number) => ({...withFocus(camAt(k3, t), subj3(t)), aperture: 0.008});

const StatTile: React.FC<{s: (typeof STATS)[number]; t: number; start: number}> = ({s, t, start}) => {
  const c = easeOut(p01(t, start + 0.15, 0.9));
  const num = s.v !== undefined ? Math.round(c * s.v) : null;
  return (
    <div dir="rtl" style={{width: 470, height: 330, background: C.white, border: `2px solid ${C.line}`, borderRadius: 28, boxShadow: '0 24px 60px rgba(15,27,45,.10)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, fontFamily: AR}}>
      {s.badge ? (
        <div style={{width: 190, height: 190, borderRadius: '50%', background: C.goldL, color: C.goldD, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: LAT, fontWeight: 700, fontSize: 120}}>{num}</div>
      ) : num !== null ? (
        <div style={{fontFamily: LAT, fontWeight: 700, fontSize: 150, color: C.navy, lineHeight: 1.05}}>{num}</div>
      ) : (
        <div style={{fontWeight: 700, fontSize: 104, color: C.navy, lineHeight: 1.3, opacity: c, transform: `scale(${0.8 + 0.2 * back(c)})`}}>{s.txt}</div>
      )}
      <div style={{fontWeight: 500, fontSize: 44, color: C.muted}}>{s.ar}</div>
    </div>
  );
};

const Shot3: React.FC = () => {
  const t = useT();
  const cam = cam3(t);
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <Dots cam={cam} />
      <World cam={cam}>
        <L p={[0, -380, 0]} maxBlur={8}>
          <div style={{width: 1000, height: 750, borderRadius: 28, overflow: 'hidden', boxShadow: '0 30px 80px rgba(15,27,45,.18)'}}>
            <Img src={img('guangzhou.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.08 - 0.06 * Math.min(1, t / 6)})`}} />
          </div>
        </L>
        <L p={[250, -60, 60]} opacity={back(p01(t, 0.9, 0.6))}>
          <div dir="rtl" style={{display: 'flex', alignItems: 'center', gap: 14, background: C.white, borderRadius: 20, padding: '20px 30px', boxShadow: '0 16px 40px rgba(15,27,45,.14)', fontFamily: AR, fontWeight: 600, fontSize: 40, color: C.navy, transform: `scale(${0.7 + 0.3 * back(p01(t, 0.9, 0.6))})`}}>
            <Icon name="pin" size={44} color={C.gold} />
            مكتبنا في قوانزو
          </div>
        </L>
        <L p={[0, 150, 150]}>
          <Kicker text="من نحن" color={C.goldD} size={42} t={t} start={1.0} />
        </L>
        <L p={[0, 280, 150]}>
          <Words text="شريكك التجاري في قلب" t={t} start={1.15} size={92} color={C.navy} />
        </L>
        <L p={[0, 400, 150]}>
          <Words text="الصناعة الصينية" t={t} start={1.6} size={92} color={C.navy} />
        </L>
        {STATS.map((s, i) => {
          const st = 2.1 + i * 0.35;
          const e = back(p01(t, st, 0.7));
          return (
            <L key={i} p={[s.p[0], s.p[1], s.p[2] - (1 - e) * 700]} r={[(1 - e) * 50, (1 - e) * (s.p[0] > 0 ? -20 : 20), 0]} opacity={clamp01(e * 1.6)}>
              <StatTile s={s} t={t} start={st} />
            </L>
          );
        })}
      </World>
    </AbsoluteFill>
  );
};
const portal3 = (t: number) => {
  const q = project(camAt(k3, t), BADGE);
  return {x: q.x, y: q.y, r: 95 * q.s};
};

// ═══════════════════════ SHOT 4 · production lines → shipping → steps ═══════════════════════
const LINES = [
  {ar: 'تعبئة المياه والعصائر', p: 'نفخ، تعبئة، تغطية، ملصقات', img: 'g-bottling.jpg'},
  {ar: 'التغليف والتعبئة', p: 'أكياس، كراتين، تغليف حراري', img: 'g-packaging.jpg'},
  {ar: 'البلاستيك', p: 'حقن، بثق، إعادة تدوير', img: 'g-plastics.jpg'},
  {ar: 'مواد البناء', p: 'طابوق، بلوك، إنترلوك', img: 'g-blocks.jpg'},
  {ar: 'الصناعات الغذائية', p: 'سناكس، معكرونة، حلويات، ألبان', img: 'g-food.jpg'},
  {ar: 'الورق والمناديل', p: 'مناديل، رولات، أكواب ورقية', img: 'g-paper.jpg'},
  {ar: 'المعادن والتشغيل', p: 'CNC، ليزر، تشكيل الصاج', img: 'g-metal.jpg'},
  {ar: 'المنظفات والكيماويات', p: 'سوائل، مساحيق، تعبئة وتغليف', img: 'g-chem.jpg'},
];
const MARKETS = ['اليمن', 'السعودية', 'الإمارات', 'عُمان', 'قطر', 'الكويت', 'البحرين', 'وكل دول العالم'];
const STEPS = ['طلبك', 'عروض المصانع', 'الاتفاق', 'الفحص', 'الشحن', 'الوصول'];
const TILE_Z0 = -1000, TILE_DZ = 570;
const SEA_Z = -5250, RING_Z = -5900, STEP_Z0 = -6250, WA: [number, number, number] = [0, 0, -7050];
const k4: Key[] = [
  {t: 0, x: 0, y: 0, z: 1500, rx: 0, ry: 0, rz: 0},
  {t: 0.9, x: 0, y: 0, z: 420, rz: 2},
  {t: 1.3, x: 30, y: 0, z: -250, rz: 6},
  {t: 3.0, x: -40, y: 0, z: -4300, rz: 18},
  {t: 3.6, x: 0, y: 0, z: -4950, rz: 8},
  {t: 4.0, x: 0, y: 0, z: -5800, rz: 0},
  {t: 4.5, x: 0, y: 0, z: -6750, rz: -4},
  {t: 5.0, x: 0, y: 0, z: -8350, rz: 0},
];
const cam4 = (t: number) => {
  const c = camAt(k4, t);
  return {...c, focus: P + 300, aperture: 0.006};
};

const Shot4: React.FC = () => {
  const t = useT();
  const cam = cam4(t);
  return (
    <AbsoluteFill style={{background: C.navy}}>
      <AbsoluteFill style={{background: `radial-gradient(900px 1300px at 50% 50%, ${C.navy2}, ${C.navy} 75%)`}} />
      <Dust cam={cam} t={t} seed={41} color="#E8C766" zRange={[-8000, 1200]} count={260} spread={1300} />
      <World cam={cam}>
        <L p={[0, -200, 0]}>
          <Kicker text="خطوط الإنتاج" color={C.kick} size={46} t={t} start={0.25} />
        </L>
        <L p={[0, -40, 0]}>
          <Words text="أي خط إنتاج تحتاجه" t={t} start={0.35} size={124} color={C.white} />
        </L>
        {LINES.map((l, i) => {
          const side = i % 2 === 0 ? 1 : -1;
          const z = TILE_Z0 - i * TILE_DZ;
          const y = [-280, 240, 300, -240][i % 4];
          return (
            <L key={i} p={[side * 420, y, z]} r={[0, -side * 32, 0]} maxBlur={8}>
              <div dir="rtl" style={{width: 560, background: C.navy2, borderRadius: 26, overflow: 'hidden', border: '1.5px solid rgba(255,255,255,.14)', boxShadow: '0 30px 80px rgba(0,0,0,.4)'}}>
                <Img src={img(l.img)} style={{width: 560, height: 400, objectFit: 'cover'}} />
                <div style={{padding: '26px 32px 32px', fontFamily: AR}}>
                  <div style={{fontWeight: 700, fontSize: 50, color: C.white, lineHeight: 1.3}}>{l.ar}</div>
                  <div style={{fontWeight: 400, fontSize: 34, color: 'rgba(255,255,255,.72)', marginTop: 6}}>{l.p}</div>
                </div>
              </div>
            </L>
          );
        })}
        {/* shipping */}
        <L p={[0, -330, SEA_Z]}>
          <Kicker text="الشحن" color={C.kick} size={46} t={t} start={3.0} />
        </L>
        <L p={[0, -160, SEA_Z]}>
          <Words text="بحراً وجواً" t={t} start={3.05} size={170} color={C.white} />
        </L>
        <L p={[-450, 330, SEA_Z - 250]} r={[0, 28, 0]}>
          <Img src={img('m-sea.jpg')} style={{width: 460, height: 571, objectFit: 'cover', borderRadius: 26}} />
        </L>
        <L p={[450, 330, SEA_Z - 250]} r={[0, -28, 0]}>
          <Img src={img('m-air.jpg')} style={{width: 460, height: 571, objectFit: 'cover', borderRadius: 26}} />
        </L>
        {/* markets ring */}
        <L p={[0, 0, RING_Z]} r={[0, 0, -t * 22]} dof={false}>
          <div style={{position: 'relative', width: 1100, height: 1100}}>
            <div style={{position: 'absolute', inset: 0, borderRadius: '50%', border: `5px solid ${C.gold}`, boxShadow: `0 0 50px ${C.gold}`}} />
            {MARKETS.map((m, i) => (
              <div key={i} style={{position: 'absolute', left: '50%', top: '50%', transform: `rotate(${(i / MARKETS.length) * 360}deg) translateY(-620px)`, transformOrigin: '0 0'}}>
                <div dir="rtl" style={{transform: 'translateX(-50%)', fontFamily: AR, fontWeight: 700, fontSize: 70, color: i === 7 ? C.kick : C.white, whiteSpace: 'nowrap'}}>{m}</div>
              </div>
            ))}
          </div>
        </L>
        {/* six clear steps spiral towards the light */}
        {STEPS.map((s, i) => {
          const a = (i / STEPS.length) * Math.PI * 2 + 0.6;
          return (
            <L key={i} p={[Math.cos(a) * 360, Math.sin(a) * 420, STEP_Z0 - i * 120]} maxBlur={6}>
              <div dir="rtl" style={{display: 'flex', alignItems: 'center', gap: 22}}>
                <div style={{width: 110, height: 110, borderRadius: '50%', background: C.goldL, color: C.goldD, fontFamily: LAT, fontWeight: 700, fontSize: 56, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{i + 1}</div>
                <div style={{fontFamily: AR, fontWeight: 700, fontSize: 60, color: C.white, whiteSpace: 'nowrap'}}>{s}</div>
              </div>
            </L>
          );
        })}
        {/* WhatsApp: the light at the end of the tunnel */}
        <L p={WA} dof={false} opacity={easeInOut(p01(t, 3.3, 0.7))}>
          <div style={{width: 600, height: 600, borderRadius: '50%', background: C.gold, boxShadow: `0 0 140px ${C.gold}`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <Icon name="wa" size={330} color={C.white} />
          </div>
        </L>
      </World>
    </AbsoluteFill>
  );
};
const portal4 = (t: number) => {
  const q = project(camAt(k4, t), WA);
  return {x: q.x, y: q.y, r: 300 * q.s};
};

// ═══════════════════════ SHOT 5 · call to action ═══════════════════════
const EM5: [number, number, number] = [0, -540, 0];
const BTN: [number, number, number] = [0, 385, 80];
const k5: Key[] = [
  {t: 0, x: 215, y: 385, z: -1150, rx: 0, ry: 0, rz: 0},
  {t: 0.6, x: 160, y: 330, z: -520, rx: 2, ry: -3},
  {t: 1.6, x: 20, y: 40, z: 180, rx: 4, ry: 7, rz: -1.5},
  {t: 2.7, x: 0, y: -10, z: 40, rx: 0, ry: 0, rz: 0},
  {t: 3.5, x: 0, y: -25, z: -60, rx: 0, ry: 0, rz: 0},
  {t: 4.45, x: 0, y: 980, z: 60, rx: -3, ry: 0, rz: 0},
  {t: 6.5, x: 0, y: 1020, z: -40, rx: 0, ry: 0, rz: 0},
];
const FINAL = cfg.finalHit - S.end[0];
const CRANE = cfg.contactCrane - S.end[0];
const CARD_Y = 1180;
const cam5 = (t: number) => ({...withFocus(camAt(k5, t), t < 1.2 ? BTN : t < CRANE + 0.4 ? [0, 0, 0] : [0, CARD_Y, 0]), aperture: 0.006});

/** The contact card the camera cranes down to: every way to reach the company, one row each. */
const ContactCard: React.FC<{t: number}> = ({t}) => {
  const card = back(p01(t, CRANE + 0.35, 0.7));
  return (
    <div
      dir="rtl"
      style={{
        width: 920, padding: '40px 54px', borderRadius: 30, background: 'rgba(23,40,65,.88)', border: '1.5px solid rgba(255,255,255,.14)',
        boxShadow: '0 40px 100px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.08)', opacity: clamp01(card * 1.5),
        transform: `scale(${0.9 + 0.1 * card}) translateY(${(1 - card) * 60}px)`, display: 'flex', flexDirection: 'column', gap: 6,
      }}
    >
      {cfg.contacts.map((c, i) => {
        const e = back(p01(t, CRANE + 0.6 + i * 0.13, 0.55));
        const ic = back(p01(t, CRANE + 0.55 + i * 0.13, 0.45));
        return (
          <div key={i} style={{display: 'flex', alignItems: 'center', gap: 30, height: 112, opacity: clamp01(e * 2), transform: `translateX(${(1 - e) * -90}px)`, borderTop: i ? '1px solid rgba(255,255,255,.08)' : undefined}}>
            <div style={{width: 84, height: 84, borderRadius: '50%', background: C.goldL, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', transform: `scale(${ic})`}}>
              <Icon name={c.icon} size={44} color={C.goldD} stroke={1.9} />
            </div>
            <div style={{display: 'flex', flexDirection: 'column', lineHeight: 1.15}}>
              <span style={{fontFamily: AR, fontWeight: 500, fontSize: 30, color: C.kick}}>{c.label}</span>
              <span dir="ltr" style={{fontFamily: LAT, fontWeight: 600, fontSize: 46, color: C.white, unicodeBidi: 'isolate', textAlign: 'right', letterSpacing: '0.01em'}}>{c.value}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const Shot5: React.FC = () => {
  const t = useT();
  const cam = cam5(t);
  const hit = p01(t, FINAL, 1.0);
  const settle = easeInOut(p01(t, FINAL - 0.65, 0.65));
  return (
    <AbsoluteFill style={{background: C.navy}}>
      <AbsoluteFill style={{background: `radial-gradient(1000px 1100px at 50% 40%, ${C.navy2}, ${C.navy} 72%)`}} />
      <Dust cam={cam} t={t + 30} seed={77} color="#E8C766" zRange={[-2500, 600]} count={120} />
      <World cam={cam}>
        {/* the footer's giant outlined ALPHA */}
        <L p={[0, 80, -1100]} dof={false} opacity={p01(t, 0.5, 1.2)}>
          <div style={{fontFamily: LAT, fontWeight: 700, fontSize: 520, letterSpacing: '0.06em', color: 'transparent', WebkitTextStroke: '2px rgba(232,199,102,.16)', transform: `translateX(${(1 - easeOut(p01(t, 0.5, 2))) * 200}px)`}}>ALPHA</div>
        </L>
        <L p={EM5} opacity={(1 - p01(t, CRANE + 0.15, 0.55)) * (settle)} dof={false}>
          <div style={{transform: `scale(${1 + 0.07 * Math.sin(Math.PI * hit) * (1 - hit)})`}}>
            <Emblem width={330} sweep={easeInOut(p01(t, FINAL - 0.7, 0.65))} drop={p01(t, FINAL - 0.55, 0.55)} />
          </div>
        </L>
        <L p={[0, -305, 0]} opacity={(1 - p01(t, CRANE + 0.15, 0.55)) * (p01(t, FINAL - 0.2, 0.3))} dof={false}>
          <div style={{width: 560, height: 139, overflow: 'hidden', clipPath: `inset(0 0 0 ${(1 - easeInOut(p01(t, FINAL - 0.2, 0.6))) * 100}%)`}}>
            <Img src={staticFile('brand/wordmark-gold.png')} style={{width: 560}} />
          </div>
        </L>
        <L p={[0, -110, 60]} opacity={(1 - p01(t, CRANE + 0.15, 0.55))}>
          <Words text="جاهز نبدأ مشروعك" t={t} start={FINAL + 0.05} size={104} color={C.white} />
        </L>
        <L p={[0, 25, 60]} opacity={(1 - p01(t, CRANE + 0.15, 0.55))}>
          <Words text="من قوانزو؟" t={t} start={FINAL + 0.4} size={104} color={C.kick} />
        </L>
        <L p={[0, 190, 40]} opacity={(1 - p01(t, CRANE + 0.15, 0.55)) * (easeOut(p01(t, FINAL + 0.75, 0.5)))}>
          <div dir="rtl" style={{fontFamily: AR, fontSize: 46, color: 'rgba(255,255,255,.86)', whiteSpace: 'nowrap'}}>أرسل لنا طلبك ونرد عليك بعرض واضح</div>
        </L>
        <L p={BTN} opacity={(1 - p01(t, CRANE + 0.15, 0.55))}>
          <div dir="rtl" style={{display: 'flex', alignItems: 'center', gap: 22, height: 132, padding: '0 64px', borderRadius: 24, background: C.gold, color: C.white, fontFamily: AR, fontWeight: 600, fontSize: 52, boxShadow: '0 24px 70px rgba(201,154,22,.45)'}}>
            <Icon name="wa" size={58} color={C.white} />
            راسلنا على واتساب
          </div>
        </L>
        <L p={[0, 545, 40]} opacity={(1 - p01(t, CRANE + 0.15, 0.55)) * (easeOut(p01(t, FINAL + 1.0, 0.6)))}>
          <div style={{fontFamily: LAT, fontWeight: 600, fontSize: 56, color: C.goldL, letterSpacing: '0.04em', transform: `translateY(${(1 - easeOut(p01(t, FINAL + 1.0, 0.6))) * 30}px)`}}>alphaglobalcargo.com</div>
        </L>
        {/* closing frame: compact lock-up above the contact card */}
        <L p={[0, 600, 0]} opacity={easeInOut(p01(t, CRANE + 0.5, 0.6))} dof={false}>
          <div dir="ltr" style={{display: 'flex', alignItems: 'center', gap: 30, transform: `translateY(${(1 - easeOut(p01(t, CRANE + 0.5, 0.7))) * 40}px)`}}>
            <Emblem width={150} sweep={easeInOut(p01(t, CRANE + 0.5, 0.6))} drop={p01(t, CRANE + 0.55, 0.5)} />
            <div style={{width: 3, height: 120, background: 'rgba(255,255,255,.22)'}} />
            <Img src={staticFile('brand/wordmark-gold.png')} style={{width: 330}} />
          </div>
        </L>
        <L p={[0, CARD_Y, 0]} dof={false}>
          <ContactCard t={t} />
        </L>
      </World>
      <ParticleEmblem cam={cam} t={t} center={EM5} width={330} start={0.15} land={FINAL - 0.05} fade={[FINAL - 0.4, FINAL + 0.1]} seed={3} rings={false} />
      <AbsoluteFill style={{background: `radial-gradient(circle at 50% 33%, rgba(255,236,170,${0.6 * (1 - hit) * (t >= FINAL ? 1 : 0)}), transparent 55%)`}} />
    </AbsoluteFill>
  );
};

// ═══════════════════════ portals + reel ═══════════════════════
/** The next shot is seen through `portal` (a ring, a card, a badge, a button) until it fills the frame. */
const Through: React.FC<{portal: (t: number) => {x: number; y: number; r: number}; offset: number; children: React.ReactNode}> = ({portal, offset, children}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS + offset;
  const q = portal(t);
  const r = Math.min(2400, Math.max(0, q.r));
  return (
    <AbsoluteFill style={{clipPath: `circle(${r.toFixed(1)}px at ${q.x.toFixed(1)}px ${q.y.toFixed(1)}px)`}}>
      {children}
    </AbsoluteFill>
  );
};

const seq = (a: number, b: number) => ({from: Math.round(a * FPS), durationInFrames: Math.round((b - a) * FPS)});

export const Reel3: React.FC = () => {
  const {fps} = useVideoConfig();
  const shots = [
    {C: Shot1, s: S.hero, portal: portal1},
    {C: Shot2, s: S.services, portal: portal2},
    {C: Shot3, s: S.about, portal: portal3},
    {C: Shot4, s: S.tunnel, portal: portal4},
    {C: Shot5, s: S.end, portal: null},
  ];
  return (
    <AbsoluteFill style={{background: C.navy}}>
      <Html5Audio src={staticFile('audio/reel3-score.wav')} />
      {shots.map((sh, i) => {
        const prev = shots[i - 1];
        const Comp = sh.C;
        // the shot plays alone after the previous portal closes; during it, it is seen through that portal
        return (
          <React.Fragment key={i}>
            <Sequence {...seq(sh.s[0] + (i ? PORTAL : 0), sh.s[1])}>
              <Shifted offset={i ? PORTAL : 0}>
                <Comp />
              </Shifted>
            </Sequence>
            {prev && (
              <Sequence {...seq(sh.s[0], sh.s[0] + PORTAL)}>
                <Through portal={prev.portal!} offset={sh.s[0] - prev.s[0]}>
                  <Comp />
                </Through>
              </Sequence>
            )}
          </React.Fragment>
        );
      })}
      {fps !== FPS && null}
    </AbsoluteFill>
  );
};

/** Lets a shot keep its own local clock when its Sequence starts late. */
const OffsetCtx = React.createContext(0);
const Shifted: React.FC<{offset: number; children: React.ReactNode}> = ({offset, children}) => <OffsetCtx.Provider value={offset}>{children}</OffsetCtx.Provider>;
