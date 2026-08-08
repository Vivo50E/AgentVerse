// Generate a set of alternate battle backgrounds into public/sprites/.
// Run: node scripts/genBackgrounds.mjs
// These are extra variants alongside the default bg.jpg (still used as fallback);
// useful for parallel-dungeon variety and future task-themed boss scenes.
import fs from 'node:fs/promises';
import { grokImage, download } from './spritePipeline.mjs';

const OUT = new URL('../public/sprites/', import.meta.url).pathname;
await fs.mkdir(OUT, { recursive: true });

const STYLE =
  '16-bit pixel art RPG battle background, wide side-view landscape, no characters, ' +
  'retro SNES JRPG style, atmospheric lighting, crisp pixels';

const BACKGROUNDS = [
  { key: 'bg-forest', prompt: `${STYLE}, an overgrown ancient forest ruin with glowing fireflies and mossy stone pillars` },
  { key: 'bg-volcano', prompt: `${STYLE}, a volcanic cavern arena with rivers of lava and cracked obsidian floor` },
  { key: 'bg-ice', prompt: `${STYLE}, a frozen ice cavern with glowing blue crystals and frost-covered pillars` },
  { key: 'bg-library', prompt: `${STYLE}, a vast arcane library with floating books, glowing runes, and tall bookshelves` },
  { key: 'bg-sky', prompt: `${STYLE}, a floating sky temple arena above the clouds with golden ruins and sunset light` },
];

const manifest = {};
for (const b of BACKGROUNDS) {
  console.log(`▶ ${b.key}…`);
  const url = await grokImage(b.prompt);
  const file = `${OUT}${b.key}.jpg`;
  await download(url, file);
  manifest[b.key] = `/sprites/${b.key}.jpg`;
  console.log(`  ✓ ${b.key} saved`);
}

await fs.writeFile(`${OUT}backgrounds.json`, JSON.stringify(manifest, null, 2));
console.log('\n✅ wrote public/sprites/backgrounds.json');
