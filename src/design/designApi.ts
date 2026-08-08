// Client for the human-in-the-loop Character Design Studio backend.
// Talks to POST /api/design (generate candidate sprite sheets) and
// POST /api/design/finalize (slice + key the chosen sheet into pose PNGs).
import type { CharacterSprites, FxArchetype } from '../battle/sprites';

/** A design candidate = a full 4-pose sprite SHEET to preview (JPEG on magenta). */
export interface Candidate {
  id: string;
  label: string;
  url: string;
  /** Combat VFX archetype the design agent chose for this character. */
  fx?: FxArchetype;
}

interface DesignResponse {
  candidates?: Candidate[];
  error?: string;
}

interface FinalizeResponse {
  sprites?: CharacterSprites;
  error?: string;
}

/** Generation is slow (~10-30s) and can fail — give it a generous timeout. */
const DESIGN_TIMEOUT_MS = 60_000;
const FINALIZE_TIMEOUT_MS = 60_000;

async function postJson<T>(url: string, body: unknown, timeoutMs: number): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      // Try to surface a server-provided error message.
      let msg = `Request failed (${res.status})`;
      try {
        const data = (await res.json()) as { error?: string };
        if (data && typeof data.error === 'string') msg = data.error;
      } catch {
        /* body wasn't JSON — keep generic message */
      }
      throw new Error(msg);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Ask the backend to summon N candidate sprite sheets for a concept.
 * Never throws — returns { candidates, error } so the UI stays demo-safe.
 */
export async function requestDesigns(
  concept: string,
  opts?: { feedback?: string; n?: number; target?: 'hero' | 'boss' },
): Promise<{ candidates: Candidate[]; error?: string }> {
  try {
    const data = await postJson<DesignResponse>(
      '/api/design',
      {
        concept,
        feedback: opts?.feedback,
        n: opts?.n ?? 4,
        target: opts?.target ?? 'hero',
      },
      DESIGN_TIMEOUT_MS,
    );
    if (data.error) return { candidates: data.candidates ?? [], error: data.error };
    return { candidates: data.candidates ?? [] };
  } catch (err) {
    const aborted = err instanceof DOMException && err.name === 'AbortError';
    const message = aborted
      ? 'The designers took too long to respond. Try again.'
      : err instanceof Error
        ? err.message
        : 'Something went wrong summoning designs.';
    return { candidates: [], error: message };
  }
}

/**
 * Finalize a chosen sheet: the server slices it and returns transparent
 * pose PNGs (as data: URLs) ready to drop into the battle store.
 * Throws on failure so the caller can show a retry.
 */
export async function finalizeDesign(url: string, name: string): Promise<CharacterSprites> {
  const data = await postJson<FinalizeResponse>(
    '/api/design/finalize',
    { url, name },
    FINALIZE_TIMEOUT_MS,
  );
  if (data.error) throw new Error(data.error);
  if (!data.sprites) throw new Error('The forge returned no sprite. Try again.');
  return data.sprites;
}
