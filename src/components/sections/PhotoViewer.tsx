'use client';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { fitClass, fitStyle, type Framable } from '@/lib/image-fit';
import { Icon } from '../ui/Icon';

export type ViewerPhoto = Framable & { id: string; src: string; alt: string; width: number; height: number; caption: string; category?: string };

/**
 * Clinic photos that open full screen. Native <dialog> (Esc closes, focus returns to the tile), arrow keys and
 * buttons step through the photos. Every photo is in the server HTML, so crawlers and no-JS visitors see them all.
 * layout="bento": the home page's mosaic. layout="grid": the gallery page, with category filter chips.
 */
export function PhotoViewer({ photos, layout, categories }: { photos: ViewerPhoto[]; layout: 'bento' | 'grid'; categories?: string[] }) {
  const [filter, setFilter] = useState<string | null>(null);
  const [index, setIndex] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const shown = filter ? photos.filter((p) => p.category === filter) : photos;

  const openAt = (i: number) => {
    setIndex(i);
    dialog.current?.showModal();
  };
  const step = useCallback((by: number) => setIndex((i) => (i === null ? i : (i + by + shown.length) % shown.length)), [shown.length]);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    const onClose = () => setIndex(null);
    d.addEventListener('keydown', onKey);
    d.addEventListener('close', onClose);
    return () => {
      d.removeEventListener('keydown', onKey);
      d.removeEventListener('close', onClose);
    };
  }, [step]);

  const current = index === null ? null : shown[index];

  return (
    <>
      {categories && (
        <div role="group" aria-label="Show photos of" className="no-scrollbar -mx-4 mb-8 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {[null, ...categories].map((c) => (
            <button key={c ?? 'all'} type="button" aria-pressed={filter === c} onClick={() => setFilter(c)} className={cn('chip shrink-0', filter === c && '!border-primary !bg-primary !text-onDark')}>
              {c ?? 'All photos'}
              <span className={cn('text-xs', filter === c ? 'text-onDark/80' : 'text-textSecondary')}>{c ? photos.filter((p) => p.category === c).length : photos.length}</span>
            </button>
          ))}
        </div>
      )}

      <ul className={layout === 'bento' ? 'grid auto-rows-[9.5rem] grid-cols-2 gap-3 sm:auto-rows-[12rem] lg:grid-cols-4 lg:gap-4' : 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4'}>
        {shown.map((p, i) => {
          const span = layout === 'bento' ? (i === 0 ? 'col-span-2 row-span-2' : i === 1 || i >= 4 ? 'col-span-2' : '') : '';
          return (
            <li key={p.id} className={cn(layout === 'grid' && 'motion-safe:animate-rise', span)}>
              <figure className="h-full">
                <button type="button" onClick={() => openAt(i)} aria-haspopup="dialog" aria-label={`View larger: ${p.caption}`} className={cn('group relative block w-full overflow-hidden rounded-brand border border-border bg-tint', layout === 'bento' ? 'h-full' : 'aspect-[3/4]')}>
                  <Image src={p.src} alt={p.alt} fill sizes={layout === 'bento' && i === 0 ? '(min-width: 1024px) 50vw, 100vw' : '(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw'} className={cn('transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transition-none', fitClass(p))} style={fitStyle(p)} />
                  <span aria-hidden="true" className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-surface/90 text-navy opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                    <Icon name="maximize" className="h-4 w-4" />
                  </span>
                  {layout === 'bento' && <span className="absolute left-2 top-2 rounded-full bg-surface/90 px-3 py-1 text-xs font-medium text-navy">{p.caption}</span>}
                </button>
                {layout === 'grid' && <figcaption className="mt-2 text-sm text-textSecondary">{p.caption}</figcaption>}
              </figure>
            </li>
          );
        })}
      </ul>

      <dialog ref={dialog} aria-label="Clinic photo" className="m-auto h-[100dvh] max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-navy/95">
        {current && (
          <div className="flex h-full flex-col text-onDark">
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <p className="text-sm text-onDarkMuted" aria-live="polite">
                {index! + 1} / {shown.length}
              </p>
              <button type="button" onClick={() => dialog.current?.close()} className="flex h-11 w-11 items-center justify-center rounded-full border border-onDark/30 hover:border-onDark" aria-label="Close">
                <Icon name="x" />
              </button>
            </div>
            <div className="relative flex-1">
              <Image key={current.id} src={current.src} alt={current.alt} fill sizes="100vw" className="object-contain motion-safe:animate-rise" />
            </div>
            <div className="flex items-center justify-between gap-4 px-4 py-4">
              <button type="button" onClick={() => step(-1)} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-onDark/30 hover:border-onDark" aria-label="Previous photo">
                <Icon name="chevron-left" />
              </button>
              <p className="text-center font-medium">{current.caption}</p>
              <button type="button" onClick={() => step(1)} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-onDark/30 hover:border-onDark" aria-label="Next photo">
                <Icon name="chevron-right" />
              </button>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
