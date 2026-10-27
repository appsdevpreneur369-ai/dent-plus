// ClinicFlow247 plan → features, mirrored from D:\ClinicFlow\clinicflow-frontend\src\components\landing\pricingData.ts
// (read-only source of truth, checked 2026-09-30). Plain JS so next.config.mjs can import it too.
// Only features that change something on THIS website are gated here; the rest are listed for documentation.

/** @typedef {'free'|'starter'|'pro'|'enterprise'} Plan */

/** @type {Record<string, Plan[]>} feature → plans that include it */
export const FEATURE_PLANS = {
  // Starter and above (what this clinic has today)
  onlineBooking: ['free', 'starter', 'pro', 'enterprise'],
  liveQueue: ['free', 'starter', 'pro', 'enterprise'],
  digitalPrescriptions: ['free', 'starter', 'pro', 'enterprise'],
  emailReminders: ['starter', 'pro', 'enterprise'],
  whatsappReminders: ['starter', 'pro', 'enterprise'],
  smsReminders: ['starter', 'pro', 'enterprise'],
  // Pro and above — NOT on Starter
  portalGallery: ['pro', 'enterprise'],
  analytics: ['pro', 'enterprise'],
  reviewRequests: ['pro', 'enterprise'],
  noShowAlerts: ['pro', 'enterprise'],
  winBackCampaigns: ['pro', 'enterprise'],
  waitlist: ['pro', 'enterprise'],
  // Enterprise only
  brandedPortal: ['enterprise'],
  customSubdomain: ['enterprise'],
  customAppointmentFields: ['enterprise'],
  dedicatedOnboarding: ['enterprise'],
};

/** @param {Plan} plan @param {string} feature */
export function planHas(plan, feature) {
  const plans = FEATURE_PLANS[feature];
  if (!plans) throw new Error(`Unknown plan feature "${feature}"`);
  return plans.includes(plan);
}
