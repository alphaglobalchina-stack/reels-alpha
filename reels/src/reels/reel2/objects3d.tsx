import React, {useMemo} from 'react';
import {useThree} from '@react-three/fiber';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {landDots} from '../../components/Globe';
import {rand} from '../../lib/anim';
import {lerp, tw} from '../../lib/gs';
import {ICONS} from '../../lib/shapes';
import {at} from './fx';
import {StudioEnv, getFont, goldMaterial, svgShapes, useExtrudedText} from './three';

export const ANTON_FILE = 'fonts/anton-latin-400-normal.woff';

/** Full-frame transparent WebGL layer with studio lighting. */
export const Stage: React.FC<{children: React.ReactNode; fov?: number; z?: number; style?: React.CSSProperties}> = ({children, fov = 35, z = 10, style}) => (
  <ThreeCanvas
    width={1080}
    height={1920}
    style={{position: 'absolute', inset: 0, ...style}}
    camera={{fov, position: [0, 0, z], near: 0.1, far: 400}}
    gl={{antialias: true, alpha: true}}
  >
    <StudioEnv intensity={1.15} />
    <ambientLight intensity={0.25} />
    <directionalLight position={[4, 6, 8]} intensity={2.2} color="#FFE6B8" />
    <directionalLight position={[-6, -2, -4]} intensity={1.4} color="#9EC9FF" />
    {children}
  </ThreeCanvas>
);

const useGold = (rough = 0.2) => useMemo(() => goldMaterial(rough), [rough]);

/** Drifting gold dust in depth (parallax). */
export const Dust: React.FC<{f: number; count?: number; spread?: number; speed?: number; opacity?: number}> = ({f, count = 260, spread = 9, speed = 0.05, opacity = 0.9}) => {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (rand(i + 1) - 0.5) * spread;
      pos[i * 3 + 1] = (rand(i + 99) - 0.5) * spread * 1.8;
      pos[i * 3 + 2] = (rand(i + 333) - 0.5) * spread * 2;
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, [count, spread]);
  const mat = useMemo(() => new THREE.PointsMaterial({color: '#F2D27A', size: 0.035, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false}), [opacity]);
  return <points geometry={geo} material={mat} position={[0, 0, ((f * speed) % (spread * 2)) - spread * 0.2]} rotation={[0, f * 0.002, 0]} />;
};

/** Point light that sweeps across the scene → moving specular glints on the gold. */
export const Sweep: React.FC<{f: number; from: number; dur: number; y?: number; z?: number; intensity?: number}> = ({f, from, dur, y = 1, z = 3, intensity = 60}) => {
  const p = tw(f, from, dur, 'sine.inOut');
  return <pointLight position={[lerp(-5, 5, p), y, z]} intensity={intensity} distance={14} color="#FFF1D0" />;
};

// ── S2: gold "140TH" ──────────────────────────────────────────────────────────────
export const Gold140: React.FC<{f: number}> = ({f}) => {
  const font = getFont(ANTON_FILE);
  const g140 = useExtrudedText(font, '140', 1.62, 0.46, 0.05);
  const gTH = useExtrudedText(font, 'TH', 0.5, 0.18, 0.02);
  const gold = useGold(0.18);
  const s = at('one');
  const inP = tw(f, s - 6, 26, 'expo.out');
  const outP = tw(f, at('october') - 4, 14, 'power3.in');
  const wob = Math.sin(f / 22) * 0.12;
  return (
    <>
      <Sweep f={f} from={s} dur={70} y={2.4} />
      <group position={[0, lerp(1.7, 1.35, inP) + outP * 3.2, lerp(-34, 0, inP)]} rotation={[0.08 - outP * 0.6, lerp(-1.9, 0, inP) + wob * (1 - outP) + outP * 1.6, lerp(0.25, 0, inP)]}>
        {g140 && <mesh geometry={g140} material={gold} position={[-0.2, 0, 0]} />}
        {gTH && <mesh geometry={gTH} material={gold} position={[1.22, 0.5, 0]} />}
      </group>
      <Dust f={f} />
    </>
  );
};

