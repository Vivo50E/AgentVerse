// React hook that turns battle actions into spoken announcer lines.
// Subscribes to the zustand store's `lastAction` and speaks the matching stock
// line. Narration text-deltas are intentionally skipped (too spammy for TTS).
import { useEffect, useRef } from 'react';
import { useBattle } from '../battle/store';
import type { BattleAction, SkillKind } from '../battle/types';
import { pickLine, type LineKey } from './lines';
import { speak, cancelSpeech } from './tts';

function castKey(skill: SkillKind): LineKey {
  // Only intel/forge have bespoke lines; other casts reuse the forge flavor.
  return skill === 'intel_summon' ? 'cast_intel' : 'cast_forge';
}

/** Map a BattleAction to a voice line key, or null to stay silent. */
function lineKeyFor(action: BattleAction): LineKey | null {
  switch (action.type) {
    case 'narrate':
      return null; // skip streamed text-deltas
    case 'cast':
      return castKey(action.skill);
    case 'hit':
      return action.crit ? 'crit' : 'hit';
    case 'agent_hurt':
      return 'agent_hurt';
    case 'round_end':
      return 'round_end';
    case 'victory':
      return 'victory';
    case 'defeat':
      return 'defeat';
    default:
      return null;
  }
}

/**
 * Narrate battle actions with TTS while `enabled` is true.
 * Watches `lastAction`; speaks one short stock line per non-narrate action.
 */
export function useBattleVoice(enabled: boolean): { enabled: boolean } {
  const lastAction = useBattle((s) => s.lastAction);
  // Guard against re-speaking the same action object on unrelated re-renders.
  const spokenRef = useRef<BattleAction | null>(null);

  useEffect(() => {
    if (!enabled) {
      cancelSpeech();
      return;
    }
    if (!lastAction || lastAction === spokenRef.current) return;
    spokenRef.current = lastAction;

    const key = lineKeyFor(lastAction);
    if (!key) return;

    void speak(pickLine(key));
  }, [enabled, lastAction]);

  // Stop any in-flight speech when the hook unmounts.
  useEffect(() => cancelSpeech, []);

  return { enabled };
}
