// Loadout store. Holds which gear is equipped and derives the hero's ability
// profile. The orchestrator wires real backend tools via:
//   useLoadout.getState().getEnabledTools()
import { create } from 'zustand';
import { CATALOG } from './catalog';
import type { PromptTier, ReasoningEffort, Stat, ToolId } from './types';
import { STATS } from './types';

const BASE_STAT = 15;
const MAX_STAT = 100;
const MIN_STAT = 0;

// A sensible starting kit: two search tools, the code forge, an autonomy sigil, and a reasoning crown.
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

// Reasoning gear (Grok-4.3 Crown, Multi-Agent Diadem, Logic Circlet, ...) maps
// to xAI's real reasoningEffort provider option — thresholds tuned so the
// default loadout (base 15 + Code Forge Hammer +4 + Expert Sigil +3 + Crown
// +34 = 56) lands on 'medium'.
function reasoningEffortForStat(reasoning: number): ReasoningEffort {
  if (reasoning >= 65) return 'high';
  if (reasoning >= 45) return 'medium';
  if (reasoning >= 25) return 'low';
  return 'none';
}

// Autonomy gear (Novice Scroll, Expert Sigil, Chain-of-Thought Rune, ...)
// scales how much self-verification/self-check instruction rides along in
// the agent's system prompt — see PROMPT_TIER_TEXT in server/index.ts.
function promptTierForStat(autonomy: number): PromptTier {
  if (autonomy >= 55) return 'selfVerify';
  if (autonomy >= 25) return 'stepByStep';
  return 'basic';
}

interface LoadoutStore {
  equipped: Record<string, boolean>;
  toggle: (id: string) => void;
  equip: (id: string) => void;
  unequip: (id: string) => void;
  stats: () => Record<Stat, number>;
  powerLevel: () => number;
  getEnabledTools: () => string[];
  getReasoningEffort: () => ReasoningEffort;
  getPromptTier: () => PromptTier;
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
  getReasoningEffort: () => reasoningEffortForStat(computeStats(get().equipped).reasoning),
  getPromptTier: () => promptTierForStat(computeStats(get().equipped).autonomy),
}));
