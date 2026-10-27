// BookingService + implementations + automatic fallback. Browser-side code.
//  - GETs go through our same-origin proxy (/api/clinicflow/...), short-cached, so they work without CORS.
//  - POSTs (OTP, guest-book, leads) go straight from the visitor's browser to ClinicFlow: guest booking is
//    rate-limited per IP, so proxying would make every visitor share our server's IP. That needs this site's
//    origin in the API's CORS allow-list; the health check detects when it isn't.
// There is deliberately no mock implementation here — mocks live only in tests/.
import { fillTemplate, whatsappLink } from '../contact';
import {
  AnyBody, AppointmentSchema, BookingError, BranchListSchema, ClinicPublicSchema, DoctorListSchema, LeadSchema, NextAvailableSchema,
  SlotListSchema, parseResponse, safeFetch, type ApiAppointment, type ApiDoctor,
} from './api';
import type { BookingClientConfig, BookingDoctor } from './config';
import { addDays, availableDates, hhmm, todayInZone } from './dates';
import { selectMode, type BookingMode, type HealthReport, type ResolvedMode } from './selectMode';
import type { TreatmentGroup } from './treatments';
import { splitFullName } from './validation';

export type Branch = { id: string; name: string; address?: string };
export type SlotOption = { time: string; endTime?: string; doctorSlug: string; doctorName: string };
export type NextAvailable = { date: string; time: string; doctorSlug: string } | null;

export type BookingRequest = {
  fullName: string;
  phone: string; // normalised 10 digits
  email: string;
  branchId: string;
  treatmentLabel: string;
  doctorSlug: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm ("" = any time; enquiry/whatsapp only)
  otp?: string;
  honeypot?: string;
};

export type BookingResult =
  | { kind: 'booked'; appointmentId: string; status: string; doctorName: string; branchName?: string; date: string; time: string; endTime?: string }
  | { kind: 'enquiry'; leadId: string }
  | { kind: 'whatsapp'; href: string };

export interface BookingService {
  readonly mode: BookingMode;
  /** true when getSlots returns live bookable times (otherwise the form asks for a preferred time). */
  readonly liveSlots: boolean;
  /** true when submitting requires the phone OTP step. */
  readonly requiresOtp: boolean;
  getBranches(): Promise<Branch[]>;
  getTreatments(): TreatmentGroup[];
  getAvailableDates(doctorSlugs: string[]): string[];
  getSlots(doctorSlugs: string[], branchId: string, date: string, opts?: { fresh?: boolean }): Promise<SlotOption[]>;
  getNextAvailable(doctorSlugs: string[], branchId: string): Promise<NextAvailable>;
  sendOtp(phone: string, resend?: boolean): Promise<void>;
  verifyOtp(phone: string, otp: string): Promise<boolean>;
  book(req: BookingRequest): Promise<BookingResult>;
}

/** Shared, content-backed behaviour (branch, dates, treatments, messages). */
abstract class ContentBackedService implements BookingService {
  abstract readonly mode: BookingMode;
  abstract readonly liveSlots: boolean;
  abstract readonly requiresOtp: boolean;
  constructor(protected cfg: BookingClientConfig) {}

  protected doctor(slug: string): BookingDoctor | undefined {
    return this.cfg.doctors.find((d) => d.slug === slug);
  }
  async getBranches(): Promise<Branch[]> {
    return [{ id: 'content', name: this.cfg.clinic.branchName, address: this.cfg.clinic.address }];
  }
  getTreatments(): TreatmentGroup[] {
    return this.cfg.treatments;
  }
  getAvailableDates(doctorSlugs: string[]): string[] {
    const schedules = doctorSlugs.map((s) => this.doctor(s)?.consultation ?? []);
    return availableDates(schedules, todayInZone(this.cfg.timezone), this.cfg.advanceDays);
  }
  /* eslint-disable @typescript-eslint/no-unused-vars */
  async getSlots(doctorSlugs: string[], branchId: string, date: string, opts?: { fresh?: boolean }): Promise<SlotOption[]> {
    return [];
  }
  async getNextAvailable(doctorSlugs: string[], branchId: string): Promise<NextAvailable> {
    return null;
  }
  async sendOtp(phone: string, resend?: boolean): Promise<void> {
    throw new BookingError('request', 'OTP is not used in this mode');
  }
  async verifyOtp(phone: string, otp: string): Promise<boolean> {
    return false;
  }
  /* eslint-enable @typescript-eslint/no-unused-vars */
  abstract book(req: BookingRequest): Promise<BookingResult>;

