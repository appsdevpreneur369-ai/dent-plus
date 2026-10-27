// Builds public/images/photos/ from the clinic's OWN photos in images/ (supplied by the account owner, 27 Oct 2026).
// Offline, no stock photos. Patients' eyes are blurred (owner's instruction, 27 Oct 2026). Never upscaled.
// Not used: dent-plus-banner*.jpeg (posters with a stock model: no rights to her face); logo.jpeg (redrawn as brand/dent-plus-mark.svg);
// exterior-road-side-board.jpeg (byte-identical to exterior-name-board.jpeg); WhatsApp 8.17.40 / 8.18.27 (near-copies of the signboards).
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
  { src: 'exterior-name-board-main.jpeg', out: 'clinic-signboard-night.jpg' },
  { src: 'exterior-name-board.jpeg', out: 'clinic-signboard-telugu.jpg' },
  { src: 'interior-main-entrance-3.jpeg', out: 'clinic-waiting.jpg' },
  { src: 'interior-main-entrance-2.jpeg', out: 'clinic-corridor.jpg' },
  // The left of this photo shows the stock-model poster at reception: cropped out.
  { src: 'interior-main-entrance.jpeg', out: 'clinic-reception.jpg', crop: { left: 760, top: 0, width: 840, height: 1200 } },
  { src: 'family-eye-care.jpeg', out: 'clinic-family-eye-care.jpg' },
  { src: 'WhatsApp Image 2026-10-27 at 8.17.46 PM.jpeg', out: 'clinic-smile-wall.jpg' },
  { src: 'patient-treatment.jpeg', out: 'treatment-in-progress.jpg', blur: [{ x: 640, y: 840, w: 130, h: 95 }] },
  { src: 'treatment-chair-equipment-patient-1.jpeg', out: 'treatment-team.jpg', blur: [{ x: 415, y: 650, w: 120, h: 95 }] },
  { src: 'treatment-chair-equipment-patient.jpeg', out: 'treatment-close.jpg', blur: [{ x: 680, y: 865, w: 240, h: 170 }] },
  { src: 'treatment-chair-equipment-patient-2.jpeg', out: 'treatment-room-wide.jpg', blur: [{ x: 0, y: 1100, w: 95, h: 140 }] },
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
  let buf = await sharp(path.join(root, 'images', p.src)).rotate().toBuffer();
  if (p.blur) buf = await blurRegions(buf, p.blur);
  let img = sharp(buf);
  if (p.crop) img = img.extract(p.crop);
  const file = path.join(outDir, p.out);
  await img.resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 84, mozjpeg: true }).toFile(file);
  const m = await sharp(file).metadata();
  manifest[p.out] = `${m.width}x${m.height}`;
}
console.log(manifest);
