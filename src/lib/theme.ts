import 'server-only';
import { Figtree, Outfit } from 'next/font/google';
import { siteBrand } from './content';

// next/font must be declared statically; brand.json picks from this registry by name (max 2 fonts).
// display: 'swap' so the chosen fonts always appear; next/font preloads both and uses metric-matched fallbacks.
// Headings: Outfit (geometric, rounded forms that echo the rounded-square logo; strong at large editorial sizes).
// Body: Figtree (tall x-height, very legible at 15-16 px on budget phones). Neither is used by the other ClinicFlow247 clinic sites.
const outfit = Outfit({ subsets: ['latin'], weight: 'variable', variable: '--font-outfit', display: 'swap' });
const figtree = Figtree({ subsets: ['latin'], weight: 'variable', variable: '--font-figtree', display: 'swap' });

const registry: Record<string, { variable: string; cssVar: string; fallback: string }> = {
  Outfit: { variable: outfit.variable, cssVar: '--font-outfit', fallback: "system-ui, 'Segoe UI', Arial, sans-serif" },
  Figtree: { variable: figtree.variable, cssVar: '--font-figtree', fallback: "system-ui, 'Segoe UI', Arial, sans-serif" },
};

function font(name: string) {
  const f = registry[name];
  if (!f) throw new Error(`brand.json font "${name}" is not registered in src/lib/theme.ts`);
  return f;
}

const heading = font(siteBrand.fonts.heading);
const body = font(siteBrand.fonts.body);

export const fontClassNames = [heading.variable, body.variable].join(' ');

const hexToRgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
};

/** :root CSS variables generated from brand.json (colours as "r g b" so Tailwind opacity modifiers work). */
export const themeCss = `:root{${Object.entries(siteBrand.colors)
  .map(([k, v]) => `--c-${k}:${hexToRgb(v)};`)
  .join('')}--radius:${siteBrand.radius};--font-heading:var(${heading.cssVar}),${heading.fallback};--font-body:var(${body.cssVar}),${body.fallback};}`;
