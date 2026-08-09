import QRCode from 'qrcode';
import fs from 'node:fs/promises';
import path from 'node:path';
const target = process.argv[2] || 'https://vivo50e.github.io/AgentVerse/';
const svg = await QRCode.toString(target, {
  type: 'svg',
  errorCorrectionLevel: 'M',
  margin: 1,
  color: { dark: '#0d0b1a', light: '#ffffff' },
});
const out = path.join(process.cwd(), 'public', 'promo-qr.svg');
await fs.writeFile(out, svg);
console.log('wrote', out, 'for', target);
