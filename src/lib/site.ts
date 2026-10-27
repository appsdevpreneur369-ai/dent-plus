// Environment-driven site settings. NEXT_PUBLIC_* values are inlined at build time.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
export const SITE_ENV = (process.env.NEXT_PUBLIC_SITE_ENV || 'development') as 'production' | 'staging' | 'development';
/** Only production is indexable. NEXT_PUBLIC_NOINDEX=true forces noindex even there. */
export const NOINDEX = SITE_ENV !== 'production' || process.env.NEXT_PUBLIC_NOINDEX === 'true';
export const SHOW_BADGES = process.env.NEXT_PUBLIC_SHOW_PLACEHOLDER_BADGES === 'true';

export const absoluteUrl = (path: string) => `${SITE_URL}${path === '/' ? '' : path}` || SITE_URL;
