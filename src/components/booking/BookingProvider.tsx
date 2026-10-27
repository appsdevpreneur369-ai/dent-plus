'use client';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { BookingClientConfig } from '@/lib/booking/config';
import { autoOpenDelayMs, canAutoOpen } from '@/lib/booking/popupRules';
import { readPopupState, writePopupState } from '@/lib/booking/storage';

export type BookingPrefill = { department?: string; problem?: string; treatment?: string; doctor?: string };
type Ctx = { open: (prefill?: BookingPrefill) => void; config: BookingClientConfig };

const BookingCtx = createContext<Ctx | null>(null);

// The modal (and the booking logic it pulls in) loads only when first opened.
const BookingModal = dynamic(() => import('./BookingModal').then((m) => m.BookingModal), { ssr: false });

export function BookingProvider({ config, children }: { config: BookingClientConfig; children: ReactNode }) {
  const pathname = usePathname();
  const [state, setState] = useState<{ open: boolean; prefill: BookingPrefill; auto: boolean }>({ open: false, prefill: {}, auto: false });
  const shownThisPage = useRef(false);
  const opener = useRef<HTMLElement | null>(null);

  const open = useCallback((prefill: BookingPrefill = {}) => {
    shownThisPage.current = true;
    opener.current = document.activeElement as HTMLElement | null;
    writePopupState('opened');
    setState({ open: true, prefill, auto: false });
  }, []);

  const close = useCallback((booked: boolean) => {
    writePopupState(booked ? 'booked' : 'closed');
    setState((s) => ({ ...s, open: false }));
    requestAnimationFrame(() => opener.current?.focus?.());
  }, []);

  // Auto-open once per session after the configured delay (never on excluded pages or on load).
  useEffect(() => {
    shownThisPage.current = false; // new page (client-side navigation)
    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    if (!canAutoOpen({ config: config.popup, pathname, isMobile, sessionState: readPopupState(), shownThisPage: shownThisPage.current })) return;
    const t = window.setTimeout(() => {
      // Re-check: the visitor may have opened and closed it themselves during the delay.
      if (!canAutoOpen({ config: config.popup, pathname, isMobile, sessionState: readPopupState(), shownThisPage: shownThisPage.current })) return;
      shownThisPage.current = true;
      opener.current = document.activeElement as HTMLElement | null;
      writePopupState('opened');
      setState({ open: true, prefill: {}, auto: true });
    }, autoOpenDelayMs(config.popup));
    return () => window.clearTimeout(t);
  }, [pathname, config.popup]);

  return (
    <BookingCtx.Provider value={{ open, config }}>
      {children}
      {state.open && <BookingModal config={config} prefill={state.prefill} auto={state.auto} onClose={close} />}
    </BookingCtx.Provider>
  );
}

export function useBooking(): Ctx {
  const c = useContext(BookingCtx);
  if (!c) throw new Error('useBooking must be used inside <BookingProvider>');
  return c;
}
