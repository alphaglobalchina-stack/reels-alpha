import React from 'react';
import {AbsoluteFill} from 'remotion';

/** زخرفة سحاب صيني تقليدي (xiangyun) بشفافية 10% في زوايا الشاشة. */
const Cloud: React.FC = () => (
  <g fill="none" stroke="#FFDE00" strokeWidth={3} strokeLinecap="round">
    <path d="M14 92 C14 70 36 64 48 72 C50 48 84 42 96 58 C108 44 142 48 140 72 C160 68 174 82 162 96 Z" />
    <path d="M48 72 C38 58 52 46 62 54 C70 61 62 70 56 66" />
    <path d="M140 72 C132 58 146 48 154 56 C160 62 154 70 148 67" />
    <path d="M14 92 C2 92 -4 80 6 74" />
    <path d="M30 104 C60 112 120 112 150 104" />
    <path d="M44 114 C70 120 112 120 138 114" opacity={0.7} />
  </g>
);

const Cluster: React.FC<{size: number}> = ({size}) => (
  <svg width={size} height={size} viewBox="0 0 520 520">
    <defs>
      <pattern id="cloud-tile" width="190" height="140" patternUnits="userSpaceOnUse">
        <Cloud />
        <g transform="translate(95 70)">
          <Cloud />
        </g>
      </pattern>
      <radialGradient id="cloud-fade" cx="1" cy="0" r="1">
        <stop offset="0" stopColor="#fff" />
        <stop offset="1" stopColor="#000" />
      </radialGradient>
      <mask id="cloud-mask">
        <rect width="520" height="520" fill="url(#cloud-fade)" />
      </mask>
    </defs>
    <rect width="520" height="520" fill="url(#cloud-tile)" mask="url(#cloud-mask)" />
  </svg>
);

export const CloudPattern: React.FC<{size?: number; opacity?: number}> = ({size = 520, opacity = 0.1}) => (
  <AbsoluteFill style={{opacity, pointerEvents: 'none'}}>
    <div style={{position: 'absolute', top: 0, right: 0}}>
      <Cluster size={size} />
    </div>
    <div style={{position: 'absolute', bottom: 0, left: 0, transform: 'rotate(180deg)'}}>
      <Cluster size={size} />
    </div>
  </AbsoluteFill>
);
