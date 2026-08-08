// Share-to-X helper for the AgentVerse battle report card.
// Primary path: POST { text } to our /api/share endpoint, which handles the
// (fiddly) OAuth + media upload server-side and returns { url } to open.
// Fallback: build the web-intent URL client-side — no OAuth needed. See
// docs/kb/x-api.md ("Hackathon note") for why the intent URL is the v0 path.

interface ShareResponse {
  url: string;
}

/** Client-side web-intent URL — used as a fallback and by tests. */
export function intentUrl(text: string): string {
  return `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
}

/**
 * Share the given tweet text to X. Tries the server endpoint first, then falls
 * back to opening the X web-intent URL directly. Always opens in a new tab.
 */
export async function shareToX(text: string): Promise<void> {
  let target = intentUrl(text);

  try {
    const res = await fetch('/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (res.ok) {
      const data = (await res.json()) as Partial<ShareResponse>;
      if (data && typeof data.url === 'string' && data.url.length > 0) {
        target = data.url;
      }
    }
  } catch {
    // Network / server error — silently fall through to the intent URL.
  }

  window.open(target, '_blank', 'noopener,noreferrer');
}

export interface ShareTextOptions {
  heroName: string;
  rounds: number;
  won: boolean;
  summary?: string;
}

/** Build a fun, share-worthy tweet string with the #AgentVerse hashtag. */
export function buildShareText(opts: ShareTextOptions): string {
  const { heroName, rounds, won, summary } = opts;
  const roundLabel = `${rounds} round${rounds === 1 ? '' : 's'}`;

  const headline = won
    ? `⚔️ ${heroName} just slayed the boss in ${roundLabel}! 🏆`
    : `☠️ ${heroName} fell after ${roundLabel} of battle… we'll be back. ⚔️`;

  const quest = summary && summary.trim().length > 0 ? `\n\n"${summary.trim()}"` : '';

  return `${headline}${quest}\n\nWatch your AI agent fight its problem in an RPG. #AgentVerse`;
}
