// Builds every logo/icon size from the vector master brand/dent-plus-mark.svg (approved by the owner, 27 Oct 2026),
// plus the Open Graph card. Same outputs as the AISHWARYA generator, drawn from the SVG instead of a bitmap.
// Run: npm run brand   (re-run after editing the SVG or brand.json colours)
// Outputs: public/brand/logo-mark.png, src/app/icon.png, src/app/apple-icon.png, src/app/favicon.ico (16/32/48),
//          public/icons/icon-{192,512,maskable-512}.png, public/images/og.png
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const read = (f) => JSON.parse(fs.readFileSync(path.join(root, f), 'utf8'));
const { colors: c, wordmark } = read('content/brand.json');
const clinic = read('content/clinic.json');
const departments = read('content/departments.json').departments;
const out = (p) => {
  const full = path.join(root, p);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  return full;
};

const master = fs.readFileSync(path.join(root, 'brand/dent-plus-mark.svg'), 'utf8');
const inner = master.match(/<g transform="[^"]+">([\s\S]*)<\/g>\s*<\/svg>/)[1];
const tileColour = master.match(/<rect width="512" height="512" rx="\d+" fill="(#[0-9A-Fa-f]{6})"/)[1];

/** The mark on a 512 canvas: rounded tile (rx) or full square, artwork scaled by `scale` around the centre. */
function markSvg({ rx = 58, scale = 1, simple = false } = {}) {
  let art = inner;
  // 16 px: the implant thread and the cusp groove turn to noise; keep tooth, swoosh and "+" only.
  if (simple) art = art.replace(/<!-- Implant thread -->[\s\S]*?<\/g>/, '').replace(/<!-- Cusp groove -->\s*<path[^>]*\/>/, '');
  const t = `translate(256 256) scale(${scale}) translate(-256 -256) translate(-14 -10) scale(1.245)`;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="${rx}" fill="${tileColour}"/><g transform="${t}">${art}</g></svg>`);
}
const png = (svgBuf, size) => sharp(svgBuf, { density: Math.max(72, Math.ceil((72 * size) / 512) * 2) }).resize(size, size).png({ compressionLevel: 9 }).toBuffer();

fs.writeFileSync(out('public/brand/logo-mark.png'), await png(markSvg(), 512));
fs.writeFileSync(out('src/app/icon.png'), await png(markSvg(), 512));
fs.writeFileSync(out('public/icons/icon-192.png'), await png(markSvg(), 192));
fs.writeFileSync(out('public/icons/icon-512.png'), await png(markSvg(), 512));
// iOS rounds the apple-icon itself: full opaque square, artwork slightly smaller.
fs.writeFileSync(out('src/app/apple-icon.png'), await png(markSvg({ rx: 0, scale: 0.88 }), 180));
// Maskable: full bleed, artwork inside the 80% safe zone.
fs.writeFileSync(out('public/icons/icon-maskable-512.png'), await png(markSvg({ rx: 0, scale: 0.74 }), 512));

// favicon.ico with embedded 16/32/48 PNGs (16 px uses the simplified mark, a slightly larger tooth and tighter corners).
const icoSizes = [16, 32, 48];
const pngs = await Promise.all(icoSizes.map((s) => png(s === 16 ? markSvg({ rx: 70, scale: 1.12, simple: true }) : markSvg({ rx: 70 }), s)));
const header = Buffer.alloc(6 + 16 * pngs.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(pngs.length, 4);
let offset = header.length;
pngs.forEach((p, i) => {
  const o = 6 + i * 16;
  header.writeUInt8(icoSizes[i] % 256, o);
  header.writeUInt8(icoSizes[i] % 256, o + 1);
  header.writeUInt16LE(1, o + 4);
  header.writeUInt16LE(32, o + 6);
  header.writeUInt32LE(p.length, o + 8);
  header.writeUInt32LE(offset, o + 12);
  offset += p.length;
});
fs.writeFileSync(out('src/app/favicon.ico'), Buffer.concat([header, ...pngs]));

// ---------- Open Graph card (1200x630): the clinic's lit name board (owner's photo, 30 Oct 2026) over a navy strip ----------
// The board is what patients recognise; link previews on WhatsApp show it. Falls back to a drawn card without the photo.
const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const boardPhoto = out('public/images/photos/clinic-name-board.jpg');
if (fs.existsSync(boardPhoto)) {
  const strip = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="92">
  <rect width="1200" height="92" fill="${c.navy}"/>
  <text x="108" y="44" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="700" fill="${c.onDark}">${esc(wordmark.primary)} <tspan fill="${c.skyOnDark}" font-size="22" letter-spacing="3">${esc(wordmark.secondary.toUpperCase())}</tspan></text>
  <text x="108" y="76" font-family="Arial, Helvetica, sans-serif" font-size="22" fill="${c.onDarkMuted}">${esc(clinic.tagline.value)} · ${esc(departments.map((d) => d.shortTitle).join(' · '))} · ${esc(clinic.address.locality)}</text>
</svg>`);
  await sharp({ create: { width: 1200, height: 630, channels: 3, background: c.navy } })
    .composite([
      { input: await sharp(boardPhoto).resize(1200, 538, { fit: 'cover' }).toBuffer(), left: 0, top: 0 },
      { input: strip, left: 0, top: 538 },
      { input: await png(markSvg(), 68), left: 24, top: 550 },
    ])
    .png({ compressionLevel: 9 })
    .toFile(out('public/images/og.png'));
} else {
  const og = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="${c.navy}"/>
  <circle cx="1130" cy="40" r="300" fill="none" stroke="${c.sky}" stroke-opacity=".35" stroke-width="56"/>
  <text x="380" y="245" font-family="Arial, Helvetica, sans-serif" font-size="92" font-weight="700" letter-spacing="-3" fill="${c.onDark}">${esc(wordmark.primary)}</text>
  <text x="384" y="298" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="700" letter-spacing="6" fill="${c.skyOnDark}">${esc(wordmark.secondary.toUpperCase())}</text>
  <text x="384" y="370" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="${c.onDarkMuted}">${esc(clinic.tagline.value)} · ${esc(clinic.address.locality)}</text>
  ${departments.map((d, i) => `<rect x="${384 + i * 190}" y="420" width="176" height="56" rx="28" fill="none" stroke="${c.onDark}" stroke-opacity=".35" stroke-width="2"/><text x="${384 + i * 190 + 88}" y="456" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="700" fill="${c.onDark}">${esc(d.shortTitle)}</text>`).join('')}
</svg>`);
  await sharp(og).composite([{ input: await png(markSvg(), 250), left: 90, top: 150 }]).png({ compressionLevel: 9 }).toFile(out('public/images/og.png'));
}

console.log('brand assets written from brand/dent-plus-mark.svg');
