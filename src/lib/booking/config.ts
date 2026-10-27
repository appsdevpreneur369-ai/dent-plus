// Serialisable booking configuration handed from the server (content) to the client booking UI.
import type { Day } from '../days';
import type { PopupConfig } from './popupRules';
import type { BookingMode } from './selectMode';
import type { TreatmentGroup } from './treatments';

export type BookingDoctor = {
  slug: string;
  id: string;
  displayName: string;
  firstName: string;
  lastName: string;
  specialty: string;
  initials: string;
  departments: string[];
  clinicflowDoctorId: string | null;
  consultation: { days: Day[]; opens: string; closes: string }[];
};

export type ProblemChip = { id: string; label: string; icon: string; department: string };
export type DepartmentChoice = { id: string; title: string; shortTitle: string; icon: string; line: string };

export type BookingClientConfig = {
  preferredMode: BookingMode;
  api: { baseUrl: string; clinicSlug: string; clinicId: string };
  /** Same-origin GET proxy for ClinicFlow (src/app/api/clinicflow). */
  proxyBase: string;
  advanceDays: number;
  slotMinutes: number;
  otpResendSeconds: number;
  timezone: string;
  treatments: TreatmentGroup[];
  problems: ProblemChip[];
  departments: DepartmentChoice[];
  doctors: BookingDoctor[];
  clinic: {
    name: string;
    shortName: string;
    branchName: string;
    address: string;
    /** null while the WhatsApp number is a placeholder: WhatsApp fallback disabled. */
    whatsappDigits: string | null;
    /** null while the phone is a placeholder: no Call buttons. */
    phoneDisplay: string | null;
    telHref: string | null;
  };
  popup: PopupConfig;
  consentText: string;
  privacyHref: string;
  whatsappTemplate: string;
  enquiryTemplate: string;
  note: string;
  /** Staging/local only (NEXT_PUBLIC_BOOKING_OTP_HINT): fixed dry-run OTP shown beside the field. */
  otpHint: string;
  portal: { login: string; register: string; bookingPage: string };
};
