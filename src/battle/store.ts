// The battle state machine. Applies BattleActions to state; React components
// subscribe and animate off `lastAction` / actor HP.
import { create } from 'zustand';
import type { BattleAction, BattleState, TreeNode } from './types';

let logId = 0;

function freshActor(name: string, hp: number, mp: number) {
  return { name, hp, maxHp: hp, mp, maxMp: mp };
}

function initialState(): Omit<BattleState, never> {
  const root: TreeNode = {
    id: 0,
    round: 0,
    label: 'Quest Start',
    icon: '🚩',
    type: 'start',
    status: 'completed',
    children: [],
  };

  return {
    phase: 'idle',
    round: 0,
    hero: freshActor('Agent Grok', 100, 60),
    boss: freshActor('The Problem', 120, 0),
    log: [],
    flow: [],
    lastAction: null,
    sources: [],
    reportSummary: '',
    answer: '',
    streamDone: false,
    skillUses: { intel_summon: 0, forge: 0, strike: 0, focus: 0 },
    treeRoot: root,
    currentTreePath: [0],
  };
}

let flowId = 0;

interface Store extends BattleState {
  start: (bossName?: string, heroName?: string) => void;
  apply: (action: BattleAction) => void;
  endStream: () => void;
  reset: () => void;
  getTree: () => TreeNode | null;
  getCurrentPath: () => number[];
}

