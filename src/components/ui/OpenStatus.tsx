'use client';
import { useEffect, useState } from 'react';
import { openStatus, openStatusText, type DayHours } from '@/lib/hours';
import { cn } from '@/lib/cn';

/** Live "Open now · closes 9:00 PM" badge in Asia/Kolkata, computed in the browser (static pages stay correct). */
export function OpenStatus({ hours, timeZone, className, variant = 'pill' }: { hours: DayHours[]; timeZone: string; className?: string; variant?: 'pill' | 'plain' | 'onDark' }) {
  const [s, setS] = useState<ReturnType<typeof openStatus> | null>(null);
  useEffect(() => {
    const tick = () => setS(openStatus(hours, timeZone));
    tick();
    const t = setInterval(tick, 60_000);
    return () => clearInterval(t);
  }, [hours, timeZone]);
  const open = s?.open;
  return (
    <span
      className={cn(
        'inline-flex min-h-[32px] items-center gap-2 text-sm font-semibold',
        variant === 'pill' && 'rounded-full px-3 py-1',
        variant === 'pill' && (!s ? 'bg-surfaceAlt text-textSecondary' : open ? 'bg-successSoft text-success' : 'bg-warningSoft text-warningText'),
        variant === 'plain' && (!s ? 'text-textSecondary' : open ? 'text-success' : 'text-warning'),
        // On navy (top info bar): white text; only the dot carries the open/closed colour.
        variant === 'onDark' && 'text-onDark',
        className,
      )}
      aria-live="polite"
    >
      <span className={cn('h-2 w-2 rounded-full', !s ? 'bg-border' : open ? cn('animate-pulse-dot', variant === 'onDark' ? 'bg-successOnDark' : 'bg-success') : variant === 'onDark' ? 'bg-warningOnDark' : 'bg-warning')} aria-hidden="true" />
      {s ? openStatusText(s) : 'Checking hours…'}
    </span>
  );
}
