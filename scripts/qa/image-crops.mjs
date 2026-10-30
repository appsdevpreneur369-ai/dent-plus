// TEST-ONLY: how much of every image is visible in its frame, on every sitemap page at 360/768/1280.
// object-fit: cover crops the photo to the frame; this reports the visible share per axis (100% = nothing cut).
// Images that carry lettering (signboards, wall panels) must show 100% across; photos of rooms may crop.
// Usage: node scripts/qa/image-crops.mjs http://localhost:3107 [minVisible=0.9] [shotsDir]
// With shotsDir: one screenshot per distinct image + frame size (to eyeball that the subject stays in view).
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';

const [base = 'http://localhost:3107', minArg = '0.9', shots] = process.argv.slice(2);
if (shots) fs.mkdirSync(shots, { recursive: true });
const shot = new Set();
const min = Number(minArg);
// Lettering that must never be cut on the sides or top/bottom.
const TEXT_IMAGES = ['clinic-name-board', 'clinic-smile-wall', 'clinic-family-eye-care', 'clinic-signboard-telugu', 'dept-children', 'dept-eyes', 'logo-mark'];

const sitemap = await (await fetch(`${base}/sitemap.xml`)).text();
const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage();
const rows = [];
for (const p of paths) {
  for (const w of [360, 768, 1280]) {
    await page.setViewport({ width: w, height: 900 });
    await page.goto(base + p, { waitUntil: 'networkidle0' });
    // Load lazy images: scroll through the page.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 40));
      }
    });
    // Hidden images (inactive tabs, the closed photo viewer) never load: cap the wait.
    await page.evaluate(() => Promise.race([Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; })))), new Promise((r) => setTimeout(r, 3000))]));
    const found = await page.evaluate(() =>
      [...document.images]
        .filter((i) => i.offsetParent !== null && i.clientWidth > 0 && i.naturalWidth > 0)
        .map((i) => {
          const fit = getComputedStyle(i).objectFit;
          const imgAR = i.naturalWidth / i.naturalHeight;
          const boxAR = i.clientWidth / i.clientHeight;
          let visW = 1, visH = 1;
          if (fit === 'cover') {
            if (imgAR > boxAR) visW = boxAR / imgAR;
            else visH = imgAR / boxAR;
          }
          const name = (i.currentSrc || i.src).split('/').pop().replace(/-\d+\.webp$/, '').replace(/\.\w+$/, '');
          i.dataset.qaIdx = String([...document.images].indexOf(i));
          return { name, fit, visW, visH, box: `${i.clientWidth}x${i.clientHeight}`, idx: i.dataset.qaIdx };
        }),
    );
    if (shots)
      for (const f of found) {
        const key = `${f.name}@${f.box}`;
        if (shot.has(key) || (!TEXT_IMAGES.includes(f.name) && Math.min(f.visW, f.visH) > 0.97)) continue;
        shot.add(key);
        const el = await page.$(`img[data-qa-idx="${f.idx}"]`);
        await el.scrollIntoView();
        const parent = (await el.evaluateHandle((n) => n.parentElement)).asElement();
        await (parent ?? el).screenshot({ path: `${shots}/${f.name}__${w}__${p.split('/').join('_') || 'home'}__${f.box}.png` }).catch(() => {});
      }
    for (const f of found) rows.push({ page: p, width: w, ...f });
  }
}
await browser.close();

const pct = (x) => `${Math.round(x * 100)}%`;
let bad = 0;
const seen = new Set();
for (const r of rows.sort((a, b) => Math.min(a.visW, a.visH) - Math.min(b.visW, b.visH))) {
  const isText = TEXT_IMAGES.includes(r.name);
  const fail = isText ? Math.min(r.visW, r.visH) < 0.995 : Math.min(r.visW, r.visH) < min;
  if (!fail) continue;
  const key = `${r.page}|${r.name}|${r.width}`;
  if (seen.has(key)) continue;
  seen.add(key);
  bad++;
  console.log(`${isText ? 'TEXT ' : 'PHOTO'} ${r.name.padEnd(28)} ${r.page.padEnd(44)} @${String(r.width).padEnd(4)} visible W ${pct(r.visW).padStart(4)} H ${pct(r.visH).padStart(4)}  box ${r.box}`);
}
const names = [...new Set(rows.map((r) => r.name))];
console.log(`\n${paths.length} pages × 3 widths · ${rows.length} image renders · ${names.length} distinct images · ${bad} below threshold (text images: 100%, photos: ${pct(min)})`);
