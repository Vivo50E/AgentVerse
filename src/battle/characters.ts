// Holds the active hero/boss sprite sets + background for the battle.
// Defaults load from /sprites/manifest.json (the pre-generated asset set).
// The human-in-the-loop designer overrides `hero` (and optionally `boss`).
import { create } from 'zustand';
import type { AssetManifest, CharacterSprites } from './sprites';

interface CharState {
  hero: CharacterSprites | null;
  boss: CharacterSprites | null;
  defaultBoss: CharacterSprites | null;
  background: string | null;
  defaultBackground: string | null;
  loaded: boolean;
  setHero: (c: CharacterSprites) => void;
  setBoss: (c: CharacterSprites) => void;
  resetBoss: () => void;
  setBackground: (bg: string) => void;
  resetBackground: () => void;
  loadDefaults: () => Promise<void>;
}

export const useCharacters = create<CharState>((set, get) => ({
  hero: null,
  boss: null,
  defaultBoss: null,
  background: null,
  defaultBackground: null,
  loaded: false,
  setHero: (hero) => set({ hero }),
  setBoss: (boss) => set({ boss }),
  // Back to the manifest default boss (e.g. task-themed generation failed/timed out).
  resetBoss: () => set((s) => ({ boss: s.defaultBoss ?? s.boss })),
  setBackground: (background) => set({ background }),
  // Back to the manifest default (e.g. no theme match, or generation failed).
  resetBackground: () => set((s) => ({ background: s.defaultBackground ?? s.background })),
  loadDefaults: async () => {
    if (get().loaded) return;
    try {
      const m = (await (await fetch('/sprites/manifest.json')).json()) as AssetManifest;
      set({
        hero: get().hero ?? m.hero,
        boss: get().boss ?? m.boss,
        defaultBoss: m.boss,
        background: m.background,
        defaultBackground: m.background,
        loaded: true,
      });
    } catch (e) {
      console.error('failed to load sprite manifest', e);
    }
  },
}));
