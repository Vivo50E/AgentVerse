// Human-in-the-loop AI character designer endpoints.
// Mounted by the orchestrator as: app.use('/api', designRouter)
//
// Flow:
//   1. POST /api/design           -> multi-agent design: N chat agents each craft a
//                                     distinct sprite-sheet prompt; each prompt is sent to
//                                     Grok Imagine; returns candidate sheet URLs.
//   2. POST /api/design/finalize  -> slice a chosen sheet into 4 poses, chroma-key the
//                                     background to transparent, return base64 PNG data URLs.
//   3. POST /api/design/bg        -> generate a battle/dungeon background image URL.
//   4. POST /api/design/boss-for-task -> generate a boss themed to a quest task
//                                     (name + concept via chat model, sprite via Grok
//                                     Imagine), sliced+keyed the same way as #2.
import express from 'express';
import { Jimp } from 'jimp';

const XAI_KEY = process.env.XAI_API_KEY;
const IMAGE_URL = 'https://api.x.ai/v1/images/generations';
const CHAT_URL = 'https://api.x.ai/v1/chat/completions';
const IMAGE_MODEL = 'grok-imagine-image';
const CHAT_MODEL = 'grok-4.3';

const POSES = ['idle', 'attack', 'hurt', 'cast'] as const;
type Pose = (typeof POSES)[number];

interface CharacterSprites {
  name: string;
  poses: Record<Pose, string>;
  w: number;
  h: number;
}

// Combat VFX archetype — generated alongside the character so effects match it
// (a knight slashes, a mage casts arcane bolts, an archer looses arrows...).
type FxArchetype = 'arcane' | 'slash' | 'arrow' | 'fire' | 'lightning' | 'nature';
const FX_ARCHETYPES: FxArchetype[] = ['arcane', 'slash', 'arrow', 'fire', 'lightning', 'nature'];

/** Keyword fallback if the design agent doesn't return a valid archetype. */
function classifyFx(text: string): FxArchetype {
  const t = text.toLowerCase();
  if (/(knight|warrior|paladin|sword|blade|samurai|barbarian|fighter|soldier|gladiator|melee|axe|spear|lance|brawler|monk|ronin|berserker)/.test(t)) return 'slash';
  if (/(archer|ranger|hunter|bow|arrow|sniper|marksman|gun|crossbow|sharpshooter|rogue|assassin)/.test(t)) return 'arrow';
  if (/(fire|flame|pyro|inferno|ember|magma|lava|dragon|phoenix|burning|blaze)/.test(t)) return 'fire';
  if (/(lightning|thunder|storm|electric|shock|volt|tesla|spark|plasma)/.test(t)) return 'lightning';
  if (/(nature|forest|druid|plant|vine|leaf|earth|poison|toxic|beast|shaman|ranger|bloom)/.test(t)) return 'nature';
  return 'arcane'; // mage / wizard / sorcerer / psychic / default
}

function coerceFx(value: unknown, concept: string): FxArchetype {
  const v = String(value ?? '').toLowerCase().trim() as FxArchetype;
  return FX_ARCHETYPES.includes(v) ? v : classifyFx(concept);
}

// Deterministic fallbacks if the chat design-agent step fails.
const FALLBACK_STYLES = [
  { label: 'Dark Tones', modifier: 'moody dark tones, dramatic shadows, muted palette' },
  { label: 'Bright Heroic', modifier: 'bright heroic colors, vivid saturation, bold outlines' },
  { label: 'Chibi Cute', modifier: 'chibi cute proportions, big head, adorable rounded shapes' },
  { label: 'Ornate Detailed', modifier: 'ornate detailed armor and trim, intricate filigree, rich texture' },
];

const BASE_SHEET_PROMPT =
  '16-bit pixel art 4-pose (idle standing, attacking, hurt recoiling, casting/special) ' +
  'side-view character sprite sheet, 4 frames in a single horizontal row evenly spaced, ' +
  'identical consistent character design across all 4 frames, facing right, full body, ' +
  'crisp pixels, retro SNES JRPG style, on a flat solid magenta (#C8288C) background';

/** Call Grok Imagine; returns the image URL. Retries once on transient error. */
async function grokImage(prompt: string): Promise<string> {
  let lastErr = '';
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(IMAGE_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${XAI_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: IMAGE_MODEL, prompt, n: 1 }),
      });
      const j: any = await res.json();
      const url: string | undefined = j?.data?.[0]?.url;
      if (url) return url;
      lastErr = 'grokImage failed: ' + JSON.stringify(j).slice(0, 200);
    } catch (e) {
      lastErr = String(e);
    }
    if (attempt === 0) await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error(lastErr || 'grokImage failed');
}

