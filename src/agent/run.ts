// Frontend: kick off an agent run and pipe SSE events into the battle store.
import { mapEvent } from '../battle/eventMapper';
import { useBattle } from '../battle/store';
import type { StreamEvent } from '../battle/types';

export async function runAgent(task: string) {
  const { start, apply } = useBattle.getState();
  start();

  const res = await fetch('/api/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task }),
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
}
