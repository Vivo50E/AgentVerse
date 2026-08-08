// Stock RPG-announcer voice lines. Keep each line SHORT (1–2 s spoken) so the
// TTS fallback stays snappy and lines can be pre-cached for a zero-latency demo.

/** Events the announcer reacts to. Derived from BattleAction in ../battle/types. */
export type LineKey =
  | 'crit'
  | 'hit'
  | 'cast_intel'
  | 'cast_forge'
  | 'agent_hurt'
  | 'victory'
  | 'defeat'
  | 'round_end';

/** 2–3 punchy alternatives per event; rotated by pickLine for variety. */
export const LINES: Record<LineKey, readonly string[]> = {
  crit: ['Critical hit!', 'Devastating blow!', 'Boom! Massive damage!'],
  hit: ['Direct hit!', 'Take that!', 'Nice strike!'],
  cast_intel: ['Gathering intel!', 'Scanning the web!', 'Knowledge is power!'],
  cast_forge: ['Forging code!', 'Building the fix!', 'Compiling victory!'],
  agent_hurt: ['Ouch, that stings!', 'The agent takes damage!', 'Hold the line!'],
  victory: ['Victory!', 'The problem falls!', 'Flawless run!'],
  defeat: ['Defeat...', 'The agent is down.', 'We fall this round.'],
  round_end: ['Round complete.', 'Next phase!', 'Pressing on!'],
};

// Deterministic rotation per key — predictable ordering for demos/tests.
const counters: Partial<Record<LineKey, number>> = {};

/** Returns the next stock line for `key`, cycling through its alternatives. */
export function pickLine(key: LineKey): string {
  const options = LINES[key];
  const n = counters[key] ?? 0;
  counters[key] = n + 1;
  return options[n % options.length];
}
