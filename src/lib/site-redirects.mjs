// Portal URLs + redirects. Plain JS so next.config.mjs (redirects) and the app (links) share one implementation.
import { planHas } from './plan-matrix.mjs';

/**
 * Base URL of the clinic's ClinicFlow247 pages. Starter: the shared portal (standard ClinicFlow branding).
 * Enterprise with a subdomain: https://<subdomain>.clinicflow247.com (branded tenant app).
 * @param {{ portalBaseUrl: string, enterprise: { subdomain: string } }} portal
 * @param {import('./plan-matrix.mjs').Plan} plan
 */
export function portalBase(portal, plan) {
  // Per-deployment override (staging points at the staging ClinicFlow frontend); baked in at build time.
  const override = (process.env.NEXT_PUBLIC_PORTAL_BASE_URL || '').trim();
  if (override) return override.replace(/\/$/, '');
  if (planHas(plan, 'customSubdomain') && portal.enterprise.subdomain) return `https://${portal.enterprise.subdomain}.clinicflow247.com`;
  return portal.portalBaseUrl.replace(/\/$/, '');
}

/**
 * @param {{ portalBaseUrl: string, clinicSlug: string, enterprise: { subdomain: string }, paths: Record<string, string> }} portal
 * @param {import('./plan-matrix.mjs').Plan} plan
 * @param {string} key one of portal.paths
 */
export function portalUrl(portal, plan, key) {
  const p = portal.paths[key];
  if (!p) throw new Error(`Unknown portal path "${key}"`);
  return `${portalBase(portal, plan)}${p.replace('{slug}', portal.clinicSlug)}`;
}

/**
 * Every redirect the site serves.
 * @param {{ portal: any, plan: import('./plan-matrix.mjs').Plan, doctors: { slug: string, previousSlugs: string[] }[] }} input
 */
export function buildRedirects({ portal, plan, doctors }) {
  const base = portalBase(portal, plan);
  const url = (key) => portalUrl(portal, plan, key);
  return [
    // Patient/staff sign-in lives on ClinicFlow247 (temporary: the portal URL changes on an Enterprise upgrade).
    { source: '/login', destination: url('login'), permanent: false },
    { source: '/sign-in', destination: url('login'), permanent: false },
    { source: '/register', destination: url('register'), permanent: false },
    { source: '/sign-up', destination: url('register'), permanent: false },
    { source: '/forgot-password', destination: url('forgotPassword'), permanent: false },
    { source: '/staff-login', destination: url('staffLogin'), permanent: false },
    // Old or shared ClinicFlow-style links (/clinic/<slug>/...) go to the portal unchanged.
    { source: '/clinic/:path*', destination: `${base}/clinic/:path*`, permanent: false },
    // Treatment URL alias.
    { source: '/services', destination: '/treatments', permanent: true },
    { source: '/services/:slug', destination: '/treatments/:slug', permanent: true },
    // Renamed doctors keep their old URLs working.
    ...doctors.flatMap((d) => d.previousSlugs.map((old) => ({ source: `/doctors/${old}`, destination: `/doctors/${d.slug}`, permanent: true }))),
  ];
}
