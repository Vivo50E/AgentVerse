// React hook that plays a synthesized SFX blip for each battle action.
// Subscribes to the zustand store's `lastAction`, same pattern the old TTS
// narration hook used, but instant — no queueing, no lag.
import { useEffect, useRef } from 'react';
import { useBattle } from '../battle/store';
import type { BattleAction } from '../battle/types';
import { playCast, playHit, playCrit, playAgentHurt, playVictory, playDefeat } from './synth';

export function useBattleSfx(enabled: boolean): void {
  const lastAction = useBattle((s) => s.lastAction);
  // Guard against re-triggering on unrelated re-renders.
  const playedRef = useRef<BattleAction | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (!lastAction || lastAction === playedRef.current) return;
    playedRef.current = lastAction;

    switch (lastAction.type) {
      case 'cast':
        playCast(lastAction.skill);
        break;
      case 'hit':
        (lastAction.crit ? playCrit : playHit)();
        break;
      case 'agent_hurt':
        playAgentHurt();
        break;
      case 'victory':
        playVictory();
        break;
      case 'defeat':
        playDefeat();
        break;
    }
  }, [enabled, lastAction]);
}
