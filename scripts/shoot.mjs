// Screenshot the app so we can actually see the UI. Usage: node scripts/shoot.mjs
import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
await page.screenshot({ path: '/tmp/av-art/shot-main.png', fullPage: true });

// open the loadout panel
const btn = page.getByText('⚙ Loadout');
if (await btn.count()) {
  await btn.first().click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: '/tmp/av-art/shot-loadout.png' });
  console.log('loadout screenshot taken');
} else {
  console.log('NO ⚙ Loadout button found');
}

console.log('console/page errors:', errors.length ? errors : 'none');
await browser.close();
