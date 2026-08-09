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
  | { type: 'cast'; skill: SkillKind; label: string; tool?: string; input?: unknown } // tool-call
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

/** A real agent-execution step (the observability view behind the RPG flavor). */
export interface FlowStep {
  id: number;
  kind: 'tool' | 'finish' | 'error';
  tool?: string;        // real tool name (web_search / x_search / code_execution)
  label: string;        // human-readable step label
  status: 'running' | 'ok' | 'error';
  detail?: string;      // e.g. query/input summary or result note
}

export interface BattleState {
  phase: Phase;
  round: number;
  hero: Actor;   // the agent
  boss: Actor;   // the problem/task
  log: LogEntry[];
  flow: FlowStep[];                // real agent execution steps (Agent Flow view)
  lastAction: BattleAction | null; // components watch this to fire animations
  sources: string[];               // citations = "loot"
  reportSummary: string;
  answer: string;                  // the agent's real streamed answer (the useful output)
  streamDone: boolean;             // true once the SSE stream has fully ended
  skillUses: Record<SkillKind, number>; // how many times each skill was cast this run

  // Dynamic horizontal tree — nodes revealed per real agent step (cast/round).
  // Unknown nodes show as "?" until the step completes.
  treeRoot: TreeNode | null;
  currentTreePath: number[]; // node ids from root to current active leaf
}

export interface TreeNode {
  id: number;
  round: number;
  label: string;           // e.g. "Intel Summon ⚡", "sumArray fixed ✓", "3 citations found"
  icon: string;            // emoji or skill symbol
  type: 'start' | 'tool' | 'result' | 'boss';
  tool?: string;
  status: 'unknown' | 'revealed' | 'active' | 'completed';
  detail?: string;         // result summary, error message, citation count, etc.
  children: TreeNode[];
  x?: number;              // computed layout position (horizontal tree)
  y?: number;
}

/** Raw event shape we forward from the Vercel AI SDK fullStream over SSE. */
export interface StreamEvent {
  type: 'text-delta' | 'tool-call' | 'tool-result' | 'step-finish' | 'finish' | 'error' | 'paused';
  toolName?: string;
  textDelta?: string;
  input?: unknown;
  result?: unknown;
  isError?: boolean;
  sources?: string[];
  finishReason?: string;
  errorMessage?: string;
  /** Only on 'paused' — the HITL run.ts (§7e) needs it to call /api/run/continue. */
  sessionId?: string;
}
