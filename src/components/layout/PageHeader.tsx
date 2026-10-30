import type { ReactNode } from 'react';
import { JsonLd } from '../seo/JsonLd';
import { Breadcrumbs } from '../ui/primitives';
import { cn } from '@/lib/cn';
import { breadcrumbJsonLd } from '@/lib/jsonld';

/**
 * Inner-page header: breadcrumbs, a large editorial H1 and an intro, on a faint blueprint grid. `banner` (e.g. a
 * department's tagline panel) sits under the breadcrumbs and fills the column beside a tall `aside`.
 */
export function PageHeader({ title, intro, crumbs, badge, eyebrow, children, aside, banner }: { title: string; intro?: string; crumbs: { name: string; path: string }[]; badge?: ReactNode; eyebrow?: string; children?: ReactNode; aside?: ReactNode; banner?: ReactNode }) {
  return (
    <section className="relative overflow-hidden border-b border-border bg-surfaceAlt">
      <JsonLd data={breadcrumbJsonLd([{ name: 'Home', path: '/' }, ...crumbs])} />
      <div className="grid-wash pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className={cn('container-site relative grid gap-8 py-10 sm:py-14 lg:grid-cols-[1.6fr_1fr] lg:py-16', banner ? 'lg:items-start' : 'lg:items-end')}>
        <div>
          <Breadcrumbs crumbs={crumbs} />
          {banner && <div className="mt-6">{banner}</div>}
          {eyebrow && <p className="eyebrow mt-8">{eyebrow}</p>}
          <h1 className="mt-5 max-w-3xl text-balance">
            {title}
            {badge && <span className="ml-3 inline-block align-middle">{badge}</span>}
          </h1>
          {intro && <p className="lead mt-5 max-w-2xl">{intro}</p>}
          {children}
        </div>
        {aside}
      </div>
    </section>
  );
}
