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
    lastAction: null,
    sources: [],
    reportSummary: '',
    answer: '',
    streamDone: false,
  };
}

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

      switch (action.type) {
        case 'narrate':
          // The streamed text IS the agent's real answer — accumulate it as the
          // useful deliverable instead of spamming the battle log with fragments.
          answer += action.text;
          break;
        case 'cast':
          hero.mp = Math.max(0, hero.mp - 8);
          push(`✦ ${hero.name} casts ${action.label}`, 'good');
          break;
        case 'hit':
          boss.hp = Math.max(0, boss.hp - action.damage);
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
          push(`⚠ ${action.reason} (-${action.damage})`, 'bad');
          break;
        case 'round_end':
          round = s.round + 1;
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
          }
          break;
        case 'defeat':
          phase = 'defeat';
          push(`☠ Defeat: ${action.reason}`, 'bad');
          break;
      }

      return { ...s, hero, boss, phase, round, log, sources, reportSummary, answer, lastAction: action };
    }),
}));
