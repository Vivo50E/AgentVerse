// Frontend: kick off an agent run and pipe SSE events into the battle store.
import { mapEvent } from '../battle/eventMapper';
import { useBattle } from '../battle/store';
import { useCharacters } from '../battle/characters';
import { useCommandMenu } from '../battle/commandMenu';
import { matchBackground } from '../battle/backgroundMatch';
import { useQuestStages } from '../battle/questStages';
import { requestTaskStages, requestTactics } from '../design/designApi';
import { useLoadout } from '../loadout';
import { useProgression } from '../progression';
import type { StreamEvent } from '../battle/types';

interface RunOptions {
  /** In-battle HITL command menu (plan.md §7e) — pause between rounds so the
   * player can steer the agent's next move. Off = the classic single, unpaused
   * streaming run. */
  hitl?: boolean;
}

const FALLBACK_TACTICS = [
  'Push forward with the same approach',
  'Try a different angle',
  'Double-check the last result',
];

/** Reads an SSE response body, calling onEvent for each parsed frame. */
async function readSse(res: Response, onEvent: (ev: StreamEvent) => void): Promise<void> {
  if (!res.body) throw new Error('no response stream');
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
        onEvent(JSON.parse(payload) as StreamEvent);
      } catch {
        /* ignore malformed frame */
      }
    }
  }
}

/** Classic path: one long-lived stream for the whole quest, no pausing. */
async function runClassic(task: string, tools: string[]): Promise<void> {
  const { apply } = useBattle.getState();
  const res = await fetch('/api/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task, tools }),
  });
  if (!res.body) {
    apply({ type: 'defeat', reason: 'no response stream' });
    return;
  }
  await readSse(res, (ev) => {
    const action = mapEvent(ev);
    if (action) apply(action);
  });
}

/** A short summary of how the quest is going, for the tactics-generator call. */
function progressSummary(): string {
  const b = useBattle.getState();
  const bossFrac = b.boss.maxHp > 0 ? Math.round((b.boss.hp / b.boss.maxHp) * 100) : 0;
  const recent = b.log.slice(-3).map((l) => l.text).join(' | ');
  return `Boss at ${bossFrac}% HP. Recent: ${recent || 'quest just started'}.`;
}

/** Opens the command menu (loading state), fills it in once tactics arrive, and
 * resolves with the player's choice — a hint string, or null to continue as-is. */
async function askPlayer(task: string): Promise<string | null> {
  const hintPromise = useCommandMenu.getState().request([]);
  requestTactics(task, progressSummary()).then(({ options }) => {
    useCommandMenu.getState().setOptions(options?.length ? options : FALLBACK_TACTICS);
  });
  return hintPromise;
}

/** HITL path: advances the quest one turn per HTTP call, pausing for player
 * input whenever a turn made a tool call and the fight is still ongoing. */
async function runHitl(task: string, tools: string[]): Promise<void> {
  const { apply } = useBattle.getState();

  // Runs one turn's SSE stream, returns the sessionId to continue with if the
  // server paused (i.e. the turn made a tool call), or null if it truly finished.
  const runTurn = async (res: Response): Promise<string | null> => {
    if (!res.body) {
      apply({ type: 'defeat', reason: 'no response stream' });
      return null;
    }
    let pausedSessionId: string | null = null;
    await readSse(res, (ev) => {
      if (ev.type === 'paused') {
        pausedSessionId = ev.sessionId ?? null;
        return;
      }
      const action = mapEvent(ev);
      if (action) apply(action);
    });
    return pausedSessionId;
  };

  let sessionId = await runTurn(
    await fetch('/api/run/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task, tools }),
    }),
  );

  while (sessionId && useBattle.getState().phase === 'fighting') {
    const hint = await askPlayer(task);
    sessionId = await runTurn(
      await fetch('/api/run/continue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, hint: hint ?? undefined }),
      }),
    );
  }
}

export async function runAgent(task: string, opts: RunOptions = {}) {
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

  // Task-themed quest-stage names (independent of the boss-for-task toggle —
  // text-only, so it always runs). Falls back to generic defaults on failure.
  requestTaskStages(task).then(({ stages }) => {
    const qs = useQuestStages.getState();
    if (stages) qs.setLabels(stages);
    else qs.resetLabels();
  });

  // The equipped loadout decides which real tools the agent may wield.
  const tools = useLoadout.getState().getEnabledTools();

  try {
    if (opts.hitl) await runHitl(task, tools);
    else await runClassic(task, tools);
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
