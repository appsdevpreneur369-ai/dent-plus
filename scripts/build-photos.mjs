// Builds public/images/photos/ from the clinic's OWN photos in images/ (supplied by the account owner: first set 27 Oct 2026,
// polished set 30 Oct 2026). Offline, no stock photos. Patients' eyes are blurred (owner's instruction, 27 Oct 2026). Never upscaled.
// Not used: interior-banner-1.png and dent-plus-banner*.jpeg (posters with a stock model: no rights to her face; the same poster
// stands at reception in interior-reception.png and is cropped out); logo.jpeg (redrawn as brand/dent-plus-mark.svg).
// Sources the owner removed on 30 Oct (family-eye-care.jpeg for the eye crop) are in git history; a missing source keeps its output.
// Run: node scripts/build-photos.mjs   (then npm run images for the WebP variants)
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const outDir = path.join(root, 'public/images/photos');
fs.mkdirSync(outDir, { recursive: true });

// source → { out, crop?: {left, top, width, height} (source pixels), blur?: [{x, y, w, h}] (source pixels, patients' eyes) }
const PHOTOS = [
  { src: 'treatment-chair-equipment.jpeg', out: 'clinic-operatory.jpg' },
  { src: 'treatment-chair-equipment-second.jpeg', out: 'clinic-operatory-chair.jpg' },
  // The lit main name board (blue background): hero band, find-us, doctors, contact, OG card.
  { src: 'exterior-main-name-board.png', out: 'clinic-name-board.jpg' },
  { src: 'exterior-road-side-board.jpeg', out: 'clinic-signboard-telugu.jpg' },
  { src: 'interior-waiting-room.jpeg', out: 'clinic-waiting.jpg' },
  // The left third of this photo is the stock-model poster at reception: cropped out.
  { src: 'interior-reception.png', out: 'clinic-reception.jpg', crop: { left: 405, top: 0, width: 587, height: 541 } },
  { src: 'doctor-consultation-room.png', out: 'clinic-consultation-room.jpg' },
  { src: 'interior-banner-3.png', out: 'clinic-family-eye-care.jpg' },
  { src: 'interior-banner-2.png', out: 'clinic-smile-wall.jpg' },
  // Department cards: the family + stethoscope graphic (children) and the eye from the first door photo.
  { src: 'interior-banner-3.png', out: 'dept-children.jpg', crop: { left: 60, top: 30, width: 380, height: 280 } },
  { src: 'family-eye-care.jpeg', out: 'dept-eyes.jpg', crop: { left: 300, top: 870, width: 640, height: 360 } },
  // Home hero background (owner, 30 Oct 2026): two dentists at the chair. The stock-model poster on the left wall is
  // cropped out (crop starts right of its frame); the patient's eyes are blurred.
  { src: 'hero-image.png', out: 'hero-clinic.jpg', crop: { left: 425, top: 0, width: 1495, height: 1280 }, blur: [{ x: 1140, y: 582, w: 80, h: 52 }] },
  // A dentist treating a young patient (hero); patient's eyes blurred.
  { src: 'doctor-treating-patient.png', out: 'treatment-in-progress.jpg', blur: [{ x: 560, y: 360, w: 125, h: 85 }] },
  { src: 'treatment-chair-equipment-patient.jpeg', out: 'treatment-close.jpg', blur: [{ x: 680, y: 865, w: 240, h: 170 }] },
  // Dr. B. Deepthi at work (owner allowed this photo, 27 Oct 2026); patient's eyes blurred.
  { src: 'treatment-chair-equipment-patient.jpeg', out: 'doctor-deepthi-at-work.jpg', crop: { left: 380, top: 560, width: 760, height: 760 }, blur: [{ x: 680, y: 865, w: 240, h: 170 }] },
];

/** Heavy blur inside a feathered ellipse (eyes unrecognisable, no hard box edge). */
async function blurRegions(buf, regions) {
  let img = buf;
  for (const r of regions) {
    const meta = await sharp(img).metadata();
    const x = Math.max(0, r.x), y = Math.max(0, r.y);
    const w = Math.min(r.w, meta.width - x), h = Math.min(r.h, meta.height - y);
    const patch = await sharp(img).extract({ left: x, top: y, width: w, height: h }).blur(Math.max(14, w / 6)).png().toBuffer();
    const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><radialGradient id="g"><stop offset=".72" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><ellipse cx="${w / 2}" cy="${h / 2}" rx="${w / 2}" ry="${h / 2}" fill="url(#g)"/></svg>`);
    const feathered = await sharp(patch).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
    img = await sharp(img).composite([{ input: feathered, left: x, top: y }]).toBuffer();
  }
  return img;
}

const manifest = {};
for (const p of PHOTOS) {
  // Raw patient photos are git-ignored (public repo): on a fresh clone keep the committed, already-blurred output.
  if (!fs.existsSync(path.join(root, 'images', p.src))) {
    console.warn(`skip ${p.out}: images/${p.src} not on this machine (keeping the committed public/images/photos/${p.out})`);
    continue;
  }
  // PNGs from the polished set carry an alpha channel: flatten on white before JPEG.
  let buf = await sharp(path.join(root, 'images', p.src)).rotate().flatten({ background: '#ffffff' }).toBuffer();
  if (p.blur) buf = await blurRegions(buf, p.blur);
  let img = sharp(buf);
  if (p.crop) img = img.extract(p.crop);
  const file = path.join(outDir, p.out);
  await img.resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 84, mozjpeg: true }).toFile(file);
  const m = await sharp(file).metadata();
  manifest[p.out] = `${m.width}x${m.height}`;
}
console.log(manifest);
