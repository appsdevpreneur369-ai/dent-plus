// Contact channels with the placeholder rule: a placeholder phone/WhatsApp/email never becomes a link. Pure.
import type { Clinic } from './content/schemas';

const REAL_IN_MOBILE = /^\+91[6-9]\d{9}$/;
const REAL_EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

export type ContactChannels = {
  /** tel: href, or null while the phone is a placeholder */
  call: { href: string; display: string } | null;
  /** wa.me digits (no +), or null while WhatsApp is a placeholder */
  whatsapp: { digits: string; display: string } | null;
  /** mailto: href, or null while the email is a placeholder */
  email: { href: string; display: string } | null;
};

type ContactInput = Pick<Clinic, 'phone' | 'whatsapp' | 'email'>;

export function contactChannels(c: ContactInput): ContactChannels {
  const phoneOk = c.phone.status === 'approved' && REAL_IN_MOBILE.test(c.phone.e164);
  const waOk = c.whatsapp.status === 'approved' && REAL_IN_MOBILE.test(c.whatsapp.e164);
  const emailOk = c.email.status === 'approved' && REAL_EMAIL.test(c.email.value);
  return {
    call: phoneOk ? { href: `tel:${c.phone.e164}`, display: c.phone.display } : null,
    whatsapp: waOk ? { digits: c.whatsapp.e164.replace(/\D/g, ''), display: c.whatsapp.display } : null,
    email: emailOk ? { href: `mailto:${c.email.value}`, display: c.email.value } : null,
  };
}

export const whatsappLink = (digits: string, message?: string) =>
  `https://wa.me/${digits}${message ? `?text=${encodeURIComponent(message)}` : ''}`;

export const fillTemplate = (s: string, v: Record<string, string>) => s.replace(/\{\{(\w+)\}\}/g, (_, k: string) => v[k] ?? '');
