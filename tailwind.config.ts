import type { Config } from 'tailwindcss';
import brand from './content/brand.json';

// Every colour is a CSS variable generated from content/brand.json (src/lib/theme.ts). Never hard-code a hex in a component.
const colors = Object.fromEntries(Object.keys(brand.colors).map((k) => [k, `rgb(var(--c-${k}) / <alpha-value>)`]));

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    screens: { xs: '400px', sm: '640px', md: '768px', lg: '1024px', xl: '1280px' },
    extend: {
      colors,
      fontFamily: { heading: ['var(--font-heading)'], body: ['var(--font-body)'] },
      // Radius family: 16px cards and images (brand), pill buttons/chips (full), 12px inputs and small tiles (tile).
      borderRadius: { brand: 'var(--radius)', tile: '0.75rem' },
      maxWidth: { site: '76rem', prose: '42rem' },
      boxShadow: {
        card: '0 1px 0 rgb(var(--c-navy) / 0.04), 0 10px 30px -18px rgb(var(--c-navy) / 0.28)',
        float: '0 24px 60px -24px rgb(var(--c-navy) / 0.45)',
      },
      keyframes: {
        rise: { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'none' } },
        pulseDot: { '0%,100%': { opacity: '1' }, '50%': { opacity: '.35' } },
      },
      animation: { rise: 'rise .45s cubic-bezier(.2,.7,.2,1) both', 'pulse-dot': 'pulseDot 2s ease-in-out infinite' },
    },
  },
  plugins: [],
};
export default config;
