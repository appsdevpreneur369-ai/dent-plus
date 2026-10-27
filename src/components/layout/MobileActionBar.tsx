'use client';
import { BookButton } from '../booking/BookButton';
import { Icon } from '../ui/Icon';

/** Sticky bottom bar on phones and small tablets: Call / Book / Directions. Call is hidden while the phone is a placeholder. */
export function MobileActionBar({ callHref, directionsHref }: { callHref: string | null; directionsHref: string }) {
  const item = 'flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 text-[0.78rem] font-semibold';
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <div className="flex items-stretch gap-2 px-3 py-2">
        {callHref && (
          <a href={callHref} className={`${item} rounded-full text-navy`}>
            <Icon name="phone" className="h-5 w-5 text-primary" /> Call
          </a>
        )}
        <BookButton className={`${item} flex-[1.6] rounded-full bg-primary text-onDark`}>
          <Icon name="calendar-check" className="h-5 w-5" /> Book
        </BookButton>
        <a href={directionsHref} target="_blank" rel="noopener noreferrer" className={`${item} rounded-full text-navy`}>
          <Icon name="navigation" className="h-5 w-5 text-primary" /> Directions
        </a>
      </div>
    </div>
  );
}
