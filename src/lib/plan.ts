// Plan gating for the website. content/plan.json → features. Pure (unit-tested).
import type { PlanName } from './content/schemas';
import { FEATURE_PLANS, planHas } from './plan-matrix.mjs';

export type PlanFeature = keyof typeof FEATURE_PLANS;

export const hasFeature = (plan: PlanName, feature: PlanFeature): boolean => planHas(plan, feature);

/** Patient-facing benefits of the clinic's plan, shown on About/Book. Never lists anything the plan lacks. */
const PATIENT_BENEFITS: { feature: PlanFeature; text: string }[] = [
  { feature: 'onlineBooking', text: 'Book a slot from your phone day or night, Sunday included' },
  { feature: 'emailReminders', text: 'A confirmation email, then a reminder as the day comes close' },
  { feature: 'whatsappReminders', text: 'WhatsApp messages about your booking' },
  { feature: 'smsReminders', text: 'SMS messages about your booking' },
  { feature: 'liveQueue', text: 'A token number at reception and a queue you can follow' },
  { feature: 'digitalPrescriptions', text: 'Printed or digital prescriptions that are easy to read' },
  { feature: 'waitlist', text: 'A waiting list that tells you if an earlier time frees up' },
];

export function patientBenefits(plan: PlanName): string[] {
  return PATIENT_BENEFITS.filter((b) => hasFeature(plan, b.feature)).map((b) => b.text);
}
