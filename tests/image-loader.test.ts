import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import imageLoader from '@/lib/image-loader';
import { IMAGE_WIDTHS } from '@/lib/image-widths.mjs';

describe('image loader (pre-generated variants, no runtime resizing)', () => {
  it('maps a photo and requested width to the next variant up', () => {
    expect(imageLoader({ src: '/images/photos/hero.jpg', width: 600 })).toBe('/images/opt/hero-640.webp');
    expect(imageLoader({ src: '/images/photos/hero.jpg', width: 3840 })).toBe('/images/opt/hero-1920.webp');
    expect(imageLoader({ src: '/brand/logo-mark.png', width: 64 })).toBe('/images/opt/logo-mark-64.webp');
  });
  it('passes other URLs through unchanged', () => {
    expect(imageLoader({ src: '/images/og.png', width: 640 })).toBe('/images/og.png');
  });
  it('every photo referenced in images.json has every variant on disk (after npm run images)', () => {
    const root = path.join(__dirname, '..');
    const imgs = JSON.parse(fs.readFileSync(path.join(root, 'content', 'images.json'), 'utf8'));
    const srcs = [imgs.logo.mark.src, ...Object.values<{ src: string }>(imgs.images).map((i) => i.src)].filter((s) => /^\/(images\/photos|brand)\//.test(s));
    for (const s of srcs) for (const w of IMAGE_WIDTHS) expect(fs.existsSync(path.join(root, 'public', imageLoader({ src: s, width: w })))).toBe(true);
  });
});
