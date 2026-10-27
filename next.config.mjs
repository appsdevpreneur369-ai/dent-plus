import fs from 'node:fs';
import { IMAGE_WIDTHS } from './src/lib/image-widths.mjs';
import { buildRedirects } from './src/lib/site-redirects.mjs';

const readJson = (f) => JSON.parse(fs.readFileSync(new URL(`./content/${f}`, import.meta.url), 'utf8'));
const env = process.env.NEXT_PUBLIC_SITE_ENV || 'development';
const noindex = env !== 'production' || process.env.NEXT_PUBLIC_NOINDEX === 'true';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Separate build folders for test variants (e.g. NEXT_DIST_DIR=.next-e2e); default .next.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  poweredByHeader: false,
  // Optional cap on static-generation workers for low-memory machines (e.g. NEXT_BUILD_CPUS=1 locally). Unset = Next default.
  ...(process.env.NEXT_BUILD_CPUS ? { experimental: { cpus: Number(process.env.NEXT_BUILD_CPUS) } } : {}),
  // No runtime image resizing: the optimiser hung on some photos at some widths (local QA, 30 Sep 2026).
  // WebP variants are pre-generated at build (scripts/build-image-variants.mjs) and served by a custom loader.
  images: {
    loader: 'custom',
    loaderFile: './src/lib/image-loader.ts',
    deviceSizes: IMAGE_WIDTHS.filter((w) => w >= 640),
    imageSizes: IMAGE_WIDTHS.filter((w) => w < 640),
  },
  async redirects() {
    return buildRedirects({ portal: readJson('portal.json'), plan: readJson('plan.json').plan, doctors: readJson('doctors.json').doctors });
  },
  async headers() {
    const security = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ];
    // Non-production must never be indexed (robots.txt and <meta robots> also say so).
    const robots = noindex ? [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] : [];
    return [{ source: '/:path*', headers: [...security, ...robots] }];
  },
};

export default nextConfig;
