import Image from 'next/image';
import Link from 'next/link';
import { getDepartment, getImage } from '@/lib/content';
import type { Doctor } from '@/lib/content/schemas';
import { BookButton } from './booking/BookButton';
import { Icon } from './ui/Icon';
import { DraftBadge, Initials } from './ui/primitives';
import { fitClass, fitStyle } from '@/lib/image-fit';

/** Doctor card: portrait (own photo or initials), name, degree, speciality chips and department. */
export function DoctorCard({ d, headingLevel: H = 'h3' }: { d: Doctor; headingLevel?: 'h2' | 'h3' }) {
  const photo = d.photo ? getImage(d.photo) : null;
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-brand border border-border bg-surface transition-shadow hover:shadow-card">
      <Link href={`/doctors/${d.slug}`} className="relative block aspect-[4/3] overflow-hidden" tabIndex={-1} aria-hidden="true">
        {photo ? (
          <Image src={photo.src} alt="" fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className={`${fitClass(photo)} transition-transform duration-500 group-hover:scale-[1.03]`} style={fitStyle(photo)} />
        ) : (
          <Initials initials={d.initials} className="h-full w-full text-6xl" />
        )}
        {d.isHead && <span className="absolute left-3 top-3 rounded-full bg-surface px-3 py-1 text-xs font-semibold text-navy">Lead doctor</span>}
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{d.departments.map((id) => getDepartment(id)?.shortTitle).join(' · ')}</p>
        <H className="mt-2 text-[1.3rem]">
          <Link href={`/doctors/${d.slug}`} className="inline-flex min-h-[44px] items-center hover:text-primary">
            {d.displayName}
          </Link>
        </H>
        <p className="mt-1 text-sm font-medium text-text">{d.qualification}</p>
        <p className="text-sm text-textSecondary">{d.specialty}</p>
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {d.chips.map((c) => (
            <li key={c} className="chip-static">
              {c}
            </li>
          ))}
        </ul>
        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <BookButton prefill={{ doctor: d.slug }} className="btn-ghost !min-h-[44px] !px-4 text-sm" ariaLabel={`Book with ${d.displayName}`}>
            Book
          </BookButton>
          {!d.registrationNumber && <DraftBadge status="placeholder" label="Reg. no. pending" />}
        </div>
      </div>
    </article>
  );
}

export function ArticleCard({ a }: { a: { slug: string; title: string; description: string; category: string; image: string; readingMinutes: number } }) {
  const img = getImage(a.image);
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-brand border border-border bg-surface">
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image src={img.src} alt="" fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className={`${fitClass(img)} transition-transform duration-500 group-hover:scale-[1.03]`} style={fitStyle(img)} />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{a.category}</p>
        <h3 className="mt-2 text-[1.2rem]">
          <Link href={`/patient-education/${a.slug}`} className="after:absolute after:inset-0 hover:text-primary">
            {a.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-3 text-sm text-textSecondary">{a.description}</p>
        <p className="mt-auto flex items-center gap-1.5 pt-4 text-sm text-textSecondary">
          <Icon name="clock" className="h-4 w-4" /> {a.readingMinutes} min read
        </p>
      </div>
    </article>
  );
}

/** Treatment card for department and treatments pages. */
export function TreatmentCard({ slug, title, short, icon, status }: { slug: string; title: string; short: string; icon: string; status: 'approved' | 'placeholder' }) {
  return (
    <article className="group relative flex h-full flex-col rounded-brand border border-border bg-surface p-6 transition-colors hover:border-primary">
      <span className="icon-tile-lg">
        <Icon name={icon} className="h-8 w-8" strokeWidth={1.6} />
      </span>
      <h3 className="mt-5 text-[1.25rem]">
        <Link href={`/treatments/${slug}`} className="after:absolute after:inset-0 group-hover:text-primary">
          {title}
        </Link>
      </h3>
      <p className="mt-2 text-[0.97rem] text-textSecondary">{short}</p>
      <div className="mt-auto flex items-center justify-between pt-5">
        <DraftBadge status={status} label="To confirm" />
        <Icon name="arrow-up-right" className="ml-auto h-5 w-5 text-sky" />
      </div>
    </article>
  );
}

/**
 * Department picture card: the department's own photo under a navy fade, a large icon badge and the title.
 * `href` is a page or an in-page anchor (#dental on Treatments). Used on Treatments and Departments.
 */
export function DepartmentTile({ id, href, title, line, icon, aspect = 'aspect-[4/5]', priority = false, sizes = '(min-width: 1024px) 25vw, 50vw' }: { id: string; href: string; title: string; line?: string; icon: string; aspect?: string; priority?: boolean; sizes?: string }) {
  const img = getImage(getDepartment(id)!.image);
  return (
    <Link href={href} className={`group relative isolate block overflow-hidden rounded-brand border border-border bg-navy ${aspect}`}>
      <Image src={img.src} alt={img.alt} fill priority={priority} sizes={sizes} className={`-z-10 ${fitClass(img)} transition-transform duration-700 group-hover:scale-[1.05] motion-reduce:transition-none`} style={fitStyle(img)} />
      <span aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-navy via-navy/55 to-transparent" />
      <span className="flex h-full flex-col justify-end p-4 sm:p-5">
        <span className="flex h-14 w-14 items-center justify-center rounded-tile bg-sky text-navy shadow-card transition-transform group-hover:-translate-y-1 sm:h-16 sm:w-16">
          <Icon name={icon} className="h-8 w-8 sm:h-9 sm:w-9" strokeWidth={1.7} />
        </span>
        <span className="mt-3 block font-heading text-xl font-semibold leading-tight text-onDark sm:text-2xl">{title}</span>
        {line && <span className="mt-1 block text-sm text-onDark/85">{line}</span>}
      </span>
    </Link>
  );
}