export const useBattle = create<Store>((set, get) => ({
  ...initialState(),

  start: (bossName, heroName) => {
    const s = initialState();
    // Task-themed boss generation (plan.md §7d) may have already renamed the
    // boss sprite before the quest starts — carry that name into the actor.
    if (bossName) s.boss = { ...s.boss, name: bossName };
    // Carry the currently-equipped hero sprite's name (e.g. a designed/roster
    // hero like "Ani") into the actor, instead of the generic "Agent Grok".
    if (heroName) s.hero = { ...s.hero, name: heroName };
    return set({
      ...s, 
      phase: 'fighting', 
      round: 1,
      treeRoot: s.treeRoot,
      currentTreePath: [0]
    });
  },

  endStream: () => set({ streamDone: true }),

  reset: () => set(initialState()),

  // Use zustand's `get` (not the store var) so the initializer doesn't
  // self-reference — that self-reference made `useBattle` implicitly `any` and
  // cascaded implicit-any errors across every component selector.
  getTree: () => get().treeRoot,
  getCurrentPath: () => get().currentTreePath,

  apply: (action) =>
    set((s) => {
      const log = [...s.log];
      const push = (text: string, tone: 'info' | 'good' | 'bad' | 'crit') =>
        log.push({ id: ++logId, round: s.round, text, tone });

      let hero = { ...s.hero };
      let boss = { ...s.boss };
      let phase = s.phase;
      let round = s.round;
      let sources = s.sources;
      let reportSummary = s.reportSummary;
      let answer = s.answer;
      const skillUses = { ...s.skillUses };
      // Real agent-execution trace (Agent Flow view). Mirrors the RPG log but in
      // plain observability terms: which tool ran, and whether it succeeded.
      const flow = [...s.flow];
      let treeRoot = s.treeRoot ? JSON.parse(JSON.stringify(s.treeRoot)) as TreeNode : null;
      let currentTreePath = [...s.currentTreePath];

      const resolveLastRunning = (status: 'ok' | 'error', detail?: string) => {
        for (let i = flow.length - 1; i >= 0; i--) {
          if (flow[i].status === 'running') {
            flow[i] = { ...flow[i], status, detail: detail ?? flow[i].detail };
            return;
          }
        }
      };

      // Helper to add/reveal next node in the horizontal tree on each cast/result
      const addTreeNode = (label: string, icon: string, type: TreeNode['type'], tool?: string, detail?: string) => {
        if (!treeRoot) return;

        let current = treeRoot;
        for (let i = 1; i < currentTreePath.length; i++) {
          const next = current.children.find(c => c.id === currentTreePath[i]);
          if (next) current = next;
        }

        const newNode: TreeNode = {
          id: Date.now(),
          round: round,
          label,
          icon,
          type,
          tool,
          status: 'active',
          detail,
          children: [],
        };

        // Reveal any "?" children first, otherwise append new
        const unknownChild = current.children.find(c => c.status === 'unknown');
        if (unknownChild) {
          unknownChild.label = label;
          unknownChild.icon = icon;
          unknownChild.type = type;
          unknownChild.tool = tool;
          unknownChild.detail = detail;
          unknownChild.status = 'active';
          currentTreePath.push(unknownChild.id);
        } else {
          current.children.push(newNode);
          currentTreePath.push(newNode.id);
        }
      };

      switch (action.type) {
        case 'narrate':
          // The streamed text IS the agent's real answer — accumulate it as the
          // useful deliverable instead of spamming the battle log with fragments.
          answer += action.text;
          break;
        case 'cast': {
          hero.mp = Math.max(0, hero.mp - 8);
          skillUses[action.skill] = (skillUses[action.skill] ?? 0) + 1;
          push(`✦ ${hero.name} casts ${action.label}`, 'good');

          // Reveal next node in the horizontal tree on every real agent step
          const icon = action.skill === 'intel_summon' ? '⚡' 
                      : action.skill === 'forge' ? '🔨' : '🔍';
          addTreeNode(
            action.label || (action.tool ? `${action.tool} call` : 'Step'),
            icon,
            'tool',
            action.tool,
            typeof (action.input as any)?.query === 'string' 
              ? (action.input as any).query 
              : undefined
          );

          // Real flow: a tool call is now in flight.
          const q = typeof (action.input as { query?: unknown })?.query === 'string'
            ? (action.input as { query: string }).query
            : undefined;
          flow.push({
            id: ++flowId,
            kind: 'tool',
            tool: action.tool,
            label: action.tool ? `Called ${action.tool}` : action.label,
            status: 'running',
            detail: q,
          });
          // Rounds track tool-call activity, not the rare/unreliable step-finish
          // event (some models emit at most one per run).
          round = s.round + 1;
          break;
        }
        case 'hit':
          boss.hp = Math.max(0, boss.hp - action.damage);
          resolveLastRunning('ok', 'returned results');

          // Update the current tree node from "active" to "completed"
          if (treeRoot && currentTreePath.length > 0) {
            let node = treeRoot;
            for (let i = 1; i < currentTreePath.length; i++) {
              const child = node.children.find(c => c.id === currentTreePath[i]);
              if (child) node = child;
            }
            if (node.status === 'active') {
              node.status = 'completed';
              node.detail = action.note || 'Success';
              // Add a result child node (the "loot" or outcome)
              node.children.push({
                id: Date.now() + 1,
                round: round,
                label: action.note || 'Result',
                icon: '✅',
                type: 'result',
                status: 'completed',
                detail: 'Tool returned valuable data',
                children: [],
              });
            }
          }

          push(
            `${action.crit ? '💥 CRIT! ' : ''}${action.note ?? 'hit'} — ${action.damage} dmg`,
            action.crit ? 'crit' : 'good',
          );
          // Boss slain by this blow → declare victory now, instead of waiting for
          // the trailing narration stream + finish event (which felt laggy).
          if (boss.hp === 0 && phase === 'fighting') {
            phase = 'victory';
            reportSummary = 'The problem is solved. Boss down!';
            push('🏆 VICTORY — boss defeated!', 'crit');
          }
          break;
        case 'agent_hurt':
          hero.hp = Math.max(0, hero.hp - action.damage);
          resolveLastRunning('error', action.reason);
          push(`⚠ ${action.reason} (-${action.damage})`, 'bad');
          break;
        case 'round_end':
          // no-op: round count now derives from 'cast' (tool-call) frequency above.
          break;
        case 'victory':
          // Idempotent: the boss may already be down (see 'hit'). Always fold in
          // the citations ("loot") from finish, but don't double-log victory.
          boss.hp = 0;
          if (action.sources) sources = action.sources;
          if (phase !== 'victory') {
            phase = 'victory';
            reportSummary = action.summary;
            push('🏆 VICTORY — boss defeated!', 'crit');
            resolveLastRunning('ok');
            flow.push({ id: ++flowId, kind: 'finish', label: 'Answer delivered', status: 'ok' });
          }
          break;
        case 'defeat':
          // Never un-win a solved quest — a late error after victory is ignored.
          if (phase === 'fighting') {
            phase = 'defeat';
            push(`☠ Defeat: ${action.reason}`, 'bad');
            flow.push({ id: ++flowId, kind: 'error', label: 'Quest failed', status: 'error', detail: action.reason });
          }
          break;
      }

      return { 
    ...s, 
    hero, 
    boss, 
    phase, 
    round, 
    log, 
    flow, 
    sources, 
    reportSummary, 
    answer, 
    skillUses, 
    treeRoot,
    currentTreePath,
    lastAction: action 
  };
    }),
}));
