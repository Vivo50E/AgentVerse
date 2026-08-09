// Shared sprite contract for the side-view JRPG battle.
// Sprites are transparent PNGs (one per pose), produced by the asset pipeline
// (scripts/spritePipeline.mjs) or the human-in-the-loop designer at runtime.
import type { BattleAction } from './types';

export type Pose = 'idle' | 'attack' | 'hurt' | 'cast';
export const POSES: Pose[] = ['idle', 'attack', 'hurt', 'cast'];

/**
 * A character's combat "effect archetype" — decided at design time (by the
 * design agent) so a knight fights with steel slashes, a mage with arcane
 * bolts, an archer with arrows, etc. Drives which VFX SpellFx renders.
 */
export type FxArchetype =
  | 'arcane'     // glowing magic bolts/runes
  | 'slash'      // steel blade arcs
  | 'arrow'      // physical projectiles
  | 'fire'       // burning embers/explosion
  | 'lightning'  // electric jagged bolts
  | 'nature'     // vines/leaves/growth
  | 'ice'        // frost shards/crystals (new)
  | 'poison'     // toxic clouds/acid splatter (new)
  | 'explosion'  // fiery blast/shockwave (new)
  | 'holy'       // radiant beams/golden particles (new)
  | 'shadow'     // dark tendrils/smoke (new)
  | 'beam';      // laser/plasma beam (new)

export const FX_ARCHETYPES: FxArchetype[] = [
  'arcane', 'slash', 'arrow', 'fire', 'lightning', 'nature',
  'ice', 'poison', 'explosion', 'holy', 'shadow', 'beam'
];

export interface FxProfile {
  archetype: FxArchetype;
}

export interface CharacterSprites {
  name: string;
  /** pose -> image src (a /sprites/*.png path OR a data: URL from the designer). */
  poses: Record<Pose, string>;
  w: number;
  h: number;
  /** Combat VFX archetype generated alongside the character (default: arcane). */
  fx?: FxProfile;
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
