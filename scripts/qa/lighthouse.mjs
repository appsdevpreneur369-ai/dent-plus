// TEST-ONLY: Lighthouse 12 (mobile + desktop) on a LOCAL production build. HTML + JSON reports + summary.
// Usage: node scripts/qa/lighthouse.mjs http://localhost:3100 docs/seo-reports/<date> [path ...]
// Build first with NEXT_PUBLIC_SITE_ENV=production (otherwise noindex costs the SEO score by design).
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const [base = 'http://localhost:3100', out = 'docs/seo-reports/latest', ...only] = process.argv.slice(2);
const ROUTES = only.length ? only : ['/', '/departments/dental', '/treatments/dental-implants', '/doctors/dr-b-deepthi', '/contact', '/book'];
const chrome = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
fs.mkdirSync(out, { recursive: true });
const rows = [];

for (const form of ['mobile', 'desktop']) {
  for (const r of ROUTES) {
    const name = `${form}-${r === '/' ? 'home' : r.slice(1).replace(/\//g, '_')}`;
    const file = path.join(out, name);
    const args = [
      '-y', 'lighthouse@12', `${base}${r}`, '--quiet', '--output=html', '--output=json', `--output-path=${file}`,
      '--only-categories=performance,accessibility,best-practices,seo', `--chrome-path="${chrome}"`, '--chrome-flags="--headless=new --no-sandbox"',
      ...(form === 'desktop' ? ['--preset=desktop'] : []),
    ];
    execFileSync('npx', args, { stdio: 'pipe', shell: true, timeout: 240000 });
    const j = JSON.parse(fs.readFileSync(`${file}.report.json`, 'utf8'));
    const s = (k) => Math.round((j.categories[k]?.score ?? 0) * 100);
    const failing = Object.values(j.categories)
      .flatMap((c) => c.auditRefs.filter((a) => a.weight > 0).map((a) => j.audits[a.id]))
      .filter((a) => a.score !== null && a.score < 0.9)
      .map((a) => `${a.id}${a.displayValue ? ` (${a.displayValue})` : ''}`);
    const row = {
      form, path: r, performance: s('performance'), accessibility: s('accessibility'), bestPractices: s('best-practices'), seo: s('seo'),
      lcp: j.audits['largest-contentful-paint'].displayValue, cls: j.audits['cumulative-layout-shift'].displayValue, tbt: j.audits['total-blocking-time'].displayValue, failing,
    };
    rows.push(row);
    console.log(`${form.padEnd(7)} ${r.padEnd(24)} P${row.performance} A${row.accessibility} BP${row.bestPractices} SEO${row.seo}  LCP ${row.lcp} CLS ${row.cls} TBT ${row.tbt}${failing.length ? `  ⚠ ${failing.join(', ')}` : ''}`);
  }
}
fs.writeFileSync(path.join(out, 'summary.json'), JSON.stringify({ base, date: new Date().toISOString(), rows }, null, 2));
const bad = rows.filter((r) => r.seo < 100 || r.accessibility < 95 || r.bestPractices < 95 || (r.form === 'mobile' && r.performance < 90));
console.log(bad.length ? `\n${bad.length} run(s) below target` : '\nAll runs meet targets (SEO 100, A11y ≥95, BP ≥95, mobile Perf ≥90).');
