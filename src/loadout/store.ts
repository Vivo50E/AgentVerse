// Loadout store. Holds which gear is equipped and derives the hero's ability
// profile. The orchestrator wires real backend tools via:
//   useLoadout.getState().getEnabledTools()
import { create } from 'zustand';
import { CATALOG } from './catalog';
import type { Stat, ToolId } from './types';
import { STATS } from './types';

const BASE_STAT = 15;
const MAX_STAT = 100;
const MIN_STAT = 0;

// A sensible starting kit: two search skills, the forge, a prompt and a crown.
const DEFAULT_EQUIPPED = [
  'web-search-blade',
  'x-search-longbow',
  'code-forge-hammer',
  'expert-sigil',
  'grok-crown',
];

function initialEquipped(): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  for (const id of DEFAULT_EQUIPPED) map[id] = true;
  return map;
}

function computeStats(equipped: Record<string, boolean>): Record<Stat, number> {
  const out = {} as Record<Stat, number>;
  for (const s of STATS) out[s] = BASE_STAT;

  for (const item of CATALOG) {
    if (!equipped[item.id]) continue;
    for (const s of STATS) {
      const bonus = item.bonuses[s];
      if (bonus) out[s] += bonus;
    }
  }

  for (const s of STATS) {
    out[s] = Math.max(MIN_STAT, Math.min(MAX_STAT, out[s]));
  }
  return out;
}

function computeEnabledTools(equipped: Record<string, boolean>): ToolId[] {
  const seen = new Set<ToolId>();
  for (const item of CATALOG) {
    if (equipped[item.id] && item.toolId) seen.add(item.toolId);
  }
  return Array.from(seen);
}

interface LoadoutStore {
  equipped: Record<string, boolean>;
  toggle: (id: string) => void;
  equip: (id: string) => void;
  unequip: (id: string) => void;
  stats: () => Record<Stat, number>;
  powerLevel: () => number;
  getEnabledTools: () => string[];
}

export const useLoadout = create<LoadoutStore>((set, get) => ({
  equipped: initialEquipped(),

  toggle: (id) => set((s) => ({ equipped: { ...s.equipped, [id]: !s.equipped[id] } })),
  equip: (id) => set((s) => ({ equipped: { ...s.equipped, [id]: true } })),
  unequip: (id) => set((s) => ({ equipped: { ...s.equipped, [id]: false } })),

  stats: () => computeStats(get().equipped),
  powerLevel: () => {
    const st = computeStats(get().equipped);
    return STATS.reduce((sum, s) => sum + st[s], 0);
  },
  getEnabledTools: () => computeEnabledTools(get().equipped),
}));
