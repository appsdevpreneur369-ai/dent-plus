// QA screenshots of a running build. Usage: node scripts/qa/screens.mjs http://localhost:3300 qa/screens [paths...]
// Full-page PNGs at 360, 768 and 1280 px; also reports horizontal overflow and tap targets < 44px.
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';

const [base = 'http://localhost:3300', out = 'qa/screens', ...paths] = process.argv.slice(2);
const pages = paths.length ? paths : ['/', '/departments/dental', '/departments/children', '/treatments/dental-implants', '/doctors/dr-b-deepthi', '/about', '/gallery', '/contact', '/book'];
const widths = [360, 768, 1280];
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage();
// Keep the auto-popup out of layout screenshots.
await page.evaluateOnNewDocument(() => sessionStorage.setItem('dpc.bookingPopup', 'closed'));
const report = [];
for (const p of pages) {
  for (const w of widths) {
    await page.setViewport({ width: w, height: 800, deviceScaleFactor: 1 });
    await page.goto(base + p, { waitUntil: 'load', timeout: 60000 });
    await new Promise((r) => setTimeout(r, 700));
    // Scroll through so lazy images load, then back to the top.
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 300) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 200)); } window.scrollTo(0, 0); });
    await new Promise((r) => setTimeout(r, 800));
    await page.evaluate(() => document.querySelectorAll('.reveal').forEach((e) => e.classList.add('is-visible')));
    await new Promise((r) => setTimeout(r, 900));
    const r = await page.evaluate(() => {
      const overflow = document.documentElement.scrollWidth - window.innerWidth;
      const small = [...document.querySelectorAll('a[href],button,input,select,summary')]
        .filter((el) => el.offsetParent !== null && !el.closest('.prose-site') && !el.closest('nav[aria-label="Breadcrumb"]') && getComputedStyle(el).visibility !== 'hidden')
        .map((el) => ({ el, r: el.getBoundingClientRect() }))
        .filter(({ el, r }) => r.width > 0 && (r.height < 44 || r.width < 44) && !(el.tagName === 'INPUT' && el.type === 'checkbox'))
        .map(({ el, r }) => `${el.tagName.toLowerCase()} "${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 30)}" ${Math.round(r.width)}x${Math.round(r.height)}`);
      return { overflow, small: small.slice(0, 12), h1: document.querySelectorAll('h1').length };
    });
    report.push({ page: p, width: w, ...r });
    const name = `${p === '/' ? 'home' : p.slice(1).replace(/\//g, '_')}-${w}.png`;
    await page.screenshot({ path: `${out}/${name}`, fullPage: true });
  }
}
await browser.close();
fs.writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 2));
for (const r of report) console.log(`${r.page} @${r.width}: overflow=${r.overflow}px h1=${r.h1} smallTargets=${r.small.length}${r.small.length ? ' → ' + r.small.join(' | ') : ''}`);
