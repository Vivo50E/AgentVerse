// Chiptune-style battle SFX synthesized live via Web Audio — no audio files to
// fetch/license, and it matches the retro pixel-JRPG aesthetic. Replaces the old
// TTS narration (removed: too laggy, queued lines played long after the moment).
import type { SkillKind } from '../battle/types';

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    try {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      ctx = Ctor ? new Ctor() : null;
    } catch {
      ctx = null;
    }
  }
  return ctx;
}

/** Unlock/resume the audio context from within a user gesture (click). */
export function resumeAudio(): void {
  const c = getCtx();
  if (c && c.state === 'suspended') void c.resume();
}

interface Tone {
  freq: number;
  start: number; // seconds from now
  dur: number; // seconds
  type?: OscillatorType;
  gain?: number;
}

function playTones(tones: Tone[]): void {
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime;
  for (const t of tones) {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = t.type ?? 'square';
    osc.frequency.value = t.freq;
    const startAt = now + t.start;
    const endAt = startAt + t.dur;
    const peak = t.gain ?? 0.16;
    gain.gain.setValueAtTime(0, startAt);
    gain.gain.linearRampToValueAtTime(peak, startAt + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, endAt);
    osc.connect(gain).connect(c.destination);
    osc.start(startAt);
    osc.stop(endAt + 0.02);
  }
}

/** Cast sound — distinct per skill so each ability has its own signature blip. */
export function playCast(skill: SkillKind): void {
  switch (skill) {
    case 'intel_summon': // data-scan ping, ascending
      playTones([
        { freq: 740, type: 'sine', start: 0, dur: 0.09, gain: 0.13 },
        { freq: 988, type: 'sine', start: 0.08, dur: 0.13, gain: 0.13 },
      ]);
      break;
    case 'forge': // clank-clank, descending square
      playTones([
        { freq: 220, type: 'square', start: 0, dur: 0.06, gain: 0.16 },
        { freq: 180, type: 'square', start: 0.07, dur: 0.09, gain: 0.16 },
      ]);
      break;
    case 'strike': // short punchy blip
      playTones([{ freq: 520, type: 'square', start: 0, dur: 0.07, gain: 0.16 }]);
      break;
    case 'focus': // soft sustained hum
      playTones([{ freq: 440, type: 'sine', start: 0, dur: 0.22, gain: 0.09 }]);
      break;
  }
}

export function playHit(): void {
  playTones([
    { freq: 220, type: 'square', start: 0, dur: 0.07, gain: 0.17 },
    { freq: 140, type: 'square', start: 0.02, dur: 0.09, gain: 0.13 },
  ]);
}

export function playCrit(): void {
  playTones([
    { freq: 300, type: 'square', start: 0, dur: 0.06, gain: 0.2 },
    { freq: 600, type: 'square', start: 0.05, dur: 0.08, gain: 0.18 },
    { freq: 900, type: 'square', start: 0.1, dur: 0.12, gain: 0.16 },
  ]);
}

export function playAgentHurt(): void {
  playTones([
    { freq: 400, type: 'triangle', start: 0, dur: 0.08, gain: 0.15 },
    { freq: 280, type: 'triangle', start: 0.07, dur: 0.12, gain: 0.13 },
  ]);
}

export function playVictory(): void {
  playTones([
    { freq: 523, type: 'square', start: 0, dur: 0.12, gain: 0.15 },
    { freq: 659, type: 'square', start: 0.12, dur: 0.12, gain: 0.15 },
    { freq: 784, type: 'square', start: 0.24, dur: 0.24, gain: 0.17 },
  ]);
}

export function playDefeat(): void {
  playTones([
    { freq: 392, type: 'triangle', start: 0, dur: 0.16, gain: 0.15 },
    { freq: 330, type: 'triangle', start: 0.15, dur: 0.16, gain: 0.13 },
    { freq: 262, type: 'triangle', start: 0.3, dur: 0.32, gain: 0.13 },
  ]);
}
