// Test-only fixtures built straight from /content (no server-only modules).
import fs from 'node:fs';
import path from 'node:path';
import type { BookingClientConfig } from '@/lib/booking/config';
import { buildTreatmentGroups } from '@/lib/booking/treatments';

type Doc = { id: string; slug: string; firstName: string; lastName: string; displayName: string; specialty: string; initials: string; departments: string[]; consultation: never[] };
const read = (f: string) => JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'content', f), 'utf8'));
export const content = {
  booking: read('booking.json'),
  doctors: read('doctors.json').doctors as Doc[],
  departments: read('departments.json').departments as { id: string; title: string; shortTitle: string; icon: string; line: string; generalLabel: string; doctors: string[] }[],
  services: read('services.json'),
  routing: read('routing.json'),
  portal: read('portal.json'),
  clinic: read('clinic.json'),
};

const idToSlug = new Map(content.doctors.map((d) => [d.id, d.slug]));
export const slugs = (ids: string[]) => ids.map((id) => idToSlug.get(id)!);

export function treatmentGroups() {
  const b = content.booking;
  return buildTreatmentGroups({
    departments: content.departments.map((d) => ({ id: d.id, title: d.title, generalLabel: d.generalLabel, doctors: slugs(d.doctors) })),
    problems: content.routing.problems.map((p: { id: string; label: string; department: string; doctors: string[] }) => ({ id: p.id, label: p.label, department: p.department, doctors: slugs(p.doctors) })),
    categories: content.services.categories.map((c: { slug: string; title: string; department: string; doctors: string[]; subTreatments: { slug: string; title: string; doctors?: string[] }[] }) => ({
      slug: c.slug,
      title: c.title,
      department: c.department,
      doctors: slugs(c.doctors),
      subTreatments: c.subTreatments.map((s) => ({ slug: s.slug, title: s.title, doctors: s.doctors ? slugs(s.doctors) : undefined })),
    })),
    allowDirectSpecialistBooking: b.allowDirectSpecialistBooking,
    defaultDoctor: idToSlug.get(b.defaultDoctor)!,
  });
}

export function bookingConfig(over: { baseUrl?: string; clinicSlug?: string; whatsappDigits?: string | null; mode?: BookingClientConfig['preferredMode'] } = {}): BookingClientConfig {
  return {
    preferredMode: over.mode ?? 'clinicflow',
    api: { baseUrl: over.baseUrl ?? '', clinicSlug: over.clinicSlug ?? '', clinicId: '' },
    proxyBase: '/api/clinicflow',
    advanceDays: 30,
    slotMinutes: 15,
    otpResendSeconds: 30,
    timezone: 'Asia/Kolkata',
    treatments: treatmentGroups(),
    problems: [],
    departments: content.departments.map((d) => ({ id: d.id, title: d.title, shortTitle: d.shortTitle, icon: d.icon, line: d.line })),
    doctors: content.doctors.map((d) => ({ ...d, clinicflowDoctorId: null })),
    clinic: {
      name: content.clinic.name.value,
      shortName: content.clinic.shortName,
      branchName: `${content.clinic.shortName} — Lakshmipuram, Guntur`,
      address: 'D.No 5-72-31/3, Ashok Nagar 3rd Lane, Lakshmipuram, Guntur',
      whatsappDigits: over.whatsappDigits === undefined ? '919440919770' : over.whatsappDigits,
      phoneDisplay: null,
      telHref: null,
    },
    popup: content.booking.popup,
    consentText: 'ok',
    privacyHref: '/privacy',
    whatsappTemplate: content.booking.whatsappMessage,
    enquiryTemplate: content.booking.enquiryMessage,
    note: '',
    otpHint: '',
    portal: { login: '', register: '', bookingPage: '' },
  };
}
