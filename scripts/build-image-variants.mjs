// Pre-generates responsive WebP variants for every photo and the logo mark, so the site never resizes images at
// runtime (the Next.js image optimiser hung on some photos at some widths — found in local QA, 30 Sep 2026).
// Output: public/images/opt/<name>-<width>.webp for every width in IMAGE_WIDTHS (never upscaled: a narrower
// original is written at its own size under each width name). Runs automatically before `npm run build`.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { IMAGE_WIDTHS } from '../src/lib/image-widths.mjs';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const sources = [
  ...fs.readdirSync(path.join(root, 'public/images/photos')).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).map((f) => path.join(root, 'public/images/photos', f)),
  path.join(root, 'public/brand/logo-mark.png'),
];
const outDir = path.join(root, 'public/images/opt');
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
let count = 0;
for (const src of sources) {
  const name = path.basename(src).replace(/\.[^.]+$/, '');
  const alpha = src.endsWith('.png');
  for (const w of IMAGE_WIDTHS) {
    await sharp(src).resize({ width: w, withoutEnlargement: true }).webp({ quality: alpha ? 90 : 76, alphaQuality: 100 }).toFile(path.join(outDir, `${name}-${w}.webp`));
    count++;
  }
}
console.log(`image variants: ${count} files for ${sources.length} images`);
