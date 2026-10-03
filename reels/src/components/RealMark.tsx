import React from 'react';
import {Img, staticFile, useVideoConfig} from 'remotion';
import {easeInOut, easeOut, pop, prog} from '../lib/anim';

const MARK_A = 'brand/logo-mark-a.png';
const MARK_GOLD = 'brand/logo-mark-gold.png';

/**
 * The real ALPHA emblem (extracted from logo.png, never redrawn): the cream "A" drops in,
 * the gold swoosh sweeps through it, then a glint crosses both layers. `t` = local frame.
 */
export const RealMark: React.FC<{t: number; size?: number}> = ({t, size = 520}) => {
  const {fps} = useVideoConfig();
  const a = pop(t, fps, 4, 15, 90);
  const sweep = prog(t, 6, 24, easeInOut);
  const glint = prog(t, 40, 24, easeInOut);
  const maskGold = `linear-gradient(to top right, #000 ${sweep * 118 - 10}%, transparent ${sweep * 118 + 6}%)`;
  const glintBg = `linear-gradient(105deg, transparent ${glint * 160 - 60}%, rgba(255,250,225,0.95) ${glint * 160 - 40}%, transparent ${glint * 160 - 20}%)`;
  const layer = (src: string): React.CSSProperties => ({position: 'absolute', inset: 0, width: '100%', height: '100%'});
  return (
    <div style={{position: 'relative', width: size, height: size}}>
      <div style={{...layer(MARK_A), opacity: prog(t, 4, 10, easeOut), transform: `translate(${(1 - a) * -90}px, ${(1 - a) * -70}px) rotate(${(1 - a) * -12}deg) scale(${0.9 + 0.1 * a})`}}>
        <Img src={staticFile(MARK_A)} style={{width: '100%', height: '100%'}} />
      </div>
      <div style={{...layer(MARK_GOLD), WebkitMaskImage: maskGold, maskImage: maskGold, filter: 'drop-shadow(0 0 22px rgba(201,151,28,0.55))'}}>
        <Img src={staticFile(MARK_GOLD)} style={{width: '100%', height: '100%'}} />
      </div>
      {glint > 0 && glint < 1 &&
        [MARK_A, MARK_GOLD].map((src) => (
          <div
            key={src}
            style={{
              ...layer(src),
              background: glintBg,
              WebkitMaskImage: `url(${staticFile(src)})`,
              maskImage: `url(${staticFile(src)})`,
              WebkitMaskSize: '100% 100%',
              maskSize: '100% 100%',
              mixBlendMode: 'overlay',
            }}
          />
        ))}
    </div>
  );
};
