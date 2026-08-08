// Holds the active hero/boss sprite sets + background for the battle.
// Defaults load from /sprites/manifest.json (the pre-generated asset set).
// The human-in-the-loop designer overrides `hero` (and optionally `boss`).
import { create } from 'zustand';
import type { AssetManifest, CharacterSprites } from './sprites';

interface CharState {
  hero: CharacterSprites | null;
  boss: CharacterSprites | null;
  background: string | null;
  loaded: boolean;
  setHero: (c: CharacterSprites) => void;
  setBoss: (c: CharacterSprites) => void;
  loadDefaults: () => Promise<void>;
}

export const useCharacters = create<CharState>((set, get) => ({
  hero: null,
  boss: null,
  background: null,
  loaded: false,
  setHero: (hero) => set({ hero }),
  setBoss: (boss) => set({ boss }),
  loadDefaults: async () => {
    if (get().loaded) return;
    try {
      const m = (await (await fetch('/sprites/manifest.json')).json()) as AssetManifest;
      set({
        hero: get().hero ?? m.hero,
        boss: get().boss ?? m.boss,
        background: m.background,
        loaded: true,
      });
    } catch (e) {
      console.error('failed to load sprite manifest', e);
    }
  },
}));
