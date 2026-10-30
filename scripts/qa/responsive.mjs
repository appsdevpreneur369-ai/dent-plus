// TEST-ONLY: every sitemap page at 17 widths (small phones to wide desktops). Fails on: page wider than the screen,
// visible elements cut off at the screen edge, header items overlapping each other, and pages without exactly one <h1>.
// Usage: node scripts/qa/responsive.mjs http://localhost:3107 [shotsDir]   (shotsDir: home + one inner page per width)
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';

const [base = 'http://localhost:3107', shots] = process.argv.slice(2);
const WIDTHS = [320, 360, 375, 390, 412, 430, 480, 600, 768, 820, 912, 1024, 1180, 1280, 1366, 1536, 1920];
if (shots) fs.mkdirSync(shots, { recursive: true });

const sitemap = await (await fetch(`${base}/sitemap.xml`)).text();
const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage();
const problems = [];
for (const w of WIDTHS) {
  await page.setViewport({ width: w, height: w < 768 ? 800 : 900 });
  for (const p of paths) {
    await page.goto(base + p, { waitUntil: 'networkidle0' });
    const r = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const overflow = document.documentElement.scrollWidth - vw;
      // Visible elements sticking out past the screen edge (ignoring off-screen-by-design: sr-only, hidden, scrollers).
      const clipped = [];
      for (const el of document.querySelectorAll('body *')) {
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || cs.display === 'none' || el.closest('[hidden], .sr-only, dialog:not([open])')) continue;
        let a = el.parentElement, scroller = false;
        while (a) {
          const o = getComputedStyle(a).overflowX;
          if (o === 'auto' || o === 'scroll' || o === 'hidden' || o === 'clip') { scroller = true; break; }
          a = a.parentElement;
        }
        if (scroller) continue;
        const b = el.getBoundingClientRect();
        if (b.width === 0 || b.height === 0) continue;
        if (b.left < -1 || b.right > vw + 1) clipped.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0] || ''} ${Math.round(b.left)}..${Math.round(b.right)}`);
      }
      // Header items must not overlap (logo, nav, actions).
      const items = [...document.querySelectorAll('header .container-site > *')].filter((e) => getComputedStyle(e).display !== 'none').map((e) => e.getBoundingClientRect());
      let overlap = false;
      for (let i = 1; i < items.length; i++) if (items[i].left < items[i - 1].right - 1 && items[i].width && items[i - 1].width) overlap = true;
      return { overflow, clipped: clipped.slice(0, 3), h1: document.querySelectorAll('h1').length, overlap };
    });
    if (r.overflow > 0 || r.clipped.length || r.h1 !== 1 || r.overlap) problems.push({ w, p, ...r });
    if (shots && (p === '/' || p === '/treatments')) await page.screenshot({ path: `${shots}/${p === '/' ? 'home' : 'treatments'}-${w}.png`, fullPage: true });
  }
  console.log(`${w}px: ${paths.length} pages checked`);
}
await browser.close();
for (const x of problems) console.log(`✗ ${String(x.w).padStart(4)}px ${x.p.padEnd(46)} overflow ${x.overflow}px h1 ${x.h1}${x.overlap ? ' HEADER OVERLAP' : ''} ${x.clipped.join(' | ')}`);
console.log(`\n${WIDTHS.length} widths × ${paths.length} pages = ${WIDTHS.length * paths.length} renders · ${problems.length} with problems`);
process.exit(problems.length ? 1 : 0);
