import { afterEach, describe, expect, it, vi } from 'vitest';
import { BookingError, parseResponse, AnyBody } from '@/lib/booking/api';
import { autoOpenDelayMs, canAutoOpen, isExcludedPath, type PopupConfig } from '@/lib/booking/popupRules';
import { fallbackOrder, selectMode } from '@/lib/booking/selectMode';
import { EnquiryBookingService, WhatsAppBookingService, resolveBookingService } from '@/lib/booking/services';
import { isValidEmail, isValidFullName, normalizeIndianMobile, splitFullName } from '@/lib/booking/validation';
import { contactChannels } from '@/lib/contact';
import { bookingConfig, content } from './fixtures';

afterEach(() => vi.unstubAllGlobals());

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const req = { fullName: 'Ravi Teja', phone: '9876543210', email: 'ravi@example.com', branchId: 'content', treatmentLabel: 'Toothache', doctorSlug: 'dr-g-phani-krishna', date: '2026-10-05', time: '10:30' };

describe('fallback selection', () => {
  it('clinicflow → enquiry → whatsapp when WhatsApp is approved', () => {
    expect(fallbackOrder('clinicflow', true)).toEqual(['clinicflow', 'enquiry', 'whatsapp']);
    expect(selectMode('clinicflow', { clinicflow: { ok: false }, enquiry: { ok: true } }, true).mode).toBe('enquiry');
    expect(selectMode('clinicflow', { clinicflow: { ok: false }, enquiry: { ok: false } }, true).mode).toBe('whatsapp');
  });

  it('placeholder phone rule: WhatsApp is never a fallback; enquiry is final; otherwise honestly unavailable', () => {
    expect(fallbackOrder('clinicflow', false)).toEqual(['clinicflow', 'enquiry']);
    expect(selectMode('clinicflow', { clinicflow: { ok: false }, enquiry: { ok: true } }, false).mode).toBe('enquiry');
    const r = selectMode('clinicflow', { clinicflow: { ok: false, reason: 'x' }, enquiry: { ok: false, reason: 'y' } }, false);
    expect(r.mode).toBe('unavailable');
    expect(r.reasons.join()).toMatch(/whatsapp disabled/);
    expect(selectMode('whatsapp', {}, false).mode).toBe('unavailable');
  });

  it('prefers clinicflow when healthy', () => {
    expect(selectMode('clinicflow', { clinicflow: { ok: true }, enquiry: { ok: true } }, true).mode).toBe('clinicflow');
  });
});

