'use client';
import { useEffect, useRef, useState } from 'react';
import type { BookingClientConfig } from '@/lib/booking/config';
import { Icon } from '../ui/Icon';
import type { BookingPrefill } from './BookingProvider';
import { BookingWizard } from './BookingWizard';

/** Accessible dialog: focus trapped inside, Esc closes, scroll locked; a full-height sheet on phones, a side panel on desktop. */
export function BookingModal({ config, prefill, auto, onClose }: { config: BookingClientConfig; prefill: BookingPrefill; auto: boolean; onClose: (booked: boolean) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [booked, setBooked] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose(booked);
      if (e.key !== 'Tab' || !ref.current) return;
      const f = Array.from(ref.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea,[tabindex]:not([tabindex="-1"])')).filter((el) => el.offsetParent !== null);
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose, booked]);

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div className="absolute inset-0 bg-navy/60" onClick={() => onClose(booked)} aria-hidden="true" />
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="booking-title" className="relative flex h-[100dvh] w-full flex-col bg-background shadow-float motion-safe:animate-rise md:max-w-[34rem]">
        <div className="flex h-[72px] shrink-0 items-center justify-between gap-4 border-b border-border px-5 sm:px-7">
          <div>
            <p id="booking-title" className="font-heading text-xl font-semibold tracking-tight text-navy">
              Book an appointment
            </p>
            {auto && <p className="text-sm text-textSecondary">Takes about a minute. Close this any time.</p>}
          </div>
          <button type="button" onClick={() => onClose(booked)} className="flex h-11 w-11 items-center justify-center rounded-full border border-border text-navy hover:border-primary" aria-label="Close booking" data-autofocus>
            <Icon name="x" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7">
          <BookingWizard config={config} prefill={prefill} onBooked={() => setBooked(true)} headingLevel="h2" />
        </div>
      </div>
    </div>
  );
}
