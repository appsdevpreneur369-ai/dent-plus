import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import type { ImageRef, Status } from '@/lib/content/schemas';
import { SHOW_BADGES } from '@/lib/site';
import { cn } from '@/lib/cn';
import { fitClass, fitStyle } from '@/lib/image-fit';
import { Icon } from './Icon';

/** "Draft" badge on placeholder content — only when NEXT_PUBLIC_SHOW_PLACEHOLDER_BADGES=true. */
export function DraftBadge({ status, className, label = 'Draft' }: { status: Status | undefined; className?: string; label?: string }) {
  if (!SHOW_BADGES || status !== 'placeholder') return null;
  return (
    <span
      className={cn('inline-flex h-6 shrink-0 items-center rounded-full border border-warning/35 bg-warningSoft px-2.5 align-middle font-body text-xs font-semibold tracking-wide text-warningText', className)}
      title="Placeholder: awaiting the clinic's confirmation"
    >
      {label}
    </span>
  );
}

export function SectionHead({ eyebrow, title, lead, as: H = 'h2', center, id, action, className }: { eyebrow?: string; title: string; lead?: string; as?: 'h1' | 'h2'; center?: boolean; id?: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('mb-10 flex flex-col gap-6 sm:mb-14 lg:flex-row lg:items-end lg:justify-between', center && 'items-center text-center lg:flex-col lg:items-center', className)}>
      <div className={cn('max-w-2xl', center && 'mx-auto')}>
        {eyebrow && <p className="eyebrow mb-5">{eyebrow}</p>}
        <H id={id} className="text-balance">
          {title}
        </H>
        {lead && <p className="lead mt-4">{lead}</p>}
      </div>
      {action}
    </div>
  );
}

/** Initials portrait until a real doctor photo exists (never stock photos of people as our doctors). */
export function Initials({ initials, className }: { initials: string; className?: string }) {
  return (
    <span aria-hidden="true" className={cn('relative flex items-center justify-center overflow-hidden bg-navy font-heading font-semibold tracking-tight text-onDark', className)}>
      <span className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/70" />
      <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-sky text-sm font-bold">+</span>
      <span className="relative">{initials}</span>
    </span>
  );
}

export function ContentImage({ img, className, priority, sizes, fill }: { img: ImageRef; className?: string; priority?: boolean; sizes?: string; fill?: boolean }) {
  if (fill)
    return <Image src={img.src} alt={img.alt} fill priority={priority} sizes={sizes ?? '100vw'} className={cn(fitClass(img), className)} style={fitStyle(img)} />;
  return <Image src={img.src} alt={img.alt} width={img.width} height={img.height} priority={priority} sizes={sizes ?? '(min-width: 1024px) 50vw, 100vw'} className={cn('h-auto w-full object-cover', className)} />;
}

/** Accessible accordion on native <details>: keyboard and screen-reader friendly without JavaScript. */
export function Accordion({ items, name }: { items: { q: string; a: ReactNode }[]; name?: string }) {
  return (
    <div className="divide-y divide-border border-y border-border">
      {items.map((it, i) => (
        <details key={i} name={name} className="group">
          <summary className="flex min-h-[64px] cursor-pointer list-none items-center justify-between gap-6 py-5 text-left font-heading text-[1.15rem] font-medium text-text marker:hidden hover:text-primary [&::-webkit-details-marker]:hidden">
            <span>{it.q}</span>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-primary transition-all group-open:rotate-45 group-open:border-sky group-open:bg-sky group-open:text-onDark">
              <span aria-hidden="true" className="text-xl leading-none">+</span>
            </span>
          </summary>
          <div className="max-w-3xl pb-6 text-textSecondary">{it.a}</div>
        </details>
      ))}
    </div>
  );
}

export function TextLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={cn('group inline-flex min-h-[44px] items-center gap-1.5 font-semibold text-primary hover:text-primaryDeep', className)}>
      {children}
      <Icon name="arrow-right" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

export function Breadcrumbs({ crumbs }: { crumbs: { name: string; path: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-textSecondary">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link href="/" className="inline-flex min-h-[32px] items-center hover:text-primary">
            Home
          </Link>
        </li>
        {crumbs.map((c, i) => (
          <li key={c.path} className="flex items-center gap-1.5">
            <Icon name="chevron-right" className="h-3.5 w-3.5" />
            {i === crumbs.length - 1 ? (
              <span aria-current="page" className="text-text">
                {c.name}
              </span>
            ) : (
              <Link href={c.path} className="inline-flex min-h-[32px] items-center hover:text-primary">
                {c.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
