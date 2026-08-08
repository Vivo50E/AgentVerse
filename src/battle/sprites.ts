// Shared sprite contract for the side-view JRPG battle.
// Sprites are transparent PNGs (one per pose), produced by the asset pipeline
// (scripts/spritePipeline.mjs) or the human-in-the-loop designer at runtime.
import type { BattleAction } from './types';

export type Pose = 'idle' | 'attack' | 'hurt' | 'cast';
export const POSES: Pose[] = ['idle', 'attack', 'hurt', 'cast'];

export interface CharacterSprites {
  name: string;
  /** pose -> image src (a /sprites/*.png path OR a data: URL from the designer). */
  poses: Record<Pose, string>;
  w: number;
  h: number;
}

export interface AssetManifest {
  hero: CharacterSprites;
  boss: CharacterSprites;
  background: string;
  poses: Pose[];
}

/**
 * Which pose a side should show for the latest battle action.
 * hit      = hero lands a blow  -> hero attacks, boss recoils
 * agent_hurt = agent takes damage -> boss attacks, hero recoils
 * cast     = hero casts a skill  -> hero cast pose
 */
export function poseForAction(a: BattleAction | null, side: 'hero' | 'boss'): Pose {
  if (!a) return 'idle';
  switch (a.type) {
    case 'cast':
      return side === 'hero' ? 'cast' : 'idle';
    case 'hit':
      return side === 'hero' ? 'attack' : 'hurt';
    case 'agent_hurt':
      return side === 'hero' ? 'hurt' : 'attack';
    default:
      return 'idle';
  }
}
