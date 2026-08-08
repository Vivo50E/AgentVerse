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
  };
}

interface Store extends BattleState {
  start: () => void;
  apply: (action: BattleAction) => void;
  reset: () => void;
}

export const useBattle = create<Store>((set) => ({
  ...initialState(),

  start: () => set({ ...initialState(), phase: 'fighting', round: 1 }),

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

      switch (action.type) {
        case 'narrate':
          // narration is streamed; only log full-ish lines to avoid spam
          if (action.text.trim().length > 0) push(action.text, 'info');
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
          break;
        case 'agent_hurt':
          hero.hp = Math.max(0, hero.hp - action.damage);
          push(`⚠ ${action.reason} (-${action.damage})`, 'bad');
          break;
        case 'round_end':
          round = s.round + 1;
          break;
        case 'victory':
          phase = 'victory';
          boss.hp = 0;
          reportSummary = action.summary;
          if (action.sources) sources = action.sources;
          push('🏆 VICTORY — boss defeated!', 'crit');
          break;
        case 'defeat':
          phase = 'defeat';
          push(`☠ Defeat: ${action.reason}`, 'bad');
          break;
      }

      return { ...s, hero, boss, phase, round, log, sources, reportSummary, lastAction: action };
    }),
}));
