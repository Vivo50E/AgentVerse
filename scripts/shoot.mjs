// Screenshot the app so we can actually see the UI.
// Usage: node scripts/shoot.mjs [--journey]
import { chromium } from 'playwright';

const withJourney = process.argv.includes('--journey');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1800);
await page.screenshot({ path: '/tmp/av-art/shot-main.png', fullPage: true });
console.log('main screenshot taken');

const loadoutBtn = page.getByText('⚙ Loadout');
if (await loadoutBtn.count()) {
  await loadoutBtn.first().click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/tmp/av-art/shot-loadout.png' });
  await page.keyboard.press('Escape').catch(() => {});
  // close by clicking the ✕ if Escape doesn't work
  const close = page.getByRole('button', { name: '✕' });
  if (await close.count()) await close.first().click().catch(() => {});
  console.log('loadout screenshot taken');
}

if (withJourney) {
  const start = page.getByText('Start Quest');
  if (await start.count()) {
    await start.first().click();
    for (const [ms, name] of [[6000, 'early'], [14000, 'mid'], [26000, 'late']]) {
      await page.waitForTimeout(name === 'early' ? ms : ms - (name === 'mid' ? 6000 : 14000));
      await page.screenshot({ path: `/tmp/av-art/shot-journey-${name}.png` });
      console.log(`journey ${name} screenshot taken`);
    }
  } else console.log('no Start Quest button');
}

console.log('console/page errors:', errors.length ? errors : 'none');
await browser.close();
