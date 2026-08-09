// Loadout / Equipment domain types. An AI agent is personified as an RPG hero
// whose six ability stats mirror the axes commonly used to evaluate agent
// capability (reasoning, planning, tool use, memory, knowledge, autonomy),
// shaped by the gear equipped in the EquipmentPanel.

export type Stat = 'tools' | 'planning' | 'knowledge' | 'autonomy' | 'memory' | 'reasoning';

export const STATS: Stat[] = ['tools', 'planning', 'knowledge', 'autonomy', 'memory', 'reasoning'];

export const STAT_LABELS: Record<Stat, string> = {
  tools: 'Tool Use',
  planning: 'Planning',
  knowledge: 'Knowledge',
  autonomy: 'Autonomy',
  memory: 'Memory',
  reasoning: 'Reasoning',
};

// Shown as hover text on the hexagon axes — what each axis actually measures,
// in the same terms used to evaluate real agent capability.
export const STAT_DESCRIPTIONS: Record<Stat, string> = {
  tools: 'Can the agent correctly call and chain external tools (web search, X search, code execution) to get things done?',
  planning: 'Can the agent break a task into an ordered strategy — sub-goals, sequencing — instead of acting greedily one step at a time?',
  knowledge: 'How much accurate world/domain knowledge the agent draws on to ground its answers.',
  autonomy: 'How much the agent verifies and self-corrects its own work without hand-holding — catching mistakes before they compound.',
  memory: 'How well the agent retains and recalls context across a long, multi-step run instead of losing track.',
  reasoning: 'Depth of multi-step logical inference the agent applies before acting — chain-of-thought quality.',
};

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

// Real, non-cosmetic effects derived from two of the six stats (see
// src/loadout/store.ts). Reasoning maps to xAI's reasoningEffort provider
// option; Autonomy scales how much self-verification/self-check instruction
// the agent's system prompt carries. Sent to the backend in src/agent/run.ts.
export type ReasoningEffort = 'none' | 'low' | 'medium' | 'high';
export type PromptTier = 'basic' | 'stepByStep' | 'selfVerify';

// toolId is present only on Tools gear that maps to a real backend tool.
export type ToolId = 'web_search' | 'x_search' | 'code_execution';

export interface EquipmentItem {
  id: string;
  name: string;
  category: Stat;
  icon: string;
  rarity: Rarity;
  bonuses: Partial<Record<Stat, number>>;
  toolId?: ToolId;
  /** RPG flavor text. */
  desc: string;
  /** Plain-English hover text: what equipping this ACTUALLY does. */
  use: string;
}
