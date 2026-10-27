// {{token}} values filled into content copy, derived from content so numbers never drift.
import 'server-only';
import { categories, siteClinic, siteDoctors } from './content';
import { formatSessions, hoursShort, hoursSummary } from './hours';
import { fillTemplate } from './contact';

const a = siteClinic.address;
export const streetLine = [a.doorNumber, a.street].filter(Boolean).join(', ');
export const fullAddress = [streetLine, a.landmark, a.locality, a.postalCode ? `${a.region} ${a.postalCode}` : a.region]
  .filter(Boolean)
  .join(', ');

const openDay = siteClinic.hours.days.find((d) => d.sessions.length);

export const VARS: Record<string, string> = {
  clinic: siteClinic.name.value,
  doctorCount: ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven'][siteDoctors.length - 1] ?? String(siteDoctors.length),
  categoryCount: ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'][categories.length - 1] ?? String(categories.length),
  doctorCountNum: String(siteDoctors.length),
  categoryCountNum: String(categories.length),
  hoursSummary: hoursSummary(siteClinic.hours.days),
  hoursShort: hoursShort(siteClinic.hours.days),
  todayHours: openDay ? formatSessions(openDay.sessions) : '',
  area: siteClinic.address.locality,
  address: fullAddress,
  googleRating: siteClinic.google?.rating ? siteClinic.google.rating.toFixed(1) : '',
  googleReviews: siteClinic.google ? String(siteClinic.google.reviewCount) : '',
  googleChecked: siteClinic.google
    ? new Date(`${siteClinic.google.checkedOn}T00:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
    : '',
};

export const fill = (s: string, extra: Record<string, string> = {}) => fillTemplate(s, { ...VARS, ...extra });
