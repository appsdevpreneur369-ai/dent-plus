// Side-by-side of two home pages (proof the design differs). Usage:
//   node scripts/qa/compare-home.mjs <our base> <other site URL> qa/compare
// Captures the first 2400 px at 1280 and the first screen at 360 of both, writes compare-1280.png / compare-360.png.
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';
import sharp from 'sharp';

const [ours = 'http://localhost:3300', theirs, out = 'qa/compare'] = process.argv.slice(2);
if (!theirs) throw new Error('usage: compare-home.mjs <our base> <other site URL> [outDir]');
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });

async function capture(url, width, height, file) {
  const page = await browser.newPage();
  await page.evaluateOnNewDocument(() => {
    for (const k of ['adc.bookingPopup', 'dpc.bookingPopup']) sessionStorage.setItem(k, 'closed');
  });
  await page.setViewport({ width, height: 900, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 90000 });
  await page.evaluate(async () => {
    for (let y = 0; y < 3000; y += 300) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 150)); }
    window.scrollTo(0, 0);
    document.querySelectorAll('.reveal').forEach((e) => e.classList.add('is-visible'));
  });
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: file, clip: { x: 0, y: 0, width, height } });
  await page.close();
}

for (const [w, h] of [[1280, 2400], [360, 1400]]) {
  const a = `${out}/dentplus-${w}.png`;
  const b = `${out}/other-${w}.png`;
  await capture(ours, w, h, a);
  await capture(theirs, w, h, b);
  const label = (t) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="60"><rect width="100%" height="100%" fill="#111"/><text x="20" y="40" font-family="Arial" font-size="28" fill="#fff">${t}</text></svg>`);
  const gap = 40;
  await sharp({ create: { width: w * 2 + gap, height: h + 60, channels: 3, background: '#111' } })
    .composite([
      { input: label('Dent Plus (this site)'), left: 0, top: 0 },
      { input: a, left: 0, top: 60 },
      { input: label('Aishwarya Dental (D:\\AISHWARYA, staging)'), left: w + gap, top: 0 },
      { input: b, left: w + gap, top: 60 },
    ])
    .png()
    .toFile(`${out}/compare-${w}.png`);
  console.log(`wrote ${out}/compare-${w}.png`);
}
await browser.close();
