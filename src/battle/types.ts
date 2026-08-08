// ── AgentVerse core data model ────────────────────────────────────────────
// The whole app is: Grok execution events  →  BattleAction  →  BattleState.
// Get these types right and everything downstream (animation, voice, report) is easy.

/** Skills the agent can "cast", derived from which tool it calls. */
export type SkillKind =
  | 'intel_summon' // web_search / x_search  -> gather external info
  | 'forge'        // code_execution         -> build/run code
  | 'strike'       // a custom domain tool
  | 'focus';       // pure reasoning step, no tool

/** A single thing that happens in the fight. The event mapper produces these. */
export type BattleAction =
  | { type: 'narrate'; text: string }                                   // text-delta / speech
  | { type: 'cast'; skill: SkillKind; label: string; input?: unknown }  // tool-call
  | { type: 'hit'; damage: number; crit: boolean; note?: string }       // tool-result ok
  | { type: 'agent_hurt'; damage: number; reason: string }              // tool-result error / retry
  | { type: 'round_end' }                                               // step-finish
  | { type: 'victory'; summary: string; sources?: string[] }            // finish (ok)
  | { type: 'defeat'; reason: string };                                 // finish (error/aborted)

export interface Actor {
  name: string;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
}

export interface LogEntry {
  id: number;
  round: number;
  text: string;
  tone: 'info' | 'good' | 'bad' | 'crit';
}

export type Phase = 'idle' | 'fighting' | 'victory' | 'defeat';

export interface BattleState {
  phase: Phase;
  round: number;
  hero: Actor;   // the agent
  boss: Actor;   // the problem/task
  log: LogEntry[];
  lastAction: BattleAction | null; // components watch this to fire animations
  sources: string[];               // citations = "loot"
  reportSummary: string;
  answer: string;                  // the agent's real streamed answer (the useful output)
  streamDone: boolean;             // true once the SSE stream has fully ended
  skillUses: Record<SkillKind, number>; // how many times each skill was cast this run
}

/** Raw event shape we forward from the Vercel AI SDK fullStream over SSE. */
export interface StreamEvent {
  type: 'text-delta' | 'tool-call' | 'tool-result' | 'step-finish' | 'finish' | 'error';
  toolName?: string;
  textDelta?: string;
  input?: unknown;
  result?: unknown;
  isError?: boolean;
  sources?: string[];
  finishReason?: string;
  errorMessage?: string;
}