// ── S4: field of 3D booths ────────────────────────────────────────────────────────
const COLS = 34;
const ROWS = 60;
const GAP = 0.6;
export const BoothField: React.FC<{f: number}> = ({f}) => {
  const {camera} = useThree();
  const s0 = at('sixty');
  const s1 = at('thousands');
  const s2 = at('every');

  const dark = useMemo(() => new THREE.MeshPhysicalMaterial({color: '#1B160E', metalness: 0.7, roughness: 0.32, clearcoat: 0.4}), []);
  const gold = useGold(0.22);
  const box = useMemo(() => {
    const g = new THREE.BoxGeometry(0.46, 1, 0.46);
    g.translate(0, 0.5, 0);
    return g;
  }, []);
  const n = COLS * ROWS;
  const lit = useMemo(() => Array.from({length: n}, (_, i) => rand(i + 17) < 0.09), [n]);
  const meshes = useMemo(() => {
    const a = new THREE.InstancedMesh(box, dark, n);
    const b = new THREE.InstancedMesh(box, gold, n);
    return [a, b];
  }, [box, dark, gold, n]);

  // camera path: high top-down → low glide → rise for "under one roof"
  const glide = tw(f, s1 - 8, 40, 'power2.inOut');
  const rise = tw(f, s2 + 6, 40, 'power2.in');
  const cy = lerp(lerp(16, 4.2, glide), 30, rise);
  const cz = lerp(lerp(7, 8.5, glide), 2, rise) - (f - s0) * 0.03;
  camera.position.set(Math.sin(f / 60) * 1.2, cy, cz);
  camera.lookAt(0, 0, lerp(lerp(-2, -10, glide), -4, rise) - (f - s0) * 0.03);

  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const one = new THREE.Vector3();
  const pos = new THREE.Vector3();
  let ai = 0;
  let bi = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const i = r * COLS + c;
      const x = (c - COLS / 2) * GAP;
      const z = -(r - 8) * GAP;
      const d = Math.hypot(c - COLS / 2, r - 8);
      const grow = tw(f, s0 - 6 + d * 0.7, 18, 'back.out(1.6)');
      const h = (0.18 + rand(i + 5) * 0.7 + (lit[i] ? 0.35 : 0)) * grow + 0.0001;
      pos.set(x, 0, z);
      one.set(1, h, 1);
      m.compose(pos, q, one);
      if (lit[i]) meshes[1].setMatrixAt(bi++, m);
      else meshes[0].setMatrixAt(ai++, m);
    }
  }
  meshes[0].count = ai;
  meshes[1].count = bi;
  meshes[0].instanceMatrix.needsUpdate = true;
  meshes[1].instanceMatrix.needsUpdate = true;

  const floor = useMemo(() => new THREE.MeshStandardMaterial({color: '#0B0906', metalness: 0.4, roughness: 0.6}), []);
  return (
    <>
      <fog attach="fog" args={['#07070A', 10, 46]} />
      <pointLight position={[0, 6, -6 - (f - s0) * 0.03]} intensity={90} distance={30} color="#FFD27A" />
      <primitive object={meshes[0]} />
      <primitive object={meshes[1]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -10]} material={floor}>
        <planeGeometry args={[80, 120]} />
      </mesh>
    </>
  );
};

// ── S5: flipping industry icons ───────────────────────────────────────────────────
const ICON_KEYS = ['chip', 'sofa', 'gear', 'bolt', 'trend'] as const;
export const IconFlip: React.FC<{f: number; times: number[]}> = ({f, times}) => {
  const gold = useGold(0.17);
  const geos = useMemo(
    () =>
      ICON_KEYS.map((k) => {
        const g = new THREE.ExtrudeGeometry(svgShapes(ICONS[k], 0.0062), {depth: 0.36, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.035, bevelSegments: 4, curveSegments: 14});
        g.center();
        return g;
      }),
    [],
  );
  const ring = useMemo(() => new THREE.TorusGeometry(1.32, 0.026, 16, 160), []);
  // flip: rotation goes 0 → π around each change; geometry swaps at the midpoint
  let rot = 0;
  let idx = 0;
  times.forEach((t, i) => {
    if (i === 0) return;
    const p = tw(f, t - 9, 10, 'power2.inOut');
    rot += p * Math.PI;
    if (p >= 0.5) idx = i;
  });
  const enter = tw(f, times[0] - 10, 18, 'back.out(1.6)');
  const out = tw(f, times[times.length - 1] + 26, 14, 'expo.in');
  return (
    <>
      <Sweep f={f} from={times[0] - 10} dur={times[times.length - 1] - times[0] + 30} y={1.8} z={3.5} intensity={70} />
      <group position={[0, 0.85, out * 9]} scale={enter} rotation={[Math.sin(f / 18) * 0.12, rot + Math.sin(f / 25) * 0.25 + (1 - enter) * -2, 0]}>
        <mesh geometry={geos[idx]} material={gold} />
      </group>
      <mesh geometry={ring} material={gold} position={[0, 0.85, -0.6]} rotation={[1.2 + Math.sin(f / 30) * 0.2, f / 40, 0]} scale={enter * (1 + out)} />
      <mesh geometry={ring} material={gold} position={[0, 0.85, -0.6]} rotation={[-0.9, f / 55, 0.4]} scale={enter * 1.12 * (1 + out)} />
      <Dust f={f} speed={0.12} />
    </>
  );
};

