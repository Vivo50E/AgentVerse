// The battle state machine. Applies BattleActions to state; React components
// subscribe and animate off `lastAction` / actor HP.
import { create } from 'zustand';
import type { BattleAction, BattleState } from './types';

let logId = 0;

function freshActor(name: string, hp: number, mp: number) {
  return { name, hp, maxHp: hp, mp, maxMp: mp };
}

function initialState(): Omit<BattleState, never> {
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
  };
}

let flowId = 0;

interface Store extends BattleState {
  start: () => void;
  apply: (action: BattleAction) => void;
  endStream: () => void;
  reset: () => void;
}

export const useBattle = create<Store>((set) => ({
  ...initialState(),

  start: () => set({ ...initialState(), phase: 'fighting', round: 1 }),

  endStream: () => set({ streamDone: true }),

  reset: () => set(initialState()),

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
      const resolveLastRunning = (status: 'ok' | 'error', detail?: string) => {
        for (let i = flow.length - 1; i >= 0; i--) {
          if (flow[i].status === 'running') {
            flow[i] = { ...flow[i], status, detail: detail ?? flow[i].detail };
            return;
          }
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

      return { ...s, hero, boss, phase, round, log, flow, sources, reportSummary, answer, skillUses, lastAction: action };
    }),
}));
