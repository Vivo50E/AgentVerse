// Generate foe sprites for the side-scrolling journey into public/sprites/.
// Each foe = a 4-pose sheet (we mainly use idle + hurt). Run: node scripts/genFoes.mjs
import fs from 'node:fs/promises';
import { grokImage, download, sliceAndKey, spriteSheetPrompt, POSES } from './spritePipeline.mjs';

const OUT = new URL('../public/sprites/', import.meta.url).pathname;
await fs.mkdir(OUT, { recursive: true });

// key = filename prefix, kind drives size later, character = art prompt subject
const FOES = [
  { key: 'foe-slime', character: 'a small cute-but-menacing green slime blob monster with eyes' },
  { key: 'foe-goblin', character: 'a scrappy goblin scout with a rusty dagger' },
  { key: 'foe-wraith', character: 'a floating dark hooded wraith spirit with glowing eyes' },
  { key: 'foe-golem', character: 'a hulking stone rune-golem mini-boss, massive and armored' },
];

const out = {};
for (const f of FOES) {
  console.log(`▶ ${f.key}…`);
  const url = await grokImage(spriteSheetPrompt(f.character));
  const raw = `${OUT}${f.key}-sheet.jpg`;
  await download(url, raw);
  const meta = await sliceAndKey(raw, OUT, f.key, POSES);
  out[f.key] = { poses: Object.fromEntries(meta.frames.map((fr) => [fr.pose, `/sprites/${f.key}-${fr.pose}.png`])), w: meta.frameWidth, h: meta.frameHeight };
  console.log(`  ✓ ${f.key} ${meta.frameWidth}x${meta.frameHeight}`, meta.key);
}
await fs.writeFile(`${OUT}foes.json`, JSON.stringify(out, null, 2));
console.log('\n✅ wrote public/sprites/foes.json');
