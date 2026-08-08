// Pick the alternate battle background (see scripts/genBackgrounds.mjs /
// public/sprites/backgrounds.json) whose theme best matches the quest's task text.
// Pure keyword heuristic — zero extra latency/API cost. If/when task-themed boss
// generation (plan.md §7d) adds a Grok-generated villain concept, that concept
// string can be passed through this same matcher instead of the raw task text.

const THEMES: { key: string; keywords: string[] }[] = [
  { key: 'bg-forest', keywords: ['forest', 'nature', 'plant', 'tree', 'garden', 'ecolog', 'wildlife', 'jungle'] },
  { key: 'bg-volcano', keywords: ['fire', 'volcano', 'lava', 'heat', 'burn', 'flame', 'energy', 'power plant'] },
  { key: 'bg-ice', keywords: ['ice', 'frozen', 'cold', 'snow', 'winter', 'arctic', 'climate', 'glacier'] },
  { key: 'bg-library', keywords: ['research', 'book', 'library', 'study', 'knowledge', 'paper', 'article', 'history', 'academic', 'news', 'summarize', 'summary'] },
  { key: 'bg-sky', keywords: ['sky', 'cloud', 'space', 'flight', 'aviation', 'satellite', 'astronomy', 'high-level', 'strategy'] },
];

let cache: Record<string, string> | null = null;

async function loadBackgrounds(): Promise<Record<string, string>> {
  if (cache) return cache;
  try {
    cache = (await (await fetch('/sprites/backgrounds.json')).json()) as Record<string, string>;
  } catch {
    cache = {};
  }
  return cache;
}

/** Returns a background image path best matching `text`, or null if no theme scored a hit. */
export async function matchBackground(text: string): Promise<string | null> {
  const lower = text.toLowerCase();
  let best: { key: string; score: number } | null = null;
  for (const theme of THEMES) {
    const score = theme.keywords.reduce((n, kw) => (lower.includes(kw) ? n + 1 : n), 0);
    if (score > 0 && (!best || score > best.score)) best = { key: theme.key, score };
  }
  if (!best) return null;
  const backgrounds = await loadBackgrounds();
  return backgrounds[best.key] ?? null;
}
