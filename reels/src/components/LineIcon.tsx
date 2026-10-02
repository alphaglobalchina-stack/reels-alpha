import React from 'react';
import * as lucide from 'lucide';
import {theme} from '../theme';
import {clamp01} from '../lib/anim';

export type IconNode = readonly (readonly [string, Record<string, string | number>])[];

// Hand-drawn extras (lucide ships no brand icons).
const instagram: IconNode = [
  ['rect', {x: 3, y: 3, width: 18, height: 18, rx: 5}],
  ['circle', {cx: 12, cy: 12, r: 4}],
  ['path', {d: 'M17.4 6.6h.01'}],
];
const whatsapp: IconNode = [
  ['path', {d: 'M3.2 20.8l1.3-4.6A8.8 8.8 0 1 1 8 19.6z'}],
  ['path', {d: 'M9 8.6c0 3.2 3.2 6.4 6.4 6.4l1.1-1.3-2-1-.9.8c-.9-.4-1.9-1.4-2.3-2.3l.8-.9-1-2z'}],
];

const L = lucide as unknown as Record<string, IconNode>;
export const icons = {
  factory: L.Factory,
  search: L.Search,
  handshake: L.Handshake,
  tag: L.Tag,
  ship: L.Ship,
  plane: L.Plane,
  package: L.Package,
  pin: L.MapPin,
  mail: L.Mail,
  globe: L.Globe,
  check: L.Check,
  clipboard: L.ClipboardCheck,
  container: L.Container,
  phone: L.Phone,
  scan: L.ScanLine,
  boxes: L.Boxes,
  badge: L.BadgeCheck,
  whatsapp,
  instagram,
} as const;
export type IconName = keyof typeof icons;

/**
 * Gold line icon with a stroke-dashoffset draw-on. `progress` 0→1 draws every
 * stroke of the icon one after another.
 */
export const LineIcon: React.FC<{
  name?: IconName;
  node?: IconNode;
  progress: number;
  size?: number;
  color?: string;
  strokeWidth?: number;
  glow?: number;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  viewBox?: string;
}> = ({name, node, progress, size = 120, color = theme.colors.gold, strokeWidth = 1.5, glow = 0.5, style, children, viewBox = '0 0 24 24'}) => {
  const n = node ?? icons[name!];
  const count = n.length;
  const overlap = 0.55; // each stroke starts before the previous one ends
  const span = 1 / (1 + (count - 1) * (1 - overlap));
  return (
    <svg
      viewBox={viewBox}
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{overflow: 'visible', filter: glow ? `drop-shadow(0 0 ${size * 0.06}px ${theme.colors.gold}${Math.round(glow * 255).toString(16).padStart(2, '0')})` : undefined, ...style}}
    >
      {n.map(([tag, attrs], i) => {
        const start = i * (1 - overlap) * span;
        const local = clamp01((progress - start) / span);
        return React.createElement(tag, {
          key: i,
          ...attrs,
          pathLength: 1,
          strokeDasharray: 1,
          strokeDashoffset: 1 - local,
          opacity: local > 0.001 ? 1 : 0,
        });
      })}
      {children}
    </svg>
  );
};
