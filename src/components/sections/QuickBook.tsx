'use client';
import { useState } from 'react';
import { cn } from '@/lib/cn';
import { useBooking } from '../booking/BookingProvider';
import { Icon } from '../ui/Icon';

/** Hero "Book in 30 seconds" card: pick a department here, the booking panel opens on its concern step. */
export function QuickBook({ title, lead, button, note, callHref, callDisplay }: { title: string; lead: string; button: string; note: string; callHref: string | null; callDisplay: string | null }) {
  const { open, config } = useBooking();
  const [dept, setDept] = useState(config.departments[0]?.id ?? '');
  return (
    <div className="rounded-brand border border-border bg-surface p-5 shadow-float sm:p-6">
      <p className="font-heading text-xl font-semibold tracking-tight text-navy">{title}</p>
      <p className="mt-1 text-sm text-textSecondary">{lead}</p>
      <fieldset className="mt-4">
        <legend className="sr-only">Department</legend>
        <div className="grid grid-cols-2 gap-2">
          {config.departments.map((d) => (
            <label key={d.id} className={cn('flex min-h-[48px] cursor-pointer items-center gap-2 rounded-tile border px-3 text-sm font-semibold transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary', dept === d.id ? 'border-primary bg-skySoft text-primaryDeep' : 'border-border text-text hover:border-primary')}>
              <input type="radio" name="qb-dept" value={d.id} checked={dept === d.id} onChange={() => setDept(d.id)} className="sr-only" />
              <Icon name={d.icon} className="h-4 w-4 text-primary" />
              {d.shortTitle}
            </label>
          ))}
        </div>
      </fieldset>
      <button type="button" className="btn-primary mt-4 w-full" onClick={() => open({ department: dept })} aria-haspopup="dialog">
        {button} <Icon name="arrow-right" className="h-4 w-4" />
      </button>
      {callHref && (
        <p className="mt-3 text-center text-sm text-textSecondary">
          {note}{' '}
          <a href={callHref} className="inline-flex min-h-[44px] items-center font-semibold text-primary underline">
            {callDisplay}
          </a>
        </p>
      )}
    </div>
  );
}
