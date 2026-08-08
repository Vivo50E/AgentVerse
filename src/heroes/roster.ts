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
  add: (sprites: CharacterSprites, name?: string) => void;
  remove: (id: string) => void;
  rename: (id: string, name: string) => void;
}

const STORAGE_KEY = 'agentverse:heroes';
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

export const useHeroRoster = create<RosterState>((set, get) => ({
  heroes: load(),

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
  },

  rename: (id, name) => {
    const clean = name.trim();
    const next = get().heroes.map((h) =>
      h.id === id ? { ...h, name: clean || h.name } : h,
    );
    set({ heroes: persist(next) });
  },
}));
