// Translate a raw Grok/Vercel-AI-SDK stream event into a BattleAction.
// This is the single place that decides "what does this agent step mean in the fight?"
import type { BattleAction, SkillKind, StreamEvent } from './types';

function skillForTool(toolName?: string): { skill: SkillKind; label: string } {
  switch (toolName) {
    case 'web_search':
      return { skill: 'intel_summon', label: 'Web Intel Summon' };
    case 'x_search':
      return { skill: 'intel_summon', label: 'X Intel Summon ⚡' }; // signature skill
    case 'code_execution':
      return { skill: 'forge', label: 'Forge & Execute' };
    default:
      return { skill: 'strike', label: toolName ?? 'Strike' };
  }
}

// Deterministic "damage" so the fight feels responsive without real combat math.
// Vary by whether it was a crit (a successful tool call that returned data).
function rollDamage(crit: boolean): number {
  return crit ? 24 : 12;
}

export function mapEvent(ev: StreamEvent): BattleAction | null {
  switch (ev.type) {
    case 'text-delta':
      return ev.textDelta ? { type: 'narrate', text: ev.textDelta } : null;

    case 'tool-call': {
      const { skill, label } = skillForTool(ev.toolName);
      return { type: 'cast', skill, label, tool: ev.toolName, input: ev.input };
    }

    case 'tool-result':
      if (ev.isError) {
        return { type: 'agent_hurt', damage: 15, reason: 'tool failed — retrying' };
      }
      return { type: 'hit', damage: rollDamage(true), crit: true, note: 'landed intel' };

    case 'step-finish':
      return { type: 'round_end' };

    case 'finish':
      if (ev.finishReason && ev.finishReason !== 'stop') {
        return { type: 'defeat', reason: ev.finishReason };
      }
      return {
        type: 'victory',
        summary: 'The problem is solved. Boss down!',
        sources: ev.sources,
      };

    case 'error':
      // A mid-stream error (e.g. a flaky tool call) is a scratch, not a loss —
      // the agent takes some damage but the quest continues. True failure is
      // decided at the end of the run (see runAgent), not by a transient error.
      return { type: 'agent_hurt', damage: 8, reason: ev.errorMessage ?? 'a spell fizzled' };

    case 'paused':
      // HITL round boundary (§7e) — run.ts intercepts this directly to open the
      // command menu; it carries no battle-visual meaning of its own.
      return null;

    default:
      return null;
  }
}
