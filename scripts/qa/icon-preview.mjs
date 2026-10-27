// Icon preview sheet: docs/icon-preview.png. Shows the favicon.ico sizes at real pixels on a light and a dark browser tab strip,
// the 16 px one also enlarged 6x (nearest neighbour) to judge it pixel by pixel, then apple-icon, icon.png and the maskable icon.
// Run after `npm run brand`: node scripts/qa/icon-preview.mjs
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..', '..');
const p = (f) => path.join(root, f);
const siteName = 'Dent Plus';

// Pull the PNG frames out of favicon.ico (header: 6 bytes, then 16 bytes per entry).
const ico = fs.readFileSync(p('src/app/favicon.ico'));
const frames = {};
for (let i = 0; i < ico.readUInt16LE(4); i++) {
  const o = 6 + i * 16;
  const size = ico.readUInt8(o) || 256;
  frames[size] = ico.subarray(ico.readUInt32LE(o + 12), ico.readUInt32LE(o + 12) + ico.readUInt32LE(o + 8));
}

const W = 1240;
const H = 900;
const text = (x, y, t, { size = 18, fill = '#1E1B2E', weight = 400 } = {}) =>
  `<text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}">${t}</text>`;

// Tab strip: a bar with three tabs, the favicon at 16 px in each (as browsers draw it), plus 32 and 48 px samples beside it.
function strip(y, dark) {
  const bar = dark ? '#202124' : '#DEE1E6';
  const tab = dark ? '#35363A' : '#FFFFFF';
  const ink = dark ? '#E8EAED' : '#3C4043';
  let s = `<rect x="40" y="${y}" width="${W - 80}" height="64" rx="10" fill="${bar}"/>`;
  for (let i = 0; i < 3; i++) s += `<rect x="${56 + i * 250}" y="${y + 12}" width="236" height="44" rx="8" fill="${i === 0 ? tab : bar}" stroke="${dark ? '#4A4B4F' : '#C4C7CC'}"/>` + text(56 + i * 250 + 40, y + 40, i === 0 ? siteName : 'Other tab', { size: 15, fill: ink });
  s += text(840, y + 40, '32 px', { size: 14, fill: ink }) + text(960, y + 40, '48 px', { size: 14, fill: ink });
  return s;
}

const composites = [];
const place = (input, left, top) => composites.push({ input, left, top });
let body = `<rect width="${W}" height="${H}" fill="#F4F4F6"/>` + text(40, 50, 'Dent Plus: favicon and app icons', { size: 26, weight: 700 });
for (const [y, dark] of [[90, false], [180, true]]) {
  body += strip(y, dark);
  for (let i = 0; i < 3; i++) place(frames[16], 56 + i * 250 + 14, y + 24);
  place(frames[32], 885, y + 16);
  place(frames[48], 1010, y + 8);
}
// 16 px enlarged
body += text(40, 300, '16 px enlarged 6x (each square = 1 pixel)', { size: 16 });
const big16 = await sharp(frames[16]).resize(96, 96, { kernel: 'nearest' }).png().toBuffer();
body += `<rect x="40" y="315" width="96" height="96" fill="#FFFFFF"/><rect x="160" y="315" width="96" height="96" fill="#202124"/>`;
place(big16, 40, 315);
place(big16, 160, 315);
const big32 = await sharp(frames[32]).resize(96, 96, { kernel: 'nearest' }).png().toBuffer();
body += text(420, 300, '32 px enlarged 3x', { size: 16 }) + `<rect x="420" y="315" width="96" height="96" fill="#FFFFFF"/>`;
place(big32, 420, 315);

// App icons
body += text(40, 470, 'apple-icon 180 (iOS rounds it)', { size: 16 }) + text(300, 470, 'icon.png 512 (shown at 340)', { size: 16 }) + text(700, 470, 'maskable 512 (shown at 340, circle = safe zone)', { size: 16 });
place(fs.readFileSync(p('src/app/apple-icon.png')), 40, 490);
place(await sharp(p('src/app/icon.png')).resize(340).png().toBuffer(), 300, 490);
place(await sharp(p('public/icons/icon-maskable-512.png')).resize(340).png().toBuffer(), 700, 490);
const overlay = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="340" height="340"><circle cx="170" cy="170" r="136" fill="none" stroke="#FFFFFF" stroke-opacity=".7" stroke-dasharray="6 6" stroke-width="2"/></svg>`);
place(overlay, 700, 490);

const out = p('docs/icon-preview.png');
await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${body}</svg>`)).composite(composites).png({ compressionLevel: 9 }).toFile(out);
console.log(`wrote ${path.relative(root, out)}`);