/**
 * One "design agent": ask the chat model for a distinct sprite-sheet prompt for `concept`
 * with a specific art-direction angle. Returns { label, prompt }.
 */
async function designAgent(
  concept: string,
  angleIdx: number,
  target: string,
  feedback?: string,
): Promise<{ label: string; prompt: string; fx: FxArchetype }> {
  const feedbackLine = feedback
    ? `\nIncorporate this human feedback into the direction: "${feedback}".`
    : '';
  const sys =
    'You are a game art director. You produce a SINGLE image-generation prompt (one paragraph) ' +
    'for a pixel-art character sprite sheet, AND classify the character\'s combat effect style. ' +
    'Respond ONLY with strict JSON: ' +
    '{"label":"<2-4 word style name>","prompt":"<one paragraph image prompt>","fx":"<one of: arcane|slash|arrow|fire|lightning|nature>"}. ' +
    'Pick fx by how the character fights: slash=melee/sword/warrior, arrow=ranged/bow/gun, ' +
    'arcane=magic/mage/psychic, fire=flame/pyro, lightning=thunder/electric, nature=plant/beast/earth. ' +
    'No markdown, no extra text.';
  const user =
    `Design candidate #${angleIdx + 1} for a ${target} character. Concept: "${concept}".` +
    ` Give it a DISTINCT art-direction/style angle that differs from other candidates.` +
    ` The prompt MUST describe: ${BASE_SHEET_PROMPT}.` +
    feedbackLine;

  const res = await fetch(CHAT_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${XAI_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: CHAT_MODEL,
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: user },
      ],
      temperature: 0.9,
    }),
  });
  const j: any = await res.json();
  const content: string | undefined = j?.choices?.[0]?.message?.content;
  if (!content) throw new Error('designAgent: empty completion');

  // Tolerate models that wrap JSON in prose/code fences.
  const match = content.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(match ? match[0] : content);
  const prompt = String(parsed.prompt ?? '').trim();
  const label = String(parsed.label ?? '').trim();
  if (!prompt) throw new Error('designAgent: no prompt in JSON');
  return { label: label || `Style ${angleIdx + 1}`, prompt, fx: coerceFx(parsed.fx, concept) };
}

const dist = (r: number, g: number, b: number, k: { r: number; g: number; b: number }) =>
  Math.sqrt((r - k.r) ** 2 + (g - k.g) ** 2 + (b - k.b) ** 2);

/** Slice a fetched sheet image URL into 4 pose PNGs, chroma-keying the corner-sampled background. */
async function sliceAndKeySheetUrl(url: string): Promise<{ poses: Record<Pose, string>; w: number; h: number }> {
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
  const img = await Jimp.read(buf);
  const fw = Math.floor(img.bitmap.width / POSES.length);
  const fh = img.bitmap.height;
  // Sample key color from the top-left corner (robust across generations).
  const key = { r: img.bitmap.data[0], g: img.bitmap.data[1], b: img.bitmap.data[2] };
  const tol = 72;

  const poses = {} as Record<Pose, string>;
  for (let f = 0; f < POSES.length; f++) {
    const fr = img.clone().crop({ x: f * fw, y: 0, w: fw, h: fh });
    fr.scan(0, 0, fr.bitmap.width, fr.bitmap.height, function (this: any, _x, _y, idx) {
      if (dist(this.bitmap.data[idx], this.bitmap.data[idx + 1], this.bitmap.data[idx + 2], key) < tol) {
        this.bitmap.data[idx + 3] = 0;
      }
    });
    const pngBuf = await fr.getBuffer('image/png');
    poses[POSES[f]] = `data:image/png;base64,${pngBuf.toString('base64')}`;
  }
  return { poses, w: fw, h: fh };
}

/**
 * Turn a real quest task into a JRPG boss monster concept — the villain that
 * visually represents the problem the agent is about to solve.
 */
async function bossConceptForTask(task: string): Promise<{ name: string; concept: string; fx: FxArchetype }> {
  const sys =
    'You are a game narrative designer. Turn a real-world task/problem into a JRPG boss monster ' +
    "concept that visually personifies it as an adversary to defeat. Respond ONLY with strict JSON: " +
    '{"name":"<2-4 word boss name>","concept":"<one sentence visual description of the monster>",' +
    '"fx":"<one of: arcane|slash|arrow|fire|lightning|nature>"}. No markdown, no extra text.';
  const user = `Task: "${task}". Invent a boss monster that represents this task as an enemy to defeat.`;

  const res = await fetch(CHAT_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${XAI_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: CHAT_MODEL,
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: user },
      ],
      temperature: 0.9,
    }),
  });
  const j: any = await res.json();
  const content: string | undefined = j?.choices?.[0]?.message?.content;
  if (!content) throw new Error('bossConceptForTask: empty completion');

  const match = content.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(match ? match[0] : content);
  const concept = String(parsed.concept ?? '').trim();
  const name = String(parsed.name ?? '').trim();
  if (!concept) throw new Error('bossConceptForTask: no concept in JSON');
  return { name: name || 'The Problem', concept, fx: coerceFx(parsed.fx, task) };
}

