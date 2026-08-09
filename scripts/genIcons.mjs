// Rasterize scripts/icon-source.svg into the PWA icon set via a headless
// browser (no image-magick/sharp dependency needed — playwright is already a devDep).
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const SRC = path.join(process.cwd(), 'scripts/icon-source.svg');
const OUT = path.join(process.cwd(), 'public/icons');
const svg = await fs.readFile(SRC, 'utf8');

// name, size, and whether to pad content for "maskable" safe-zone (Android adaptive icons
// crop to a circle; keep the glyph within the inner ~80%).
const TARGETS = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'maskable-512.png', size: 512, maskable: true },
  { name: 'apple-touch-icon.png', size: 180 }, // macOS/iOS home screen + dock
];

const browser = await chromium.launch();
const page = await browser.newPage();

for (const t of TARGETS) {
  const pad = t.maskable ? 64 : 0; // maskable: shrink glyph so safe-zone survives circular crop
  await page.setViewportSize({ width: t.size, height: t.size });
  await page.setContent(`
    <html><body style="margin:0;padding:0;width:${t.size}px;height:${t.size}px;background:#0b0918;display:flex;align-items:center;justify-content:center;">
      <div style="width:${t.size - pad * 2}px;height:${t.size - pad * 2}px;">${svg}</div>
    </body></html>
  `);
  await page.waitForTimeout(50);
  const out = path.join(OUT, t.name);
  await page.screenshot({ path: out, omitBackground: false });
  console.log('wrote', out);
}

await browser.close();
