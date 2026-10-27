import 'server-only';
import { categories, doctorsFile, siteBooking, siteClinic, siteDepartments, siteDoctors, siteRouting } from '../content';
import { channels, portal } from '../links';
import { fullAddress } from '../vars';
import type { BookingClientConfig } from './config';
import { buildTreatmentGroups } from './treatments';

/** ClinicFlow API settings: content/booking.json, overridable per deployment via NEXT_PUBLIC_CLINICFLOW_*. */
export function clinicflowApiConfig() {
  const c = siteBooking.clinicflow;
  return {
    baseUrl: (process.env.NEXT_PUBLIC_CLINICFLOW_API_URL || c.apiBaseUrl).replace(/\/$/, ''),
    clinicSlug: process.env.NEXT_PUBLIC_CLINICFLOW_CLINIC_SLUG || c.clinicSlug,
    clinicId: process.env.NEXT_PUBLIC_CLINICFLOW_CLINIC_ID || c.clinicId,
  };
}

// Doctor ids in content → slugs used by the booking UI.
const idToSlug = new Map(siteDoctors.map((d) => [d.id, d.slug]));
const slugs = (ids: string[]) => ids.map((id) => idToSlug.get(id)!).filter(Boolean);

/** Everything the client booking UI needs, resolved from /content. */
export function bookingClientConfig(): BookingClientConfig {
  return {
    preferredMode: siteBooking.mode,
    api: clinicflowApiConfig(),
    proxyBase: '/api/clinicflow',
    advanceDays: siteBooking.advanceDays,
    slotMinutes: doctorsFile.consultSlotMinutes,
    otpResendSeconds: siteBooking.otpResendSeconds,
    timezone: siteClinic.timezone,
    treatments: buildTreatmentGroups({
      departments: siteDepartments.map((d) => ({ id: d.id, title: d.title, generalLabel: d.generalLabel, doctors: slugs(d.doctors) })),
      problems: siteRouting.problems.map((p) => ({ id: p.id, label: p.label, department: p.department, doctors: slugs(p.doctors) })),
      categories: categories.map((c) => ({
        slug: c.slug,
        title: c.title,
        department: c.department,
        doctors: slugs(c.doctors),
        subTreatments: c.subTreatments.map((s) => ({ slug: s.slug, title: s.title, doctors: s.doctors ? slugs(s.doctors) : undefined })),
      })),
      allowDirectSpecialistBooking: siteBooking.allowDirectSpecialistBooking,
      defaultDoctor: idToSlug.get(siteBooking.defaultDoctor)!,
    }),
    problems: siteRouting.problems.map((p) => ({ id: p.id, label: p.label, icon: p.icon, department: p.department })),
    departments: siteDepartments.map((d) => ({ id: d.id, title: d.title, shortTitle: d.shortTitle, icon: d.icon, line: d.line })),
    doctors: siteDoctors.map((d) => ({
      slug: d.slug,
      id: d.id,
      displayName: d.displayName,
      firstName: d.firstName,
      lastName: d.lastName,
      specialty: d.specialty,
      initials: d.initials,
      departments: d.departments,
      clinicflowDoctorId: d.clinicflowDoctorId,
      consultation: d.consultation,
    })),
    clinic: {
      name: siteClinic.name.value,
      shortName: siteClinic.shortName,
      branchName: `${siteClinic.shortName} — ${siteClinic.address.locality}`,
      address: fullAddress,
      whatsappDigits: channels.whatsapp?.digits ?? null,
      phoneDisplay: channels.call?.display ?? null,
      telHref: channels.call?.href ?? null,
    },
    popup: siteBooking.popup,
    consentText: siteBooking.consent,
    privacyHref: '/privacy',
    whatsappTemplate: siteBooking.whatsappMessage,
    enquiryTemplate: siteBooking.enquiryMessage,
    note: siteBooking.note,
    otpHint: (process.env.NEXT_PUBLIC_BOOKING_OTP_HINT ?? '').trim(),
    portal: { login: portal('login'), register: portal('register'), bookingPage: portal('bookingPage') },
  };
}
