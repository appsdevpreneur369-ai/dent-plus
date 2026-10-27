// Pure fallback selection: clinicflow → enquiry → whatsapp (unit-tested).
// WhatsApp needs no network, but it is only offered while the clinic's WhatsApp number is approved
// (clinic.json). With a placeholder number and no healthy API mode, the result is 'unavailable' —
// the UI then says so honestly and never pretends a request was sent.

export type BookingMode = 'clinicflow' | 'enquiry' | 'whatsapp';
export type ResolvedMode = BookingMode | 'unavailable';
export type ModeHealth = { ok: boolean; reason?: string };
export type HealthReport = Partial<Record<Exclude<BookingMode, 'whatsapp'>, ModeHealth>>;

export function fallbackOrder(preferred: BookingMode, whatsappAvailable: boolean): BookingMode[] {
  const order: BookingMode[] = preferred === 'clinicflow' ? ['clinicflow', 'enquiry', 'whatsapp'] : preferred === 'enquiry' ? ['enquiry', 'whatsapp'] : ['whatsapp'];
  return whatsappAvailable ? order : order.filter((m) => m !== 'whatsapp');
}

export function selectMode(preferred: BookingMode, health: HealthReport, whatsappAvailable: boolean): { mode: ResolvedMode; reasons: string[] } {
  const reasons: string[] = [];
  for (const mode of fallbackOrder(preferred, whatsappAvailable)) {
    if (mode === 'whatsapp') return { mode, reasons };
    const h = health[mode];
    if (h?.ok) return { mode, reasons };
    reasons.push(`${mode} unavailable: ${h?.reason ?? 'not checked'}`);
  }
  if (!whatsappAvailable) reasons.push('whatsapp disabled: clinic WhatsApp number is a placeholder');
  return { mode: 'unavailable', reasons };
}
