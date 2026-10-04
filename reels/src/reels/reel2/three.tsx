import React, {useEffect, useMemo, useState} from 'react';
import {useThree} from '@react-three/fiber';
import opentype from 'opentype.js';
import {continueRender, delayRender, staticFile} from 'remotion';
import * as THREE from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';

/** Image-based lighting so metal reads as metal (set synchronously: the canvas renders once per frame). */
export const StudioEnv: React.FC<{intensity?: number}> = ({intensity = 1}) => {
  const {gl, scene} = useThree();
  useMemo(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.035).texture;
    scene.environmentIntensity = intensity;
    pmrem.dispose();
  }, [gl, scene, intensity]);
  return null;
};

export const goldMaterial = (rough = 0.26) =>
  new THREE.MeshPhysicalMaterial({color: new THREE.Color('#E2B04A'), metalness: 1, roughness: rough, clearcoat: 0.6, clearcoatRoughness: 0.2});

export const darkGoldMaterial = () =>
  new THREE.MeshPhysicalMaterial({color: new THREE.Color('#8F6A10'), metalness: 1, roughness: 0.35});

// ── Asset registry: everything is loaded before any canvas mounts ─────────────────
const fonts = new Map<string, opentype.Font>();
const textures = new Map<string, THREE.Texture>();

export const preloadAssets = async (fontFiles: string[], textureFiles: string[]) => {
  await Promise.all([
    ...fontFiles.map(async (f) => {
      if (fonts.has(f)) return;
      const buf = await (await fetch(staticFile(f))).arrayBuffer();
      fonts.set(f, opentype.parse(buf));
    }),
    ...textureFiles.map(async (f) => {
      if (textures.has(f)) return;
      const t = await new THREE.TextureLoader().loadAsync(staticFile(f));
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      textures.set(f, t);
    }),
  ]);
};

/** Blocks the render until the given assets are in the registry. */
export const usePreload = (fontFiles: string[], textureFiles: string[]) => {
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender('3D assets'));
  useEffect(() => {
    preloadAssets(fontFiles, textureFiles)
      .then(() => setReady(true))
      .catch((e) => console.error(e))
      .finally(() => continueRender(handle));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return ready;
};

export const getFont = (f: string) => fonts.get(f) ?? null;
export const getTexture = (f: string) => textures.get(f) ?? null;

/** Glyph outlines → THREE.Shapes (centred on the origin, y up). */
export const textShapes = (font: opentype.Font, text: string, size: number, letterSpacing = 0) => {
  const path = new THREE.ShapePath();
  let x = 0;
  const glyphs = font.stringToGlyphs(text);
  glyphs.forEach((g, i) => {
    const gp = g.getPath(x, 0, size);
    for (const c of gp.commands) {
      if (c.type === 'M') path.moveTo(c.x, -c.y);
      else if (c.type === 'L') path.lineTo(c.x, -c.y);
      else if (c.type === 'Q') path.quadraticCurveTo(c.x1, -c.y1, c.x, -c.y);
      else if (c.type === 'C') path.bezierCurveTo(c.x1, -c.y1, c.x2, -c.y2, c.x, -c.y);
    }
    x += ((g.advanceWidth ?? 0) / font.unitsPerEm) * size + (i < glyphs.length - 1 ? letterSpacing : 0);
  });
  return path.toShapes();
};

export const useExtrudedText = (font: opentype.Font | null, text: string, size: number, depth: number, letterSpacing = 0) =>
  useMemo(() => {
    if (!font) return null;
    const geo = new THREE.ExtrudeGeometry(textShapes(font, text, size, letterSpacing), {
      depth,
      bevelEnabled: true,
      bevelThickness: depth * 0.18,
      bevelSize: size * 0.012,
      bevelSegments: 4,
      curveSegments: 10,
    });
    geo.computeBoundingBox();
    const b = geo.boundingBox!;
    geo.translate(-(b.max.x + b.min.x) / 2, -(b.max.y + b.min.y) / 2, -(b.max.z + b.min.z) / 2);
    return geo;
  }, [font, text, size, depth, letterSpacing]);

/** SVG path data (absolute M/L/C/Z, y down) → extrudable shapes centred at the origin. */
export const svgShapes = (d: string, scale: number) => {
  const path = new THREE.ShapePath();
  const tok = d.match(/[MLCZ]|-?\d*\.?\d+/g) ?? [];
  let i = 0;
  let cmd = '';
  const n = () => parseFloat(tok[i++]);
  while (i < tok.length) {
    if (/[MLCZ]/.test(tok[i])) cmd = tok[i++];
    if (cmd === 'M') path.moveTo((n() - 200) * scale, -(n() - 200) * scale);
    else if (cmd === 'L') path.lineTo((n() - 200) * scale, -(n() - 200) * scale);
    else if (cmd === 'C') {
      const a = [n(), n(), n(), n(), n(), n()];
      path.bezierCurveTo((a[0] - 200) * scale, -(a[1] - 200) * scale, (a[2] - 200) * scale, -(a[3] - 200) * scale, (a[4] - 200) * scale, -(a[5] - 200) * scale);
    } else if (cmd === 'Z') {
      cmd = '';
    } else i++;
  }
  // first sub-path is the silhouette; later sub-paths inside it become holes (evenodd), others own shapes
  const subs = path.subPaths.map((p) => p.getPoints(12));
  const inside = (pt: THREE.Vector2, poly: THREE.Vector2[]) => {
    let c = false;
    for (let a = 0, b = poly.length - 1; a < poly.length; b = a++) {
      if (poly[a].y > pt.y !== poly[b].y > pt.y && pt.x < ((poly[b].x - poly[a].x) * (pt.y - poly[a].y)) / (poly[b].y - poly[a].y) + poly[a].x) c = !c;
    }
    return c;
  };
  const shapes: THREE.Shape[] = [];
  const outer = new THREE.Shape(subs[0]);
  shapes.push(outer);
  subs.slice(1).forEach((s) => {
    if (inside(s[0], subs[0])) outer.holes.push(new THREE.Path(s));
    else shapes.push(new THREE.Shape(s));
  });
  return shapes;
};
