// Duplicate-copy guard: no run of 8+ words in Dent Plus may repeat the other ClinicFlow247 clinic sites (AISHWARYA,
// SPDC, DR-SINDHU, SMSDC: several in the same city), which would be duplicate content for Google.
// Compares OUR /content and OUR built HTML (.next/server/app, when built) against THEIR content folders AND their built
// HTML. Reads the other projects READ-ONLY. Runs after `next build` in `npm run check`.
// Run: npm run originality   (a sibling folder that isn't on this machine is skipped and reported, e.g. in Docker/CI)
// Ignores _note fields, keys, URLs, {{tokens}}, and the fixed statute names every Indian privacy policy must use.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const SIBLINGS = {
  AISHWARYA: { content: 'D:/AISHWARYA/content', html: 'D:/AISHWARYA/.next/server/app', src: 'D:/AISHWARYA/src' },
  SPDC: { content: 'D:/SPDC/content', html: 'D:/SPDC/.next/server/app', src: 'D:/SPDC/src' },
  'DR-SINDHU': { content: 'D:/DR-SINDHU/content', html: 'D:/DR-SINDHU/.next/server/app', src: 'D:/DR-SINDHU/src' },
  SMSDC: { content: 'D:/SMSDC/site/content', html: 'D:/SMSDC/site/.next/server/app', src: 'D:/SMSDC/site/src' },
};
const N = 8; // shingle length in words
const STATUTES = [/digital personal data protection act,? 2023( \(dpdp act\))?/gi, /data protection board of india/gi];

function files(dir, re) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return files(p, re);
    return re.test(e.name) ? [p] : [];
  });
}
/** Visible strings of a content file (JSON values except _notes; Markdown body + title/description). */
function contentStrings(file) {
  const raw = fs.readFileSync(file, 'utf8');
  if (file.endsWith('.md')) return [raw.replace(/^---[\s\S]*?---/, (fm) => fm.split('\n').filter((l) => /^(title|description):/.test(l)).join('\n'))];
  const out = [];
  (function walk(v, key) {
    if (typeof key === 'string' && key.startsWith('_')) return;
    if (typeof v === 'string') out.push(v);
    else if (Array.isArray(v)) v.forEach((x) => walk(x));
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, k);
  })(JSON.parse(raw));
  return out;
}
/** Visible text of a built page: scripts/styles removed, tags turned into breaks, entities decoded. */
function htmlStrings(file) {
  const html = fs.readFileSync(file, 'utf8')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<(br|\/p|\/li|\/h\d|\/div|\/section|\/a|\/button|\/dt|\/dd|\/summary|\/span)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&#x27;|&#39;|&rsquo;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ').replace(/&[a-z]+;|&#\d+;/g, ' ');
  return [html];
}
/** UI copy inside components (string literals and JSX text of 8+ words), e.g. booking messages that only render in the browser. */
function srcStrings(file) {
  const code = fs.readFileSync(file, 'utf8').replace(/^\s*(\/\/|\*|\/\*).*$/gm, ' ');
  const out = [];
  for (const m of code.matchAll(/'((?:[^'\\\n]|\\.){30,})'|"((?:[^"\\\n]|\\.){30,})"|`([^`]{30,})`|>([^<>{}]{30,})</g)) out.push((m[1] ?? m[2] ?? m[3] ?? m[4]).replace(/&apos;/g, "'"));
  // Prose only: Tailwind class lists and code (tokens with - [ ] : / = ( ) or digits) are shared by design, not copy.
  const prose = (t) => {
    const tok = t.trim().split(/\s+/);
    return tok.length >= N && tok.filter((w) => /^[A-Za-z’'.,;:!?—–-]+$/.test(w) && !/^[a-z]+-[a-z-]+$/.test(w)).length / tok.length >= 0.8;
  };
  return out.filter(prose);
}
const words = (s) =>
  STATUTES.reduce((t, re) => t.replace(re, ' '), s).replace(/https?:\/\/\S+/g, ' ').replace(/\{\{\w+\}\}/g, ' ').toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9' ]+/g, ' ').split(/\s+/).filter(Boolean);
function shingles(text) {
  const out = new Map();
  for (const s of text.split(/(?<=[.!?])\s+|\n+/)) {
    const w = words(s);
    for (let i = 0; i + N <= w.length; i++) out.set(w.slice(i, i + N).join(' '), s.trim().replace(/\s+/g, ' '));
  }
  return out;
}

const ours = new Map();
const add = (label, strs) => { for (const s of strs) for (const [k, v] of shingles(s)) if (!ours.has(k)) ours.set(k, { file: label, text: v }); };
for (const f of files(path.join(root, 'content'), /\.(json|md)$/)) add(path.relative(root, f), contentStrings(f));
const ourHtml = files(path.join(root, process.env.NEXT_DIST_DIR || '.next', 'server/app'), /\.html$/);
for (const f of ourHtml) add(`built ${path.relative(path.join(root, process.env.NEXT_DIST_DIR || '.next', 'server/app'), f)}`, htmlStrings(f));
// UI code only (pages + components). src/lib is the shared engineering layer (log messages, not patient-facing copy).
for (const f of ['app', 'components'].flatMap((d) => files(path.join(root, 'src', d), /\.tsx?$/))) add(path.relative(root, f), srcStrings(f));
console.log(`ours: ${ours.size} phrases (${ourHtml.length} built pages${ourHtml.length ? '' : ': run after `next build` to include them'})`);

let checked = 0;
const hits = [];
for (const [name, src] of Object.entries(SIBLINGS)) {
  const theirs = new Set();
  const cFiles = files(src.content, /\.(json|md)$/).filter((f) => !/photo-credits\.json$/.test(f));
  const hFiles = files(src.html, /\.html$/);
  const sFiles = ['app', 'components'].flatMap((d) => files(path.join(src.src, d), /\.tsx?$/));
  if (!cFiles.length && !hFiles.length) {
    console.log(`skip  ${name} (not found on this machine)`);
    continue;
  }
  checked++;
  for (const f of cFiles) for (const s of contentStrings(f)) for (const k of shingles(s).keys()) theirs.add(k);
  for (const f of hFiles) for (const s of htmlStrings(f)) for (const k of shingles(s).keys()) theirs.add(k);
  for (const f of sFiles) for (const s of srcStrings(f)) for (const k of shingles(s).keys()) theirs.add(k);
  const seen = new Set();
  for (const [k, v] of ours) if (theirs.has(k) && !seen.has(v.text)) { seen.add(v.text); hits.push({ site: name, ...v, phrase: k }); }
  console.log(`check ${name}: ${cFiles.length} content files + ${hFiles.length} built pages + ${sFiles.length} source files, ${theirs.size} phrases`);
}
for (const h of hits) console.log(`DUPLICATE (${h.site}) ${h.file}: "${h.phrase}"\n    in: ${h.text.slice(0, 200)}`);
if (hits.length) {
  console.error(`\n${hits.length} passage(s) repeat another clinic's site (${N}-word window). Rewrite them.`);
  process.exit(1);
}
console.log(checked ? `\nOriginal: no ${N}-word run repeats ${checked} sibling site(s).` : '\nNo sibling sites found; nothing compared.');