describe('resolveBookingService (stubbed network)', () => {
  it('empty apiBaseUrl (today\'s config) → WhatsApp while the number is approved, without any network call', async () => {
    const f = vi.fn();
    vi.stubGlobal('fetch', f);
    const r = await resolveBookingService(bookingConfig());
    expect(r.mode).toBe('whatsapp');
    expect(f).not.toHaveBeenCalled();
  });

  it('empty apiBaseUrl + placeholder WhatsApp → unavailable, no service, no fake success', async () => {
    vi.stubGlobal('fetch', vi.fn());
    const r = await resolveBookingService(bookingConfig({ whatsappDigits: null }));
    expect(r.mode).toBe('unavailable');
    expect(r.service).toBeNull();
  });

  it('API reachable but clinic doctors missing → enquiry (real leads endpoint)', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.endsWith('/clinics/public/dent-plus-dental-family-clinic')) return json(200, { id: 'c1', slug: 'dent-plus-dental-family-clinic', name: 'x' });
      if (url.includes('/branches')) return json(200, [{ id: 'b1', name: 'Main' }]);
      if (url.includes('/doctors')) return json(200, []);
      return json(404, {});
    }));
    const r = await resolveBookingService(bookingConfig({ baseUrl: 'http://api.test/api/v1', clinicSlug: 'dent-plus-dental-family-clinic', whatsappDigits: null }));
    expect(r.mode).toBe('enquiry');
  });

  it('browser blocked by CORS → skips both API modes', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.startsWith('/api/clinicflow')) return json(200, { id: 'c1', slug: 's', name: 'x' });
      throw new TypeError('Failed to fetch');
    }));
    const r = await resolveBookingService(bookingConfig({ baseUrl: 'http://api.test/api/v1', clinicSlug: 'dent-plus-dental-family-clinic' }));
    expect(r.mode).toBe('whatsapp');
    expect(r.reasons.join()).toMatch(/CORS/);
  });

  it('full clinicflow when clinic, branches and a matching doctor exist', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (/\/clinics\/public\/[^/]+$/.test(url)) return json(200, { success: true, data: { id: 'c1', slug: 's', name: 'x' } });
      if (url.includes('/branches')) return json(200, [{ id: 'b1', name: 'Main', city: 'Guntur' }]);
      if (url.endsWith('/doctors')) return json(200, [{ id: 'd1', firstName: 'Phani Krishna', lastName: 'G' }]);
      return json(404, {});
    }));
    const r = await resolveBookingService(bookingConfig({ baseUrl: 'http://api.test/api/v1', clinicSlug: 'dent-plus-dental-family-clinic' }));
    expect(r.mode).toBe('clinicflow');
    expect(r.service!.requiresOtp).toBe(true);
  });

  it('enquiry never fakes success: a failed lead POST throws', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json(500, { success: false, error: { code: 'X' } })));
    const s = new EnquiryBookingService(bookingConfig({ baseUrl: 'http://api.test', clinicSlug: 'dent-plus-dental-family-clinic' }));
    await expect(s.book(req)).rejects.toBeInstanceOf(BookingError);
  });

  it('WhatsApp service refuses to exist with a placeholder number, and builds a wa.me link otherwise', async () => {
    expect(() => new WhatsAppBookingService(bookingConfig({ whatsappDigits: null }))).toThrow(BookingError);
    const r = await new WhatsAppBookingService(bookingConfig()).book(req);
    expect(r.kind).toBe('whatsapp');
    expect(r.kind === 'whatsapp' && r.href).toMatch(/^https:\/\/wa\.me\/919440919770\?text=/);
  });
});

describe('contact placeholder rule', () => {
  it('approved phone → call; approved WhatsApp (same number) → wa.me link; placeholder email → no mailto', () => {
    const ch = contactChannels(content.clinic);
    expect(ch.call?.href).toBe('tel:+919440919770');
    expect(ch.whatsapp?.digits).toBe('919440919770');
    expect(ch.email).toBeNull();
    const unconfirmed = contactChannels({ ...content.clinic, whatsapp: { ...content.clinic.whatsapp, status: 'placeholder' } });
    expect(unconfirmed.whatsapp).toBeNull();
  });
  it('placeholder or fake-looking numbers never become links', () => {
    const fake = { ...content.clinic, phone: { status: 'placeholder', display: '+91 XXXXX XXXXX', e164: '+91XXXXXXXXXX' }, whatsapp: { status: 'approved', display: 'x', e164: '+91XXXXXXXXXX' } };
    const ch = contactChannels(fake);
    expect(ch.call).toBeNull();
    expect(ch.whatsapp).toBeNull();
  });
});

describe('phone / email / name validation', () => {
  it('normalises Indian mobiles', () => {
    expect(normalizeIndianMobile('+91 89546 56789')).toBe('8954656789');
    expect(normalizeIndianMobile('089546 56789')).toBe('8954656789');
    expect(normalizeIndianMobile('918954656789')).toBe('8954656789');
    expect(normalizeIndianMobile('5954656789')).toBeNull();
    expect(normalizeIndianMobile('94416')).toBeNull();
    expect(normalizeIndianMobile('+91 XXXXX XXXXX')).toBeNull();
  });
  it('validates emails', () => {
    expect(isValidEmail('patient@gmail.com')).toBe(true);
    expect(isValidEmail('a@b')).toBe(false);
    expect(isValidEmail('email to be confirmed')).toBe(false);
    expect(isValidEmail('x..y@mail.com')).toBe(false);
  });
  it('names', () => {
    expect(isValidFullName('Ravi')).toBe(true);
    expect(isValidFullName(' 1 ')).toBe(false);
    expect(splitFullName('Ravi')).toEqual({ firstName: 'Ravi', lastName: '.' });
    expect(splitFullName('Sai Ravi Teja')).toEqual({ firstName: 'Sai Ravi', lastName: 'Teja' });
  });
});