  protected messageVars(req: BookingRequest): Record<string, string> {
    return {
      clinic: this.cfg.clinic.shortName,
      name: req.fullName.trim(),
      phone: req.phone ? `+91 ${req.phone}` : '',
      email: req.email.trim(),
      problem: req.treatmentLabel,
      doctor: this.doctor(req.doctorSlug)?.displayName ?? req.doctorSlug,
      day: req.date || 'Any day',
      time: req.time || 'Any time',
    };
  }
}

/** No network: "submit" builds a wa.me link. The UI says "Continue on WhatsApp", never "booked". */
export class WhatsAppBookingService extends ContentBackedService {
  readonly mode = 'whatsapp' as const;
  readonly liveSlots = false;
  readonly requiresOtp = false;
  constructor(cfg: BookingClientConfig) {
    super(cfg);
    if (!cfg.clinic.whatsappDigits) throw new BookingError('unavailable', 'WhatsApp number is a placeholder');
  }
  async book(req: BookingRequest): Promise<BookingResult> {
    return { kind: 'whatsapp', href: whatsappLink(this.cfg.clinic.whatsappDigits!, fillTemplate(this.cfg.whatsappTemplate, this.messageVars(req))) };
  }
}

/** Sends a real lead to ClinicFlow (POST /clinics/public/{slug}/leads). A request, not a booking. */
export class EnquiryBookingService extends ContentBackedService {
  readonly mode = 'enquiry' as const;
  readonly liveSlots = false;
  readonly requiresOtp = false;
  async book(req: BookingRequest): Promise<BookingResult> {
    const res = await safeFetch(`${this.cfg.api.baseUrl}/clinics/public/${encodeURIComponent(this.cfg.api.clinicSlug)}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: req.fullName.trim(),
        email: req.email.trim(),
        phone: req.phone,
        preferredDate: req.date || null,
        message: fillTemplate(this.cfg.enquiryTemplate, this.messageVars(req)),
        consentGiven: true,
        companyWebsite: req.honeypot ?? '', // ClinicFlow's honeypot field
      }),
    });
    const lead = await parseResponse(res, LeadSchema);
    return { kind: 'enquiry', leadId: lead.id };
  }
}

/** Real ClinicFlow247 booking: live branches/doctors/slots, phone OTP, guest-book. */
export class ClinicFlowBookingService extends ContentBackedService {
  readonly mode = 'clinicflow' as const;
  readonly liveSlots = true;
  readonly requiresOtp = true;
  private branches: Branch[] = [];
  private doctorIds = new Map<string, ApiDoctor>();

  constructor(
    cfg: BookingClientConfig,
    readonly clinicId: string,
  ) {
    super(cfg);
  }

  private proxy(path: string) {
    return `${this.cfg.proxyBase}/${path}`;
  }

  async load(): Promise<void> {
    const [branches, doctors] = await Promise.all([
      safeFetch(this.proxy(`clinics/public/${encodeURIComponent(this.cfg.api.clinicSlug)}/branches`)).then((r) => parseResponse(r, BranchListSchema)),
      safeFetch(this.proxy(`clinics/${this.clinicId}/doctors`)).then((r) => parseResponse(r, DoctorListSchema)),
    ]);
    if (!branches.length) throw new BookingError('notFound', 'no active branches');
    this.branches = branches.map((b) => ({ id: b.id, name: b.name, address: b.city ?? undefined }));
    const active = doctors.filter((d) => d.isActive !== false);
    for (const d of this.cfg.doctors) {
      const match = mapDoctor(d, active);
      if (match) this.doctorIds.set(d.slug, match);
    }
    if (!this.doctorIds.size) throw new BookingError('notFound', 'none of the website doctors exist in ClinicFlow');
  }

  unmatchedDoctors(): string[] {
    return this.cfg.doctors.filter((d) => !this.doctorIds.has(d.slug)).map((d) => d.slug);
  }

  async getBranches(): Promise<Branch[]> {
    return this.branches;
  }

  async getSlots(doctorSlugs: string[], branchId: string, date: string, opts?: { fresh?: boolean }): Promise<SlotOption[]> {
    const lists = await Promise.all(
      doctorSlugs.map(async (slug) => {
        const doc = this.doctorIds.get(slug);
        if (!doc) return [];
        const res = await safeFetch(
          this.proxy(`clinics/${this.clinicId}/doctors/${doc.id}/slots?branchId=${encodeURIComponent(branchId)}&date=${date}${opts?.fresh ? '&fresh=1' : ''}`),
          opts?.fresh ? { cache: 'no-store' } : undefined,
        );
        try {
          const slots = await parseResponse(res, SlotListSchema);
          const name = this.doctor(slug)?.displayName ?? doc.fullName ?? doc.firstName;
          return slots.filter((s) => s.available).map((s) => ({ time: hhmm(s.startTime), endTime: hhmm(s.endTime), doctorSlug: slug, doctorName: name }));
        } catch (e) {
          // A doctor not assigned to this branch returns an error — "no slots" for that doctor only.
          if (e instanceof BookingError && (e.kind === 'request' || e.kind === 'notFound')) return [];
          throw e;
        }
      }),
    );
    return lists.flat().sort((a, b) => a.time.localeCompare(b.time) || a.doctorName.localeCompare(b.doctorName));
  }

  async getNextAvailable(doctorSlugs: string[], branchId: string): Promise<NextAvailable> {
    const results = await Promise.all(
      doctorSlugs.map(async (slug) => {
        const doc = this.doctorIds.get(slug);
        if (!doc) return null;
        const res = await safeFetch(this.proxy(`clinics/${this.clinicId}/doctors/${doc.id}/slots/next-available?branchId=${encodeURIComponent(branchId)}`));
        if (res.status === 204) return null;
        try {
          const n = await parseResponse(res, NextAvailableSchema);
          return { date: n.date, time: hhmm(n.startTime), doctorSlug: slug };
        } catch {
          return null;
        }
      }),
    );
    const found = results.filter((r): r is NonNullable<typeof r> => !!r).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    const max = addDays(todayInZone(this.cfg.timezone), this.cfg.advanceDays);
    return found.find((f) => f.date <= max) ?? null;
  }

  async sendOtp(phone: string, resend = false): Promise<void> {
    const res = await safeFetch(`${this.cfg.api.baseUrl}/auth/otp/${resend ? 'resend' : 'send'}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    if (!res.ok) await parseResponse(res, AnyBody); // throws the mapped BookingError
  }

  /** Format check only: guest-book verifies the OTP itself; calling /auth/otp/verify first could consume it. */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async verifyOtp(phone: string, otp: string): Promise<boolean> {
    return /^\d{6}$/.test(otp.trim());
  }

  private booked(a: ApiAppointment, req: BookingRequest): BookingResult {
    return {
      kind: 'booked',
      appointmentId: a.id,
      status: a.status,
      // Prefer the website's name: core stores placeholder surnames (e.g. "MDS") for single-name doctors.
      doctorName: this.doctor(req.doctorSlug)?.displayName ?? a.doctorName ?? '',
      branchName: a.branchName ?? undefined,
      date: a.appointmentDate,
      time: hhmm(a.startTime),
      endTime: a.endTime ? hhmm(a.endTime) : undefined,
    };
  }

  async book(req: BookingRequest): Promise<BookingResult> {
    const doc = this.doctorIds.get(req.doctorSlug);
    if (!doc) throw new BookingError('request', 'Doctor not available for online booking');
    // Someone may have taken the slot while the visitor typed the OTP: re-check uncached.
    const fresh = await this.getSlots([req.doctorSlug], req.branchId, req.date, { fresh: true });
    if (!fresh.some((s) => s.time === req.time)) throw new BookingError('slotTaken');
    const { firstName, lastName } = splitFullName(req.fullName);
    const res = await safeFetch(`${this.cfg.api.baseUrl}/appointments/guest-book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName,
        lastName,
        phone: req.phone,
        otp: req.otp,
        email: req.email.trim(),
        doctorId: doc.id,
        branchId: req.branchId,
        date: req.date,
        startTime: `${req.time}:00`,
        notes: `Website booking — ${req.treatmentLabel}`,
      }),
    });
    return this.booked(await parseResponse(res, AppointmentSchema), req);
  }
}

/** Website doctor → ClinicFlow doctor: explicit clinicflowDoctorId first, else a first/last-name match. */
export function mapDoctor(d: Pick<BookingDoctor, 'clinicflowDoctorId' | 'firstName' | 'lastName'>, apiDoctors: ApiDoctor[]): ApiDoctor | undefined {
  if (d.clinicflowDoctorId) return apiDoctors.find((a) => a.id === d.clinicflowDoctorId);
  const norm = (s?: string | null) => (s ?? '').toLowerCase().replace(/^dr\.?\s*/, '').replace(/[^a-z]/g, '');
  return apiDoctors.find((a) => norm(a.firstName) === norm(d.firstName) && (!d.lastName || norm(a.lastName) === norm(d.lastName)));
}

export type ResolvedBooking = { service: BookingService | null; mode: ResolvedMode; reasons: string[] };

/**
 * Health check + fallback: clinicflow → enquiry → whatsapp (whatsapp only with an approved number).
 * Never fakes success. service is null when nothing is available ('unavailable').
 */
export async function resolveBookingService(cfg: BookingClientConfig): Promise<ResolvedBooking> {
  const health: HealthReport = {};
  let clinicflow: ClinicFlowBookingService | null = null;

  if (cfg.preferredMode !== 'whatsapp') {
    const base = await checkApiBase(cfg);
    if (!base.ok) {
      health.clinicflow = { ok: false, reason: base.reason };
      health.enquiry = { ok: false, reason: base.reason };
    } else {
      health.enquiry = { ok: true };
      if (cfg.preferredMode === 'clinicflow') {
        try {
          clinicflow = new ClinicFlowBookingService(cfg, base.clinicId);
          await clinicflow.load();
          const missing = clinicflow.unmatchedDoctors();
          if (missing.length) console.info('[booking] doctors not matched in ClinicFlow (not bookable online):', missing.join(', '));
          health.clinicflow = { ok: true };
        } catch (e) {
          health.clinicflow = { ok: false, reason: describe(e) };
        }
      }
    }
  }

  const { mode, reasons } = selectMode(cfg.preferredMode, health, !!cfg.clinic.whatsappDigits);
  if (reasons.length) console.info(`[booking] using "${mode}" mode.`, reasons.join(' | '));
  const service: BookingService | null =
    mode === 'clinicflow' && clinicflow ? clinicflow : mode === 'enquiry' ? new EnquiryBookingService(cfg) : mode === 'whatsapp' ? new WhatsAppBookingService(cfg) : null;
  return { service, mode, reasons };
}

async function checkApiBase(cfg: BookingClientConfig): Promise<{ ok: true; clinicId: string } | { ok: false; reason: string }> {
  if (!cfg.api.baseUrl || !cfg.api.clinicSlug) return { ok: false, reason: 'not configured (apiBaseUrl / clinicSlug empty)' };
  const path = `clinics/public/${encodeURIComponent(cfg.api.clinicSlug)}`;
  let clinicId = cfg.api.clinicId;
  try {
    const clinic = await safeFetch(`${cfg.proxyBase}/${path}`).then((r) => parseResponse(r, ClinicPublicSchema));
    clinicId = clinicId || clinic.id;
  } catch (e) {
    return { ok: false, reason: e instanceof BookingError && e.kind === 'notFound' ? `clinic "${cfg.api.clinicSlug}" not found on ClinicFlow` : `API unreachable (${describe(e)})` };
  }
  // CORS probe: the same public GET straight from the browser. A blocked origin → network error.
  try {
    const res = await safeFetch(`${cfg.api.baseUrl}/${path}`, { timeoutMs: 8000 });
    if (!res.ok) return { ok: false, reason: `API returned ${res.status} to the browser` };
  } catch {
    return { ok: false, reason: `browser cannot reach the API — this origin is probably not in ClinicFlow's CORS allow-list` };
  }
  return { ok: true, clinicId };
}

function describe(e: unknown): string {
  if (e instanceof BookingError) return `${e.kind}${e.message && e.message !== e.kind ? `: ${e.message}` : ''}`;
  return e instanceof Error ? e.message : String(e);
}
