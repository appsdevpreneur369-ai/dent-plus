// ClinicFlow247 public API response shapes (zod-validated) and error mapping.
// Shapes follow clinicflow-api DTOs (read-only): PublicClinicProfile, PublicBranchSummary, DoctorResponse,
// SlotResponse, NextAvailableSlotResponse, AppointmentResponse, LeadResponse.
import { z } from 'zod';

const nullableStr = z.string().nullable().optional();

export const ClinicPublicSchema = z.object({ id: z.string().min(1), slug: z.string(), name: z.string() });
export const BranchSchema = z.object({ id: z.string().min(1), name: z.string(), slug: nullableStr, city: nullableStr });
export const BranchListSchema = z.array(BranchSchema);
export const DoctorSchema = z.object({
  id: z.string().min(1),
  firstName: z.string(),
  lastName: nullableStr,
  fullName: nullableStr,
  isActive: z.boolean().nullable().optional(),
});
export const DoctorListSchema = z.array(DoctorSchema);
export const SlotSchema = z.object({ startTime: z.string(), endTime: z.string(), available: z.boolean() });
export const SlotListSchema = z.array(SlotSchema);
export const NextAvailableSchema = z.object({ date: z.string(), startTime: z.string(), endTime: z.string() });
export const AppointmentSchema = z.object({
  id: z.string(),
  doctorName: nullableStr,
  branchName: nullableStr,
  clinicName: nullableStr,
  appointmentDate: z.string(),
  startTime: z.string(),
  endTime: nullableStr,
  status: z.string(),
});
export const LeadSchema = z.object({ id: z.string() });
export const AnyBody = z.unknown();
export const ErrorEnvelopeSchema = z.object({
  success: z.literal(false),
  error: z.object({ code: z.string(), message: z.string().optional() }),
});

export type ApiDoctor = z.infer<typeof DoctorSchema>;
export type ApiAppointment = z.infer<typeof AppointmentSchema>;

export type BookingErrorKind = 'network' | 'rateLimit' | 'server' | 'request' | 'conflict' | 'slotTaken' | 'otpInvalid' | 'emailTaken' | 'notFound' | 'invalidResponse' | 'unavailable';

/** ClinicFlow error codes → kinds. Checked before the HTTP status (several errors share 409). */
const CODE_KINDS: Record<string, BookingErrorKind> = {
  RATE_LIMIT_EXCEEDED: 'rateLimit',
  APPOINTMENT_SLOT_NOT_AVAILABLE: 'slotTaken',
  APPOINTMENT_SLOT_LOCKED: 'slotTaken',
  SLOT_LOCK_NOT_FOUND: 'slotTaken',
  OTP_INVALID: 'otpInvalid',
  OTP_EXPIRED: 'otpInvalid',
  // guest-book creates a patient login; an email that already has one is refused (found in local e2e, 30 Sep 2026).
  AUTH_EMAIL_ALREADY_EXISTS: 'emailTaken',
};

export class BookingError extends Error {
  constructor(
    public kind: BookingErrorKind,
    message?: string,
    public code?: string,
  ) {
    super(message ?? kind);
    this.name = 'BookingError';
  }
}

export async function parseResponse<T extends z.ZodTypeAny>(res: Response, schema: T): Promise<z.infer<T>> {
  let body: unknown = null;
  const text = await res.text();
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }
  if (!res.ok) {
    const env = ErrorEnvelopeSchema.safeParse(body);
    const code = env.success ? env.data.error.code : undefined;
    const msg = env.success ? env.data.error.message : undefined;
    if (code && CODE_KINDS[code]) throw new BookingError(CODE_KINDS[code], msg, code);
    if (res.status === 429) throw new BookingError('rateLimit', msg, code);
    // Only a known slot code means "slot taken"; any other 409 is a generic conflict (never a misleading message).
    if (res.status === 409) throw new BookingError(code ? 'conflict' : 'slotTaken', msg, code);
    if (res.status === 404) throw new BookingError('notFound', msg, code);
    if (res.status >= 500) throw new BookingError('server', msg, code);
    throw new BookingError('request', msg, code);
  }
  // Some ClinicFlow endpoints wrap success bodies as { success, data }; accept both.
  const payload = body && typeof body === 'object' && 'data' in (body as object) && 'success' in (body as object) ? (body as { data: unknown }).data : body;
  const parsed = schema.safeParse(payload);
  if (!parsed.success) throw new BookingError('invalidResponse', 'Unexpected response from the booking system');
  return parsed.data;
}

/** fetch() that turns network/CORS failures and timeouts into BookingError('network'). */
export async function safeFetch(input: string, init?: RequestInit & { timeoutMs?: number }): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), init?.timeoutMs ?? 15000);
  try {
    return await fetch(input, { ...init, signal: ctrl.signal });
  } catch {
    throw new BookingError('network');
  } finally {
    clearTimeout(timer);
  }
}