export const designRouter: express.Router = express.Router();

// 1) Multi-agent design generation.
designRouter.post('/design', async (req, res) => {
  const concept: string = String(req.body?.concept ?? '').trim();
  const feedback: string | undefined = req.body?.feedback ? String(req.body.feedback) : undefined;
  const target: 'hero' | 'boss' = req.body?.target === 'boss' ? 'boss' : 'hero';
  const n = Math.min(4, Math.max(1, Number(req.body?.n) || 4));

  if (!concept) {
    res.status(400).json({ error: 'concept is required' });
    return;
  }

  // a) Spawn N design agents in parallel; fall back per-agent to deterministic variants.
  const agentResults = await Promise.allSettled(
    Array.from({ length: n }, (_, i) => designAgent(concept, i, target, feedback)),
  );

  const specs: { label: string; prompt: string; fx: FxArchetype }[] = agentResults.map((r, i) => {
    if (r.status === 'fulfilled') return r.value;
    const fb = FALLBACK_STYLES[i % FALLBACK_STYLES.length];
    return {
      label: fb.label,
      prompt: `${BASE_SHEET_PROMPT}, subject: ${concept}, ${fb.modifier}${
        feedback ? `, ${feedback}` : ''
      }`,
      fx: classifyFx(`${concept} ${feedback ?? ''}`),
    };
  });

  // b) Generate each sheet image in parallel.
  const imgResults = await Promise.allSettled(specs.map((s) => grokImage(s.prompt)));

  const candidates = imgResults
    .map((r, i) =>
      r.status === 'fulfilled'
        ? { id: `cand-${Date.now()}-${i}`, label: specs[i].label, url: r.value, fx: specs[i].fx }
        : null,
    )
    .filter((c): c is { id: string; label: string; url: string; fx: FxArchetype } => c !== null);

  if (candidates.length === 0) {
    res.status(200).json({ candidates: [], error: 'all image generations failed' });
    return;
  }
  res.status(200).json({ candidates });
});

// 2) Finalize: slice + chroma-key a chosen sheet into transparent PNG data URLs.
designRouter.post('/design/finalize', async (req, res) => {
  const url: string = String(req.body?.url ?? '');
  const name: string = String(req.body?.name ?? 'character');
  if (!url) {
    res.status(400).json({ error: 'url is required' });
    return;
  }

  try {
    const { poses, w, h } = await sliceAndKeySheetUrl(url);
    const sprites: CharacterSprites = { name, poses, w, h };
    res.status(200).json({ sprites });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// 3) Optional: generate a battle/dungeon background.
designRouter.post('/design/bg', async (req, res) => {
  const prompt: string =
    String(req.body?.prompt ?? '').trim() ||
    '16-bit pixel art side-view fantasy dungeon battle background, atmospheric torch lighting, ' +
      'detailed stone architecture, retro SNES JRPG style, no characters';
  try {
    const url = await grokImage(prompt);
    res.status(200).json({ url });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// 4) Task-themed boss: generate a boss whose name/appearance is themed to the
// quest task, so every run's antagonist visually represents what it's actually about.
designRouter.post('/design/boss-for-task', async (req, res) => {
  const task: string = String(req.body?.task ?? '').trim();
  if (!task) {
    res.status(400).json({ error: 'task is required' });
    return;
  }

  // Concept generation can fail independently of image generation — fall back
  // to a generic-but-still-on-topic concept rather than aborting the whole run.
  let name: string;
  let concept: string;
  let fx: FxArchetype;
  try {
    const c = await bossConceptForTask(task);
    name = c.name;
    concept = c.concept;
    fx = c.fx;
  } catch {
    name = 'The Problem';
    concept = `a monstrous embodiment of the challenge: ${task}`;
    fx = classifyFx(task);
  }

  try {
    const prompt = `${BASE_SHEET_PROMPT}, subject: a menacing JRPG boss monster, ${concept}`;
    const url = await grokImage(prompt);
    const { poses, w, h } = await sliceAndKeySheetUrl(url);
    const sprites: CharacterSprites = { name, poses, w, h };
    res.status(200).json({ sprites, fx });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});
