// Reusable asset pipeline: generate a Grok pixel image, slice a sprite sheet,
// chroma-key the (auto-detected) solid background to transparent PNGs.
// Used by scripts/genDefaults.mjs (build-time) and reused server-side for HITL.
import { Jimp } from 'jimp';
import fs from 'node:fs/promises';

const XAI_KEY = process.env.XAI_API_KEY;

/** Call Grok Imagine; returns the image URL. Retries once on transient error. */
export async function grokImage(prompt) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch('https://api.x.ai/v1/images/generations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${XAI_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'grok-imagine-image', prompt, n: 1 }),
    });
    const j = await res.json();
    if (j?.data?.[0]?.url) return j.data[0].url;
    if (attempt === 0) await new Promise((r) => setTimeout(r, 1500));
    else throw new Error('grokImage failed: ' + JSON.stringify(j).slice(0, 200));
  }
}

export async function download(url, dest) {
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
  await fs.writeFile(dest, buf);
  return dest;
}

const dist = (r, g, b, k) => Math.sqrt((r - k.r) ** 2 + (g - k.g) ** 2 + (b - k.b) ** 2);

/**
 * Slice a sheet into `names.length` frames and chroma-key the background.
 * Key color is auto-sampled from the top-left corner (robust across generations).
 * Writes `${outDir}/${prefix}-${name}.png` and returns frame metadata.
 */
export async function sliceAndKey(srcPath, outDir, prefix, names, tol = 72) {
  await fs.mkdir(outDir, { recursive: true });
  const img = await Jimp.read(srcPath);
  const fw = Math.floor(img.bitmap.width / names.length);
  const fh = img.bitmap.height;
  // sample key color from corner
  const key = { r: img.bitmap.data[0], g: img.bitmap.data[1], b: img.bitmap.data[2] };
  const frames = [];
  for (let f = 0; f < names.length; f++) {
    const fr = img.clone().crop({ x: f * fw, y: 0, w: fw, h: fh });
    fr.scan(0, 0, fr.bitmap.width, fr.bitmap.height, function (x, y, idx) {
      if (dist(this.bitmap.data[idx], this.bitmap.data[idx + 1], this.bitmap.data[idx + 2], key) < tol) {
        this.bitmap.data[idx + 3] = 0;
      }
    });
    const file = `${outDir}/${prefix}-${names[f]}.png`;
    await fr.write(file);
    frames.push({ pose: names[f], file, w: fw, h: fh });
  }
  return { frames, key, frameWidth: fw, frameHeight: fh };
}

export const POSES = ['idle', 'attack', 'hurt', 'cast'];

/** Standard sprite-sheet prompt for a consistent 4-pose character. */
export function spriteSheetPrompt(character) {
  return (
    `16-bit pixel art sprite sheet, one ${character} character shown in 4 poses in a single ` +
    `horizontal row evenly spaced (idle standing, attacking, hurt recoiling, casting/special), ` +
    `side view facing right, identical consistent character design across all 4 frames, ` +
    `flat solid magenta (#C8288C) background, retro SNES JRPG style, crisp pixels, full body`
  );
}