// ── S6: dotted gold globe ─────────────────────────────────────────────────────────
const toVec = (lon: number, lat: number, r: number) => {
  const phi = ((90 - lat) * Math.PI) / 180;
  const th = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th));
};
const GZ = [113.26, 23.13] as const;
const CITIES: [number, number][] = [
  [46.7, 24.7], [55.3, 25.2], [31.2, 30.0], [-0.1, 51.5], [-74, 40.7], [37.6, 55.75], [72.88, 19.07], [106.85, -6.2], [151.2, -33.9], [-46.6, -23.5], [3.38, 6.52], [139.7, 35.7],
];
export const GoldGlobe: React.FC<{f: number; start: number}> = ({f, start}) => {
  const {camera} = useThree();
  const R = 1.62;
  const dots = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pts = landDots();
    const pos = new Float32Array(pts.length * 3);
    pts.forEach(([lon, lat], i) => {
      const v = toVec(lon, lat, R);
      pos.set([v.x, v.y, v.z], i * 3);
    });
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  const dotMat = useMemo(() => new THREE.PointsMaterial({color: '#FFE3A0', size: 0.06, sizeAttenuation: true}), []);
  const body = useMemo(() => new THREE.MeshStandardMaterial({color: '#0E0A04', metalness: 0.2, roughness: 0.75, transparent: true, opacity: 0.88, envMapIntensity: 0.15}), []);
  const arcMat = useMemo(() => new THREE.MeshBasicMaterial({color: '#FFD978'}), []);
  const arcs = useMemo(
    () =>
      CITIES.map(([lon, lat]) => {
        const a = toVec(lon, lat, R);
        const b = toVec(GZ[0], GZ[1], R);
        const mid = a.clone().add(b).multiplyScalar(0.5);
        mid.setLength(R + a.distanceTo(b) * 0.45);
        const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
        return new THREE.TubeGeometry(curve, 64, 0.014, 6, false);
      }),
    [],
  );
  const ring = useMemo(() => new THREE.TorusGeometry(R * 1.12, 0.012, 8, 200), []);
  const gold = useGold(0.2);

  const inP = tw(f, start, 26, 'expo.out');
  const dive = tw(f, start + 46, 16, 'expo.in');
  camera.position.set(0, 0, lerp(10, 2.6, dive));
  camera.lookAt(0, lerp(0, -1.15, dive), 0);
  const spin = -2.0 + (f - start) * 0.018;
  return (
    <>
      <group position={[0, lerp(-6, -1.15, inP), 0]} rotation={[0.35, spin, 0]} scale={lerp(0.6, 1, inP)}>
        <mesh material={body}>
          <sphereGeometry args={[R * 0.985, 64, 64]} />
        </mesh>
        <points geometry={dots} material={dotMat} />
        {arcs.map((g, i) => {
          const p = tw(f, start + 6 + i * 2, 20, 'power2.inOut');
          const idx = g.index!.count;
          g.setDrawRange(0, Math.floor((idx * p) / 36) * 36);
          return <mesh key={i} geometry={g} material={arcMat} />;
        })}
      </group>
      <mesh geometry={ring} material={gold} position={[0, lerp(-6, -1.15, inP), 0]} rotation={[1.25, 0, 0.2]} />
      <Dust f={f} />
    </>
  );
};

// ── S10: 3D title ─────────────────────────────────────────────────────────────────
export const GoldTitle: React.FC<{f: number; start: number; out: number}> = ({f, start, out}) => {
  const font = getFont(ANTON_FILE);
  const gC = useExtrudedText(font, 'CANTON', 0.98, 0.3, 0.04);
  const gF = useExtrudedText(font, 'FAIR', 0.98, 0.3, 0.04);
  const gold = useGold(0.17);
  const a = tw(f, start - 4, 22, 'expo.out');
  const b = tw(f, start + 6, 22, 'expo.out');
  const o = tw(f, out, 16, 'power3.inOut');
  const wob = Math.sin(f / 26) * 0.1;
  return (
    <>
      <Sweep f={f} from={start} dur={90} y={2.5} z={3} intensity={80} />
      <group position={[0, lerp(1.3, 2.55, o), lerp(0, -2, o)]} scale={lerp(1, 0.58, o)} rotation={[0.06, wob, 0]}>
        {gC && <mesh geometry={gC} material={gold} position={[0, 0.6, lerp(-30, 0, a)]} rotation={[0, lerp(-1.6, 0, a), 0]} />}
        {gF && <mesh geometry={gF} material={gold} position={[0, -0.6, lerp(-30, 0, b)]} rotation={[0, lerp(1.6, 0, b), 0]} />}
      </group>
      <Dust f={f} />
    </>
  );
};
