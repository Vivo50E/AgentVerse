// Generate the DEFAULT asset set (hero, boss, background) into public/sprites/.
// Run once: `node scripts/genDefaults.mjs`. Requires XAI_API_KEY in env.
// The battle renders from these even if the human-in-the-loop designer isn't used.
import fs from 'node:fs/promises';
import { grokImage, download, sliceAndKey, spriteSheetPrompt, POSES } from './spritePipeline.mjs';

const OUT = new URL('../public/sprites/', import.meta.url).pathname;
await fs.mkdir(OUT, { recursive: true });

async function genCharacter(name, character) {
  console.log(`\n▶ ${name}: generating sprite sheet…`);
  const url = await grokImage(spriteSheetPrompt(character));
  const raw = `${OUT}${name}-sheet.jpg`;
  await download(url, raw);
  const meta = await sliceAndKey(raw, OUT, name, POSES);
  console.log(`  ✓ ${name}: ${meta.frames.length} poses, ${meta.frameWidth}x${meta.frameHeight}, key`, meta.key);
  return { name, poses: Object.fromEntries(meta.frames.map((f) => [f.pose, `/sprites/${name}-${f.pose}.png`])), w: meta.frameWidth, h: meta.frameHeight };
}

async function genBackground() {
  console.log('\n▶ background: generating scene…');
  const url = await grokImage(
    '16-bit pixel art RPG battle background, a dark arcane dungeon arena with glowing runes, ' +
      'wide landscape, no characters, retro SNES JRPG style, atmospheric',
  );
  await download(url, `${OUT}bg.jpg`);
  console.log('  ✓ background saved');
  return '/sprites/bg.jpg';
}

const hero = await genCharacter('hero', 'heroic wizard mage in blue robes with a glowing staff');
const boss = await genCharacter('boss', 'menacing giant corrupted bug-dragon monster (represents "the problem")');
const bg = await genBackground();

const manifest = { hero, boss, background: bg, poses: POSES };
await fs.writeFile(`${OUT}manifest.json`, JSON.stringify(manifest, null, 2));
console.log('\n✅ wrote public/sprites/manifest.json');
