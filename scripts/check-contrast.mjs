// WCAG 2.x contrast check for every text/background pair the site uses. Run: npm run contrast
// Fails (exit 1) if any pair is below its minimum: 4.5:1 normal text, 3:1 large text (≥24px, or ≥18.66px bold) / UI.
// Colours named decorative* are checked as INFO only: they may never be used for text.
import fs from 'node:fs';

const { colors: c } = JSON.parse(fs.readFileSync(new URL('../content/brand.json', import.meta.url), 'utf8'));

const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

// Semi-transparent fills behind text, blended exactly as the CSS draws them.
const mix = (a, b, t) => '#' + [1, 3, 5].map((i) => Math.round(parseInt(a.slice(i, i + 2), 16) * t + parseInt(b.slice(i, i + 2), 16) * (1 - t)).toString(16).padStart(2, '0')).join('');
c.ctaWhite85 = mix(c.onDark, c.primary, 0.85); // closing CTA lead: white at 85% on primary
c.whiteOnImage = mix(c.surface, c.navy, 0.9); // photo caption chips: surface at 90% (worst case over a dark photo)
c.skyRing = mix(c.sky, c.primary, 0.4); // CTA band ring over primary (decoration behind text edge)

const N = 4.5; // normal text
const L = 3.0; // large text / UI components
// [foreground, background, minimum, where]
const pairs = [
  ['text', 'background', N, 'body text'],
  ['text', 'surfaceAlt', N, 'text on alternate sections'],
  ['text', 'skySoft', N, 'text on sky tints (selected chips, notes)'],
  ['textSecondary', 'background', N, 'muted text'],
  ['textSecondary', 'surfaceAlt', N, 'muted text on alternate sections'],
  ['textSecondary', 'skySoft', N, 'muted text on sky tint'],
  ['primary', 'background', N, 'links, eyebrows'],
  ['primary', 'surfaceAlt', N, 'links on alternate sections'],
  ['primary', 'skySoft', N, 'icons / links on sky tint'],
  ['primaryDeep', 'skySoft', N, 'chip-static text, selected quick-book tile'],
  ['navy', 'background', N, 'wordmark, phone links'],
  ['navy', 'whiteOnImage', N, 'photo caption chips'],
  ['navy', 'sky', N, 'selected department tab (navy text on sky)'],
  ['onDark', 'primary', N, 'primary buttons'],
  ['onDark', 'primaryHover', N, 'primary button hover'],
  ['onDark', 'navy', N, 'footer, department band, dark cards'],
  ['onDark', 'navySoft', N, 'cards and chips on navy'],
  ['onDarkMuted', 'navy', N, 'muted text on navy'],
  ['onDarkMuted', 'navySoft', N, 'muted text on navy cards'],
  ['skyOnDark', 'navy', N, 'eyebrows, links, icons on navy'],
  ['skyOnDark', 'navySoft', N, 'icons on navy cards'],
  ['ctaWhite85', 'primary', N, 'closing CTA lead text'],
  ['navy', 'surface', N, 'light button on dark bands'],
  ['onDark', 'whatsapp', N, 'WhatsApp button'],
  ['warningText', 'warningSoft', N, 'Draft badge, closed-now pill, errors'],
  ['warning', 'background', N, 'field errors (no red)'],
  ['success', 'successSoft', N, 'open-now pill'],
  ['success', 'background', N, 'open-now plain'],
  ['primary', 'background', L, 'UI: focus ring on light backgrounds'],
  ['sky', 'background', 1.0, 'INFO: sky on white is decoration only (step bar beside "Step x of y" text, "+" markers); never text or focus'],
  ['onDark', 'sky', 1.0, 'INFO: white "+" inside the sky circle (logo glyph, decorative)'],
  ['sky', 'navy', L, 'UI: sky tab border / ring on navy'],
  ['border', 'background', 1.0, 'INFO: border colour (non-text)'],
];

let fail = 0;
for (const [fg, bg, min, where] of pairs) {
  if (!c[fg] || !c[bg]) throw new Error(`unknown colour ${fg} or ${bg}`);
  const r = ratio(c[fg], c[bg]);
  const info = where.startsWith('INFO');
  const ok = r >= min;
  if (!ok && !info) fail++;
  console.log(`${ok ? 'PASS' : info ? 'info' : 'FAIL'}  ${r.toFixed(2).padStart(5)}:1  (min ${min})  ${fg} ${c[fg]} on ${bg} ${c[bg]}  — ${where}`);
}
console.log(fail ? `\n${fail} pair(s) below WCAG AA` : '\nAll text pairs meet WCAG AA.');
process.exitCode = fail ? 1 : 0;