describe('popup rules', () => {
  // Dent Plus keeps the auto-open popup OFF (booking opens only when asked); the rules are tested on an enabled copy.
  const config: PopupConfig = { ...content.booking.popup, enabled: true };
  const base = { config, pathname: '/', isMobile: false, sessionState: null, shownThisPage: false } as const;
  it('this site never auto-opens the booking popup', () => {
    expect(content.booking.popup.enabled).toBe(false);
    expect(canAutoOpen({ ...base, config: content.booking.popup })).toBe(false);
  });
  it('rules: opens after the delay on desktop, once per session, never on phones', () => {
    expect(autoOpenDelayMs(config)).toBe(config.delaySeconds * 1000);
    expect(canAutoOpen({ ...base, isMobile: true })).toBe(false);
    expect(canAutoOpen(base)).toBe(true);
    expect(canAutoOpen({ ...base, sessionState: 'closed' })).toBe(false);
    expect(canAutoOpen({ ...base, sessionState: 'opened' })).toBe(false);
    expect(canAutoOpen({ ...base, shownThisPage: true })).toBe(false);
  });
  it('never on excluded pages (book, contact, legal, emergency) incl. sub-paths and trailing slashes', () => {
    for (const p of ['/book', '/book/', '/privacy', '/emergency', '/contact', '/terms?x=1']) expect(canAutoOpen({ ...base, pathname: p })).toBe(false);
    expect(isExcludedPath('/bookings', config.excludedPaths)).toBe(false);
  });
  it('booked always wins, even when oncePerSession is off', () => {
    expect(canAutoOpen({ ...base, config: { ...config, oncePerSession: false }, sessionState: 'booked' })).toBe(false);
    expect(canAutoOpen({ ...base, config: { ...config, oncePerSession: false }, sessionState: 'closed' })).toBe(true);
  });
  it('respects enabled and showOnMobile', () => {
    expect(canAutoOpen({ ...base, config: { ...config, enabled: false } })).toBe(false);
    expect(canAutoOpen({ ...base, isMobile: true, config: { ...config, showOnMobile: false } })).toBe(false);
  });
});

describe('API error mapping', () => {
  const kindOf = async (status: number, code?: string) => {
    try {
      await parseResponse(json(status, code ? { success: false, error: { code, message: 'x' } } : {}), AnyBody);
    } catch (e) {
      return (e as BookingError).kind;
    }
  };
  it('email already registered is its own error, not "slot taken" (found in local e2e)', async () => {
    expect(await kindOf(409, 'AUTH_EMAIL_ALREADY_EXISTS')).toBe('emailTaken');
  });
  it('only real slot codes (or a bare 409) mean slot taken; unknown 409 codes are a generic conflict', async () => {
    expect(await kindOf(409, 'APPOINTMENT_SLOT_NOT_AVAILABLE')).toBe('slotTaken');
    expect(await kindOf(409)).toBe('slotTaken');
    expect(await kindOf(409, 'SOMETHING_ELSE')).toBe('conflict');
  });
  it('OTP, rate limit and server errors', async () => {
    expect(await kindOf(400, 'OTP_INVALID')).toBe('otpInvalid');
    expect(await kindOf(429)).toBe('rateLimit');
    expect(await kindOf(503)).toBe('server');
  });
});
