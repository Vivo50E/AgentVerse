// Loadout / Equipment domain types. An AI agent is personified as an RPG hero
// whose six ability stats are shaped by the gear equipped in the CharacterSheet.

export type Stat = 'skills' | 'mcp' | 'knowledge' | 'prompt' | 'memory' | 'reasoning';

export const STATS: Stat[] = ['skills', 'mcp', 'knowledge', 'prompt', 'memory', 'reasoning'];

export const STAT_LABELS: Record<Stat, string> = {
  skills: 'Skills',
  mcp: 'MCP',
  knowledge: 'Knowledge',
  prompt: 'Prompt',
  memory: 'Memory',
  reasoning: 'Reasoning',
};

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

// Real, non-cosmetic effects derived from two of the six stats (see
// src/loadout/store.ts). Reasoning maps to xAI's reasoningEffort provider
// option; Prompt scales how much chain-of-thought/self-check instruction the
// agent's system prompt carries. Sent to the backend in src/agent/run.ts.
export type ReasoningEffort = 'none' | 'low' | 'medium' | 'high';
export type PromptTier = 'basic' | 'stepByStep' | 'selfVerify';

// toolId is present only on Skills gear that maps to a real backend tool.
export type ToolId = 'web_search' | 'x_search' | 'code_execution';

export interface EquipmentItem {
  id: string;
  name: string;
  category: Stat;
  icon: string;
  rarity: Rarity;
  bonuses: Partial<Record<Stat, number>>;
  toolId?: ToolId;
  desc: string;
}
