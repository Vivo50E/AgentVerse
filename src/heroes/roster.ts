// Hero Roster — a persisted store of every hero the player designs, so they can
// browse past heroes and re-equip them. Persists to localStorage.
//
// Sprite poses are base64 data: URLs (~200KB each × 4 poses), so a full roster
// can approach localStorage's ~5MB budget. We therefore CAP the roster at
// MAX_HEROES and, on a quota error, keep evicting the oldest until the write
// fits. Every persist is wrapped so a failure never throws to a caller.
import { create } from 'zustand';
import type { CharacterSprites } from '../battle/sprites';

export interface SavedHero {
  id: string;
  name: string;
  sprites: CharacterSprites;
  createdAt: number;
}

interface RosterState {
  heroes: SavedHero[];
  /** Which saved hero (if any) should load in place of the built-in wizard on boot. */
  defaultHeroId: string | null;
  add: (sprites: CharacterSprites, name?: string) => void;
  remove: (id: string) => void;
  rename: (id: string, name: string) => void;
  setDefault: (id: string | null) => void;
  /** The saved hero's sprites, if a default is set — battle/characters.ts reads this on boot. */
  getDefaultSprites: () => CharacterSprites | null;
}

const STORAGE_KEY = 'agentverse:heroes';
const DEFAULT_KEY = 'agentverse:defaultHeroId';
const MAX_HEROES = 8;

function hasStorage(): boolean {
  try {
    return typeof localStorage !== 'undefined';
  } catch {
    return false;
  }
}

function load(): SavedHero[] {
  if (!hasStorage()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    // Keep only entries that look like SavedHero records.
    return parsed.filter(
      (h): h is SavedHero =>
        !!h &&
        typeof h === 'object' &&
        typeof (h as SavedHero).id === 'string' &&
        typeof (h as SavedHero).name === 'string' &&
        typeof (h as SavedHero).createdAt === 'number' &&
        !!(h as SavedHero).sprites,
    );
  } catch {
    return [];
  }
}

/**
 * Persist `heroes` to localStorage, dropping oldest entries until the write
 * fits within quota. Returns the list that was actually persisted (which may be
 * shorter than the input). Never throws.
 */
function persist(heroes: SavedHero[]): SavedHero[] {
  if (!hasStorage()) return heroes;
  // Newest first; oldest lives at the tail and is evicted first on quota errors.
  let candidate = heroes.slice(0, MAX_HEROES);
  while (candidate.length > 0) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(candidate));
      return candidate;
    } catch {
      // Likely a quota error — drop the oldest hero and retry.
      candidate = candidate.slice(0, candidate.length - 1);
    }
  }
  // Nothing fit (or repeated failures): try to clear so we don't keep stale data.
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  return candidate;
}

function newId(): string {
  try {
    return crypto.randomUUID?.() ?? String(Date.now());
  } catch {
    return String(Date.now());
  }
}

function loadDefaultId(): string | null {
  if (!hasStorage()) return null;
  try {
    return localStorage.getItem(DEFAULT_KEY);
  } catch {
    return null;
  }
}

function persistDefaultId(id: string | null): void {
  if (!hasStorage()) return;
  try {
    if (id) localStorage.setItem(DEFAULT_KEY, id);
    else localStorage.removeItem(DEFAULT_KEY);
  } catch {
    /* ignore */
  }
}

export const useHeroRoster = create<RosterState>((set, get) => ({
  heroes: load(),
  defaultHeroId: loadDefaultId(),

  add: (sprites, name) => {
    const hero: SavedHero = {
      id: newId(),
      name: (name && name.trim()) || sprites.name || 'Unnamed Hero',
      sprites,
      createdAt: Date.now(),
    };
    // Prepend (newest first), cap length, then persist. persist() may evict
    // further on quota errors, so we adopt whatever actually got saved.
    const next = [hero, ...get().heroes].slice(0, MAX_HEROES);
    set({ heroes: persist(next) });
  },

  remove: (id) => {
    const next = get().heroes.filter((h) => h.id !== id);
    set({ heroes: persist(next) });
    // A removed hero can't stay the default.
    if (get().defaultHeroId === id) {
      persistDefaultId(null);
      set({ defaultHeroId: null });
    }
  },

  rename: (id, name) => {
    const clean = name.trim();
    const next = get().heroes.map((h) =>
      h.id === id ? { ...h, name: clean || h.name } : h,
    );
    set({ heroes: persist(next) });
  },

  setDefault: (id) => {
    persistDefaultId(id);
    set({ defaultHeroId: id });
  },

  getDefaultSprites: () => {
    const { defaultHeroId, heroes } = get();
    if (!defaultHeroId) return null;
    return heroes.find((h) => h.id === defaultHeroId)?.sprites ?? null;
  },
}));
