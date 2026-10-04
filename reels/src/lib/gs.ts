import gsap from 'gsap';
import {MorphSVGPlugin} from 'gsap/MorphSVGPlugin';

gsap.registerPlugin(MorphSVGPlugin);

/**
 * GSAP inside Remotion: nothing runs on GSAP's ticker. Eases are used as pure
 * functions and MorphSVG tweens are kept paused and *seeked* to a progress for
 * every frame, so each frame is deterministic and can be rendered in any order.
 */

type EaseFn = (t: number) => number;
const eases = new Map<string, EaseFn>();

export const ease = (name: string): EaseFn => {
  let e = eases.get(name);
  if (!e) {
    e = gsap.parseEase(name) as EaseFn;
    eases.set(name, e);
  }
  return e;
};

/** 0 → 1 between `start` and `start + dur` (frames), shaped by a GSAP ease. May overshoot (back/elastic). */
export const tw = (frame: number, start: number, dur: number, easeName = 'power3.inOut') => {
  const t = (frame - start) / dur;
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return ease(easeName)(t);
};

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const mix = (a: number, b: number, t: number) => a + (b - a) * Math.min(1, Math.max(0, t));

const morphs = new Map<string, {el: SVGPathElement; tween: gsap.core.Tween}>();

/** MorphSVG between two path strings at progress p (0..1). Tweens are cached per shape pair. */
export const morph = (from: string, to: string, p: number, shapeIndex: number | 'auto' = 'auto', type: 'linear' | 'rotational' = 'linear') => {
  if (p <= 0 || typeof document === 'undefined') return from;
  if (p >= 1) return to;
  const key = `${type}|${shapeIndex}|${from}|${to}`;
  let m = morphs.get(key);
  if (!m) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    el.setAttribute('d', from);
    const tween = gsap.to(el, {morphSVG: {shape: to, shapeIndex, type}, duration: 1, ease: 'none', paused: true});
    m = {el, tween};
    morphs.set(key, m);
  }
  m.tween.progress(p);
  return m.el.getAttribute('d') ?? from;
};

/** Morph along a chain of shapes; `seg` picks the pair, `p` the progress inside it. */
export const morphChain = (shapes: string[], seg: number, p: number) => {
  const i = Math.max(0, Math.min(shapes.length - 2, seg));
  return morph(shapes[i], shapes[i + 1], p);
};

/** Decaying camera shake from a list of hits [frame, strength]. */
export const shake = (frame: number, hits: [number, number][]) => {
  let x = 0, y = 0, r = 0;
  for (const [h, a] of hits) {
    const d = frame - h;
    if (d < 0 || d > 24) continue;
    const k = a * Math.exp(-d / 4.5);
    x += k * Math.sin(d * 2.3 + h);
    y += k * Math.cos(d * 1.9 + h * 0.7);
    r += k * 0.05 * Math.sin(d * 1.7 + h);
  }
  return {x, y, r};
};

/** Quick light flash after each hit. */
export const flash = (frame: number, hits: number[], len = 9) => {
  let v = 0;
  for (const h of hits) {
    const d = frame - h;
    if (d >= 0 && d < len) v = Math.max(v, Math.pow(1 - d / len, 2));
  }
  return v;
};

export {gsap};
