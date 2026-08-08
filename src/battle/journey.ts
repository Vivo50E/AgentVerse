// Side-scrolling journey model: the agent workflow as a path of foe encounters.
// Hero position = battle progress; each waypoint is a foe (a big boss at the end).
import type { CharacterSprites } from './sprites';
import type { Phase } from './types';

export type FoeKind = 'foe' | 'miniboss' | 'boss';

export interface Waypoint {
  /** position along the path as a progress fraction 0..1 */
  at: number;
  kind: FoeKind;
  /** key into foes.json, or 'boss' to use the main boss sprite (the dragon) */
  foeKey: string;
  label: string;
}

// Positions mirror the QuestTrack milestones so the two stay in sync.
export const WAYPOINTS: Waypoint[] = [
  { at: 0.15, kind: 'foe', foeKey: 'foe-slime', label: 'Scouting' },
  { at: 0.4, kind: 'foe', foeKey: 'foe-goblin', label: 'Engaging' },
  { at: 0.65, kind: 'foe', foeKey: 'foe-wraith', label: 'Breakthrough' },
  { at: 0.9, kind: 'miniboss', foeKey: 'foe-golem', label: 'Final Strike' },
  { at: 1.0, kind: 'boss', foeKey: 'boss', label: 'The Problem' },
];

/** Overall journey progress 0..1 from battle state (same rule as QuestTrack). */
export function computeProgress(phase: Phase, bossHp: number, bossMaxHp: number): number {
  if (phase === 'idle') return 0;
  if (phase === 'victory') return 1;
  if (bossMaxHp <= 0) return 0;
  return Math.max(0, Math.min(1, 1 - bossHp / bossMaxHp));
}

export type FoeStatus = 'pending' | 'active' | 'cleared';

/** A small epsilon so a foe is "cleared" only once the hero is essentially on it. */
export function foeStatus(index: number, progress: number): FoeStatus {
  const wp = WAYPOINTS[index];
  if (progress >= wp.at - 0.001) return 'cleared';
  const prevAt = index === 0 ? 0 : WAYPOINTS[index - 1].at;
  if (progress >= prevAt - 0.001) return 'active'; // hero is travelling toward it
  return 'pending';
}

export interface FoeSprites {
  poses: CharacterSprites['poses'];
  w: number;
  h: number;
}

/** Load the generated foe sprite table (public/sprites/foes.json). */
export async function loadFoes(): Promise<Record<string, FoeSprites>> {
  try {
    return (await (await fetch('/sprites/foes.json')).json()) as Record<string, FoeSprites>;
  } catch (e) {
    console.error('failed to load foes.json', e);
    return {};
  }
}

/** Relative sprite scale by foe kind — normal foes stand comparable to the hero,
 *  minibosses are clearly bigger, and the final boss looms large. Applied to a
 *  base of ~0.5*viewportHeight in the stage. */
export const KIND_SCALE: Record<FoeKind, number> = { foe: 0.85, miniboss: 1.2, boss: 1.7 };
