'use client';
import { useState } from 'react';
import { Icon } from '../ui/Icon';

/** Google Map loaded only when the visitor asks for it (no Google scripts or cookies until then; see the Cookie Policy). */
export function MapFacade({ src, title, label, note }: { src: string; title: string; label: string; note?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-brand border border-border bg-skySoft">
      {show ? (
        <iframe title={title} src={src} referrerPolicy="no-referrer-when-downgrade" className="absolute inset-0 h-full w-full border-0" />
      ) : (
        <button type="button" onClick={() => setShow(true)} className="group absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
          <span aria-hidden="true" className="grid-wash absolute inset-0 opacity-80" />
          <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-navy text-onDark shadow-float transition-transform group-hover:scale-105">
            <Icon name="map-pin" className="h-6 w-6" />
          </span>
          <span className="relative rounded-full border border-border bg-surface px-5 py-2.5 font-semibold text-navy">{label}</span>
          <span className="relative text-sm text-textSecondary">{note ?? 'Loads Google Maps'}</span>
        </button>
      )}
    </div>
  );
}
