// TTS client: primary POST /api/tts (audio bytes) with a guaranteed Web Speech
// fallback so the demo never has silent gaps. All browser APIs are guarded with
// typeof-window checks so importing this module is SSR/test safe.

/** Assumed /api/tts contract:
 *   POST /api/tts
 *   Request:  { "text": string }               (application/json)
 *   Response: 200 with an audio body (e.g. audio/mpeg or audio/wav bytes).
 *             Any non-2xx, network error, or empty body -> Web Speech fallback.
 */

// Cache decoded object URLs for stock lines so repeats don't re-fetch.
const audioCache = new Map<string, string>();

// Track what's currently playing so cancelSpeech() can stop it.
let currentAudio: HTMLAudioElement | null = null;

function hasWindow(): boolean {
  return typeof window !== 'undefined';
}

function hasSpeechSynthesis(): boolean {
  return hasWindow() && typeof window.speechSynthesis !== 'undefined';
}

/** Pick a reasonable English voice; falls back to the browser default. */
function pickVoice(): SpeechSynthesisVoice | null {
  if (!hasSpeechSynthesis()) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const preferred =
    voices.find((v) => /en[-_]US/i.test(v.lang) && /google|natural|samantha/i.test(v.name)) ??
    voices.find((v) => /^en/i.test(v.lang)) ??
    voices[0];
  return preferred ?? null;
}

/** Speak via the browser Web Speech API. Resolves when speech ends. */
function speakFallback(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (!hasSpeechSynthesis()) {
      resolve();
      return;
    }
    try {
      const utter = new SpeechSynthesisUtterance(text);
      const voice = pickVoice();
      if (voice) utter.voice = voice;
      utter.rate = 1.1; // slightly brisk for a punchy announcer feel
      utter.pitch = 1;
      utter.volume = 1;
      utter.onend = () => resolve();
      utter.onerror = () => resolve();
      window.speechSynthesis.cancel(); // interrupt any prior line
      window.speechSynthesis.speak(utter);
    } catch {
      resolve();
    }
  });
}

/** Play audio bytes from an object URL. Resolves when playback ends/fails. */
function playAudio(url: string): Promise<void> {
  return new Promise((resolve) => {
    if (!hasWindow() || typeof Audio === 'undefined') {
      resolve();
      return;
    }
    try {
      const audio = new Audio(url);
      currentAudio = audio;
      const done = () => {
        if (currentAudio === audio) currentAudio = null;
        resolve();
      };
      audio.onended = done;
      audio.onerror = done;
      void audio.play().catch(() => done());
    } catch {
      resolve();
    }
  });
}

/**
 * Speak `text`. Tries the backend TTS first, then falls back to Web Speech.
 * Never rejects — a failed primary path degrades silently to the fallback.
 */
export async function speak(text: string): Promise<void> {
  if (!text || !text.trim()) return;

  // Serve cached audio if we've fetched this exact line before.
  const cached = audioCache.get(text);
  if (cached) {
    await playAudio(cached);
    return;
  }

  if (hasWindow() && typeof fetch !== 'undefined') {
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        const blob = await res.blob();
        if (blob.size > 0 && typeof URL !== 'undefined' && URL.createObjectURL) {
          const url = URL.createObjectURL(blob);
          audioCache.set(text, url);
          await playAudio(url);
          return;
        }
      }
    } catch {
      // ignore and fall through to Web Speech
    }
  }

  await speakFallback(text);
}

/**
 * Unlock/warm the Web Speech engine from within a user gesture (click). Browsers
 * only allow speechSynthesis after a user activation, and battle lines fire
 * seconds later via async callbacks — past the activation window — so without
 * this priming they'd be silently dropped. Call from click handlers.
 */
export function primeSpeech(): void {
  if (!hasSpeechSynthesis()) return;
  try {
    window.speechSynthesis.getVoices(); // kick voice loading
    window.speechSynthesis.resume(); // in case the engine is paused
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0; // silent — just to unlock the engine within the gesture
    window.speechSynthesis.speak(u);
  } catch {
    /* ignore */
  }
}

/** Stop any current speech (both backend audio and Web Speech). */
export function cancelSpeech(): void {
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    } catch {
      // ignore
    }
    currentAudio = null;
  }
  if (hasSpeechSynthesis()) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
}
