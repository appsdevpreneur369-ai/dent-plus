'use client';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { useBooking, type BookingPrefill } from './BookingProvider';

/** Every "Book" button on the site: opens the booking popup (optionally pre-filled). */
export function BookButton({ children, className, prefill, ariaLabel }: { children: ReactNode; className?: string; prefill?: BookingPrefill; ariaLabel?: string }) {
  const { open } = useBooking();
  return (
    <button type="button" className={cn(className ?? 'btn-cta')} onClick={() => open(prefill)} aria-label={ariaLabel} aria-haspopup="dialog">
      {children}
    </button>
  );
}
