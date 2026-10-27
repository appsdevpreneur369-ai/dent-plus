import type { MetadataRoute } from 'next';
import { siteBrand, siteClinic } from '@/lib/content';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteClinic.name.value,
    short_name: siteClinic.shortName,
    start_url: '/',
    display: 'browser',
    background_color: siteBrand.colors.background,
    theme_color: siteBrand.colors.primary,
    // Made by `npm run brand` (scripts/generate-brand-assets.mjs): the Dent Plus tile mark.
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
