'use client';
import { useEffect, useState } from 'react';
import { useBooking, type BookingPrefill } from '@/components/booking/BookingProvider';
import { BookingWizard } from '@/components/booking/BookingWizard';
import { writePopupState } from '@/lib/booking/storage';

/**
 * /book: the wizard inline. Deep links (?department= / ?problem= / ?treatment= / ?doctor=) are read after mount rather
 * than with useSearchParams, so the page stays fully static and the first step is in the HTML.
 */
export function BookPageWizard() {
  const { config } = useBooking();
  const [prefill, setPrefill] = useState<BookingPrefill | null>(null);
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const p = { department: sp.get('department') ?? undefined, problem: sp.get('problem') ?? undefined, treatment: sp.get('treatment') ?? undefined, doctor: sp.get('doctor') ?? undefined };
    if (p.department || p.problem || p.treatment || p.doctor) setPrefill(p);
  }, []);
  // Remount with the deep link once it is known (the key changes from 'plain' to the prefill).
  return <BookingWizard key={prefill ? JSON.stringify(prefill) : 'plain'} config={config} prefill={prefill ?? {}} onBooked={() => writePopupState('booked')} headingLevel="h2" />;
}
