import { describe, expect, it } from 'vitest';
import { formatSessions, hoursShort, hoursSummary, openStatus, openStatusText, sessionLabel, todayHoursText } from '@/lib/hours';
import { hasFeature, patientBenefits } from '@/lib/plan';
import { buildRedirects, portalBase, portalUrl } from '@/lib/site-redirects.mjs';
import { content } from './fixtures';

describe('plan gating', () => {
  it('the clinic is on ENTERPRISE (white-label) from onboarding, 27 Oct 2026', async () => {
    const plan = (await import('../content/plan.json')).default.plan;
    expect(plan).toBe('enterprise');
  });
  it('starter has exactly the promised features and none of the Pro/Enterprise ones', () => {
    for (const f of ['onlineBooking', 'liveQueue', 'digitalPrescriptions', 'emailReminders', 'whatsappReminders', 'smsReminders'] as const) expect(hasFeature('starter', f)).toBe(true);
    for (const f of ['portalGallery', 'analytics', 'reviewRequests', 'noShowAlerts', 'winBackCampaigns', 'waitlist', 'brandedPortal', 'customSubdomain', 'customAppointmentFields', 'dedicatedOnboarding'] as const)
      expect(hasFeature('starter', f)).toBe(false);
  });
  it('the site never lists a benefit the plan lacks', () => {
    expect(patientBenefits('starter').join()).not.toMatch(/waiting list/i);
    expect(patientBenefits('enterprise').join()).toMatch(/waiting list/i);
    expect(patientBenefits('free').join()).not.toMatch(/WhatsApp|SMS|Email/);
  });
});

describe('portal links + redirects', () => {
  const portal = content.portal;
  it('starter: shared ClinicFlow portal with the clinic slug', () => {
    expect(portalUrl(portal, 'starter', 'login')).toBe('https://clinicflow247.com/clinic/dent-plus-dental-family-clinic/login');
    expect(portalUrl(portal, 'starter', 'register')).toBe('https://clinicflow247.com/clinic/dent-plus-dental-family-clinic/register');
    expect(portalUrl(portal, 'starter', 'staffLogin')).toBe('https://clinicflow247.com/login');
  });
  it('a subdomain is ignored on starter and used on enterprise (upgrade = config change)', () => {
    const p = { ...portal, enterprise: { subdomain: 'dentplus' } };
    expect(portalBase(p, 'starter')).toBe('https://clinicflow247.com');
    expect(portalBase(p, 'enterprise')).toBe('https://dentplus.clinicflow247.com');
  });
  it('NEXT_PUBLIC_PORTAL_BASE_URL overrides the portal per deployment (staging)', () => {
    process.env.NEXT_PUBLIC_PORTAL_BASE_URL = 'https://staging.example.run.app/';
    try {
      expect(portalUrl(portal, 'starter', 'login')).toBe('https://staging.example.run.app/clinic/dent-plus-dental-family-clinic/login');
    } finally {
      delete process.env.NEXT_PUBLIC_PORTAL_BASE_URL;
    }
  });
  it('serves /login, /register, /clinic/:slug/* and alias redirects', () => {
    const r = buildRedirects({ portal, plan: 'starter', doctors: [] });
    const find = (s: string) => r.find((x) => x.source === s);
    expect(find('/login')?.destination).toBe('https://clinicflow247.com/clinic/dent-plus-dental-family-clinic/login');
    expect(find('/register')?.destination).toBe('https://clinicflow247.com/clinic/dent-plus-dental-family-clinic/register');
    expect(find('/clinic/:path*')?.destination).toBe('https://clinicflow247.com/clinic/:path*');
    expect(find('/services/:slug')?.destination).toBe('/treatments/:slug');
    expect(find('/login')?.permanent).toBe(false);
  });
  it('a renamed doctor keeps the old URL working (minimal-effort rename)', () => {
    const r = buildRedirects({ portal, plan: 'starter', doctors: [{ slug: 'dr-b-deepthi-x', previousSlugs: ['dr-b-deepthi'] }] });
    expect(r.find((x) => x.source === '/doctors/dr-b-deepthi')).toMatchObject({ destination: '/doctors/dr-b-deepthi-x', permanent: true });
  });
});

describe('hours (Asia/Kolkata)', () => {
  const days = content.clinic.hours.days;
  const at = (iso: string) => openStatus(days, 'Asia/Kolkata', new Date(iso));
  it('one formatter for all human-readable timings (single sessions are not labelled)', () => {
    expect(formatSessions(days[0].sessions)).toBe('9:30 AM – 9:00 PM');
    expect(hoursShort(days)).toBe('Mon–Sat, 9:30 AM – 9:00 PM');
    expect(hoursSummary(days)).toBe('Monday–Saturday, 9:30 AM – 9:00 PM; Sunday closed');
    expect(sessionLabel({ opens: '14:00', closes: '16:00' })).toBe('Afternoon');
  });
  it('split sessions are labelled Morning / Evening (a timing change in content flows through)', () => {
    const changed = days.map((d: { day: string; sessions: unknown[] }) => (d.day === 'sunday' ? { ...d, sessions: [] } : { ...d, sessions: [{ opens: '09:30', closes: '13:00' }, { opens: '18:00', closes: '20:30' }] }));
    expect(hoursShort(changed)).toBe('Mon–Sat, Morning 9:30 AM – 1:00 PM & Evening 6:00 PM – 8:30 PM');
    expect(hoursSummary(changed)).toMatch(/; Sunday closed$/);
  });
  it('hero chip: weekday vs Sunday (Asia/Kolkata)', () => {
    expect(todayHoursText(days, 'Asia/Kolkata', new Date('2026-10-05T03:00:00Z'))).toBe('Open today 9:30 AM – 9:00 PM'); // Mon 08:30 IST
    expect(todayHoursText(days, 'Asia/Kolkata', new Date('2026-10-11T06:00:00Z'))).toBe('Closed today · Opens Monday 9:30 AM'); // Sun 11:30 IST
    const wedClosed = days.map((d: { day: string }) => (d.day === 'wednesday' ? { ...d, sessions: [] } : d));
    expect(todayHoursText(wedClosed, 'Asia/Kolkata', new Date('2026-10-07T06:00:00Z'))).toBe('Closed today · Opens Thursday 9:30 AM');
  });
  it('open / before opening / late evening / Sunday closed', () => {
    expect(at('2026-10-05T05:00:00Z')).toEqual({ open: true, closesAt: '21:00' }); // Mon 10:30 IST
    expect(openStatusText(at('2026-10-05T03:00:00Z'))).toBe('Closed · opens today 9:30 AM'); // Mon 08:30 IST
    expect(at('2026-10-05T14:00:00Z')).toEqual({ open: true, closesAt: '21:00' }); // Mon 19:30 IST
    expect(at('2026-10-05T15:45:00Z').open).toBe(false); // Mon 21:15 IST (closes 9 PM)
    expect(openStatusText(at('2026-10-10T16:30:00Z'))).toBe('Closed · opens Monday 9:30 AM'); // Sat 22:00 IST → Mon (Sunday closed)
    expect(openStatusText(at('2026-10-11T09:00:00Z'))).toBe('Closed · opens tomorrow 9:30 AM'); // Sun 14:30 IST
  });
});
