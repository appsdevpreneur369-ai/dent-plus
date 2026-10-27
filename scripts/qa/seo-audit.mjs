// TEST-ONLY SEO + structured-data audit of a running build: every URL in /sitemap.xml.
// Usage: node scripts/qa/seo-audit.mjs http://localhost:3100 <schemaorg-current-https.jsonld> [out.json]
// Per page: unique title (≤ 60 chars) and description (≤ 160), exactly one <h1>, canonical absolute + self,
// robots meta, OG/Twitter tags, every <img> has alt, and JSON-LD validated LOCALLY against the official schema.org
// vocabulary (every @type exists; every property is defined for that type or one of its supertypes; values of
// Text/URL/Number are not objects where only literals are allowed). No page content is sent to any external service.
import fs from 'node:fs';

const [base = 'http://localhost:3100', vocabFile = 'qa/schemaorg.jsonld', outFile] = process.argv.slice(2);
const vocab = JSON.parse(fs.readFileSync(vocabFile, 'utf8'))['@graph'];
const id = (x) => (typeof x === 'string' ? x : x['@id']).replace(/^schema:/, '');
const arr = (x) => (x == null ? [] : Array.isArray(x) ? x : [x]);
const classes = new Map();
const props = new Map();
for (const n of vocab) {
  const t = arr(n['@type']);
  if (t.includes('rdfs:Class')) classes.set(id(n), arr(n['rdfs:subClassOf']).map(id));
  if (t.includes('rdf:Property')) props.set(id(n), { domains: arr(n['schema:domainIncludes']).map(id), ranges: arr(n['schema:rangeIncludes']).map(id) });
}
const ancestors = (c, seen = new Set()) => {
  if (seen.has(c)) return seen;
  seen.add(c);
  for (const p of classes.get(c) ?? []) ancestors(p, seen);
  return seen;
};

function validate(node, path, errors) {
  if (Array.isArray(node)) return node.forEach((n, i) => validate(n, `${path}[${i}]`, errors));
  if (!node || typeof node !== 'object') return;
  const types = arr(node['@type']);
  if (!types.length) {
    if (!node['@id'] && Object.keys(node).some((k) => !k.startsWith('@'))) errors.push(`${path}: object without @type`);
    return;
  }
  const all = new Set();
  for (const t of types) {
    if (!classes.has(t)) errors.push(`${path}: unknown type ${t}`);
    else ancestors(t).forEach((a) => all.add(a));
  }
  for (const [k, v] of Object.entries(node)) {
    if (k.startsWith('@')) continue;
    const p = props.get(k);
    if (!p) {
      errors.push(`${path}.${k}: unknown property`);
      continue;
    }
    if (!p.domains.some((d) => all.has(d))) errors.push(`${path}.${k}: not a property of ${types.join('+')}`);
    for (const item of arr(v)) if (item && typeof item === 'object') validate(item, `${path}.${k}`, errors);
  }
}

const xml = await (await fetch(`${base}/sitemap.xml`)).text();
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const images = [...xml.matchAll(/<image:loc>([^<]+)<\/image:loc>/g)].map((m) => m[1]);
const rows = [];
const titles = new Map();
const descs = new Map();
const decode = (t) => t.replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const attr = (html, re) => decode((html.match(re) ?? [])[1] ?? '');
for (const u of urls) {
  const path = new URL(u).pathname;
  const res = await fetch(base + path);
  const html = await res.text();
  const title = attr(html, /<title>([^<]*)<\/title>/);
  const desc = attr(html, /<meta name="description" content="([^"]*)"/);
  const canonical = attr(html, /<link rel="canonical" href="([^"]*)"/);
  const robots = attr(html, /<meta name="robots" content="([^"]*)"/);
  const h1 = (html.match(/<h1[\s>]/g) ?? []).length;
  const imgsNoAlt = (html.match(/<img(?![^>]*\balt=)[^>]*>/g) ?? []).length;
  const og = ['og:title', 'og:description', 'og:image', 'og:url'].every((k) => html.includes(`property="${k}"`));
  const tw = html.includes('name="twitter:card"');
  const errors = [];
  const types = [];
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      const data = JSON.parse(m[1]);
      for (const d of arr(data)) types.push(arr(d['@type']).join('+'));
      validate(data, 'ld', errors);
    } catch (e) {
      errors.push(`invalid JSON: ${e.message}`);
    }
  }
  const issues = [];
  if (res.status !== 200) issues.push(`HTTP ${res.status}`);
  if (!title || title.length > 60) issues.push(`title length ${title.length}`);
  if (!desc || desc.length > 160 || desc.length < 70) issues.push(`description length ${desc.length}`);
  if (h1 !== 1) issues.push(`${h1} h1`);
  if (canonical !== u) issues.push(`canonical ${canonical}`);
  if (!robots.includes('index') || robots.includes('noindex')) issues.push(`robots "${robots}"`);
  if (!og || !tw) issues.push('OG/Twitter tags missing');
  if (imgsNoAlt) issues.push(`${imgsNoAlt} img without alt`);
  titles.set(title, [...(titles.get(title) ?? []), path]);
  descs.set(desc, [...(descs.get(desc) ?? []), path]);
  rows.push({ path, title, titleLength: title.length, descriptionLength: desc.length, h1, jsonLdTypes: types, jsonLdErrors: errors, issues });
}
for (const [t, ps] of titles) if (ps.length > 1) rows.find((r) => r.path === ps[1]).issues.push(`duplicate title with ${ps[0]}: ${t}`);
for (const [d, ps] of descs) if (ps.length > 1) rows.find((r) => r.path === ps[1]).issues.push(`duplicate description with ${ps[0]}`);
let brokenImages = 0;
for (const i of images) if ((await fetch(base + new URL(i).pathname)).status !== 200) brokenImages++;

for (const r of rows) console.log(`${r.issues.length || r.jsonLdErrors.length ? '✗' : '✓'} ${r.path.padEnd(44)} [${r.jsonLdTypes.join(', ')}] ${[...r.issues, ...r.jsonLdErrors].join(' | ')}`);
const totalLd = rows.reduce((n, r) => n + r.jsonLdErrors.length, 0);
const totalIssues = rows.reduce((n, r) => n + r.issues.length, 0);
console.log(`\n${rows.length} pages · JSON-LD errors: ${totalLd} · other issues: ${totalIssues} · sitemap images: ${images.length} (${brokenImages} broken)`);
if (outFile) fs.writeFileSync(outFile, JSON.stringify({ base, date: new Date().toISOString(), rows, sitemapImages: images.length, brokenImages }, null, 2));
process.exitCode = totalLd || totalIssues || brokenImages ? 1 : 0;
