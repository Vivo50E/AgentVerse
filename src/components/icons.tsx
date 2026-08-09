// Self-authored inline SVG line-icons. Stroke follows `currentColor` so they
// inherit the button's text color; no external icon/font dependency.
import type { CSSProperties } from 'react';

interface IconProps {
  size?: number;
  style?: CSSProperties;
}

function Svg({ size = 16, style, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="square"
      strokeLinejoin="miter"
      style={{ display: 'block', flexShrink: 0, ...style }}
      aria-hidden
    >
      {children}
    </svg>
  );
}

/** Sparkle / wand — Design Hero. */
export function IconWand(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M5 19 L15 9" />
      <path d="M14 4 L15 7 L18 8 L15 9 L14 12 L13 9 L10 8 L13 7 Z" />
      <path d="M19 14 l.6 1.6 1.6.6 -1.6.6 -.6 1.6 -.6 -1.6 -1.6 -.6 1.6 -.6 Z" />
    </Svg>
  );
}

/** Skull — Design Boss. */
export function IconSkull(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M5 11 a7 7 0 0 1 14 0 v4 a2 2 0 0 1 -2 2 h-1 v3 h-8 v-3 h-1 a2 2 0 0 1 -2 -2 Z" />
      <circle cx="9" cy="11" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="15" cy="11" r="1.6" fill="currentColor" stroke="none" />
      <path d="M11 15 h2" />
    </Svg>
  );
}

/** Stacked cards / roster — Heroes. */
export function IconRoster(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="4" y="6" width="10" height="13" />
      <path d="M8 3 h10 a2 2 0 0 1 2 2 v11" />
      <path d="M7 10 h4 M7 13 h4" />
    </Svg>
  );
}

/** Toolbox / gear grid — Loadout. */
export function IconLoadout(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="3" y="8" width="18" height="12" />
      <path d="M9 8 V6 a2 2 0 0 1 2 -2 h2 a2 2 0 0 1 2 2 v2" />
      <path d="M3 13 h18" />
      <path d="M11 11 h2 v4 h-2 Z" />
    </Svg>
  );
}

/** Sliders — Settings. */
export function IconSettings(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M5 5 v14 M12 5 v14 M19 5 v14" />
      <rect x="3" y="8" width="4" height="3" fill="currentColor" stroke="none" />
      <rect x="10" y="13" width="4" height="3" fill="currentColor" stroke="none" />
      <rect x="17" y="7" width="4" height="3" fill="currentColor" stroke="none" />
    </Svg>
  );
}

/** Play triangle — Start Quest. */
export function IconPlay(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M7 5 L19 12 L7 19 Z" fill="currentColor" stroke="none" />
    </Svg>
  );
}

/** Crossed swords — Fighting / battle. */
export function IconSwords(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 4 L13 13 M13 9 L20 4 L19 8 L15 11" />
      <path d="M20 20 L13 13 M4 16 L9 16 M4 20 L8 20" />
      <path d="M4 4 L8 5 L5 8 Z" fill="currentColor" stroke="none" />
    </Svg>
  );
}

/** Book / scroll — Demo cases / Quest Board. */
export function IconBook(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 6 L4 19 L12 17 L20 19 L20 6 L12 4 Z" />
      <path d="M12 4 L12 17" />
      <path d="M8 8 L16 8" />
      <path d="M8 12 L14 12" />
    </Svg>
  );
}

/** Two overlapping heads — Friends. */
export function IconFriends(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20 v-1 a6 6 0 0 1 12 0 v1" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M15 20 v-1 a5 5 0 0 1 6.5 -4.7" />
    </Svg>
  );
}

/** Trophy — Leaderboard. */
export function IconTrophy(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M7 4 h10 v5 a5 5 0 0 1 -10 0 Z" />
      <path d="M7 5 H4 a1 1 0 0 0 -1 1 v1 a4 4 0 0 0 4 4" />
      <path d="M17 5 h3 a1 1 0 0 1 1 1 v1 a4 4 0 0 1 -4 4" />
      <path d="M12 14 v3 M9 20 h6 M9.5 17 h5" />
    </Svg>
  );
}

/** Pinned corkboard card — Quest Board / task hub. */
export function IconBoard(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="3" y="4" width="18" height="16" />
      <circle cx="12" cy="7" r="1" fill="currentColor" stroke="none" />
      <path d="M7 11 h10 M7 14 h10 M7 17 h6" />
    </Svg>
  );
}
