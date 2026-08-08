// Agent progression — "learn by doing". Completing quests grants XP and grows
// the stats the agent actually exercised (used web/x search -> Skills/Knowledge,
// ran code -> Reasoning/Prompt, ...). Leveling raises the agent's Power.
// Persisted globally (the current agent evolves across quests).
import { create } from 'zustand';
import type { Stat } from '../loadout/types';
import { STATS } from '../loadout/types';
import type { SkillKind } from '../battle/types';

const KEY = 'agentverse:progression';

export interface QuestSummary {
  skillUses: Record<SkillKind, number>;
  hpFrac: number; // hero HP remaining 0..1
  sources: number; // citations/loot found
  won: boolean;
}

export interface Award {
  xpGained: number;
  gains: Partial<Record<Stat, number>>;
  leveledUp: boolean;
  fromLevel: number;
  toLevel: number;
}

// How each cast skill trains the six axes (weights sum ~1 per skill).
const SKILL_GROWTH: Record<SkillKind, Partial<Record<Stat, number>>> = {
  intel_summon: { skills: 0.6, knowledge: 0.4 },
  forge: { reasoning: 0.5, prompt: 0.3, skills: 0.2 },
  strike: { skills: 1 },
  focus: { reasoning: 0.6, memory: 0.4 },
};

function zeroStats(): Record<Stat, number> {
  return STATS.reduce((o, s) => { o[s] = 0; return o; }, {} as Record<Stat, number>);
}

/** XP needed to go from `level` to the next. Grows each level. */
export function xpToNext(level: number): number {
  return 100 + (level - 1) * 80;
}

/** Active stats = equipment stats + learned growth, clamped to 100. */
export function combineStats(
  equip: Record<Stat, number>,
  growth: Record<Stat, number>,
): Record<Stat, number> {
  return STATS.reduce((o, s) => {
    o[s] = Math.min(100, (equip[s] ?? 0) + (growth[s] ?? 0));
    return o;
  }, {} as Record<Stat, number>);
}

export function powerOf(stats: Record<Stat, number>): number {
  return STATS.reduce((sum, s) => sum + stats[s], 0);
}

interface ProgState {
  level: number;
  xp: number; // toward next level
  growth: Record<Stat, number>;
  lastAward: Award | null;
  awardQuest: (s: QuestSummary) => Award;
  clearAward: () => void;
  reset: () => void;
}

interface Persisted { level: number; xp: number; growth: Record<Stat, number> }

function load(): Persisted {
  const empty: Persisted = { level: 1, xp: 0, growth: zeroStats() };
  if (typeof localStorage === 'undefined') return empty;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty;
    const p = JSON.parse(raw) as Partial<Persisted>;
    return {
      level: typeof p.level === 'number' ? p.level : 1,
      xp: typeof p.xp === 'number' ? p.xp : 0,
      growth: { ...zeroStats(), ...(p.growth ?? {}) },
    };
  } catch {
    return empty;
  }
}

function save(p: Persisted): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* ignore quota */
  }
}

// Convert this quest's activity into XP + learned stat growth.
function computeAward(s: QuestSummary): { xpGained: number; gains: Record<Stat, number> } {
  const xpGained =
    (s.won ? 100 : 30) + Math.round(s.hpFrac * 40) + s.sources * 8;

  // Weighted stat scores from what the agent actually used.
  const scores = zeroStats();
  let totalUses = 0;
  (Object.keys(s.skillUses) as SkillKind[]).forEach((k) => {
    const n = s.skillUses[k] || 0;
    totalUses += n;
    const w = SKILL_GROWTH[k] || {};
    for (const stat of STATS) scores[stat] += n * (w[stat] ?? 0);
  });

  const budget = (s.won ? 8 : 4) + Math.min(4, s.sources); // total growth points
  const gains = zeroStats();
  const scoreTotal = STATS.reduce((t, st) => t + scores[st], 0);
  if (scoreTotal > 0) {
    for (const st of STATS) gains[st] = Math.round((scores[st] / scoreTotal) * budget);
  }
  // Guarantee the agent grows a little even with no tool use.
  if (totalUses === 0) gains.reasoning += Math.max(1, Math.round(budget / 3));
  return { xpGained, gains };
}

export const useProgression = create<ProgState>((set, get) => ({
  ...load(),
  lastAward: null,

  awardQuest: (summary) => {
    const { xpGained, gains } = computeAward(summary);
    const growth = { ...get().growth };
    for (const st of STATS) growth[st] += gains[st];

    let level = get().level;
    let xp = get().xp + xpGained;
    const fromLevel = level;
    while (xp >= xpToNext(level)) {
      xp -= xpToNext(level);
      level += 1;
    }
    const award: Award = {
      xpGained,
      gains: Object.fromEntries(STATS.filter((s) => gains[s] > 0).map((s) => [s, gains[s]])),
      leveledUp: level > fromLevel,
      fromLevel,
      toLevel: level,
    };
    set({ level, xp, growth, lastAward: award });
    save({ level, xp, growth });
    return award;
  },

  clearAward: () => set({ lastAward: null }),

  reset: () => {
    const fresh = { level: 1, xp: 0, growth: zeroStats() };
    set({ ...fresh, lastAward: null });
    save(fresh);
  },
}));
