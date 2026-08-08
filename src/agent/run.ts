// Frontend: kick off an agent run and pipe SSE events into the battle store.
import { mapEvent } from '../battle/eventMapper';
import { useBattle } from '../battle/store';
import { useCharacters } from '../battle/characters';
import { matchBackground } from '../battle/backgroundMatch';
import { useLoadout } from '../loadout';
import { useProgression } from '../progression';
import type { StreamEvent } from '../battle/types';

export async function runAgent(task: string) {
  const { start, apply, endStream } = useBattle.getState();
  // If a task-themed boss (plan.md §7d) was generated before this call, its
  // sprite name carries into the actor so the log/HP bar match what's on screen.
  start(useCharacters.getState().boss?.name);
  useProgression.getState().clearAward(); // fresh quest, drop the previous level-up banner

  // Pick the battle background whose theme best fits this task; falls back to
  // the default dungeon if nothing matches (see src/battle/backgroundMatch.ts).
  matchBackground(task).then((bg) => {
    const chars = useCharacters.getState();
    if (bg) chars.setBackground(bg);
    else chars.resetBackground();
  });

  // The equipped loadout decides which real tools the agent may wield.
  const tools = useLoadout.getState().getEnabledTools();

  try {
    const res = await fetch('/api/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task, tools }),
    });

    if (!res.body) {
      apply({ type: 'defeat', reason: 'no response stream' });
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // SSE frames are separated by a blank line; each has a `data: <json>` line.
      const frames = buffer.split('\n\n');
      buffer = frames.pop() ?? '';
      for (const frame of frames) {
        const line = frame.split('\n').find((l) => l.startsWith('data: '));
        if (!line) continue;
        const payload = line.slice(6);
        if (payload === '[DONE]') continue;
        try {
          const ev = JSON.parse(payload) as StreamEvent;
          const action = mapEvent(ev);
          if (action) apply(action);
        } catch {
          /* ignore malformed frame */
        }
      }
    }
  } catch (err) {
    apply({ type: 'defeat', reason: String(err) });
  } finally {
    // Resolve the outcome if the stream ended without an explicit win: an
    // answer means the agent solved it (victory), otherwise it's a real defeat.
    const pending = useBattle.getState();
    if (pending.phase === 'fighting') {
      apply(
        pending.answer.trim().length > 0
          ? { type: 'victory', summary: 'Quest complete — the agent delivered its answer.' }
          : { type: 'defeat', reason: 'the agent could not complete the quest' },
      );
    }
    endStream(); // the agent's answer + sources are now final
    // Award XP + learned growth from what the agent actually did this quest.
    const b = useBattle.getState();
    useProgression.getState().awardQuest({
      skillUses: b.skillUses,
      hpFrac: b.hero.maxHp > 0 ? b.hero.hp / b.hero.maxHp : 0,
      sources: b.sources.length,
      won: b.phase === 'victory',
    });
  }
}
