import Image from 'next/image';
import Link from 'next/link';
import { getDepartment, getImage } from '@/lib/content';
import type { Doctor } from '@/lib/content/schemas';
import { BookButton } from './booking/BookButton';
import { Icon } from './ui/Icon';
import { DraftBadge, Initials } from './ui/primitives';

/** Doctor card: portrait (own photo or initials), name, degree, speciality chips and department. */
export function DoctorCard({ d, headingLevel: H = 'h3' }: { d: Doctor; headingLevel?: 'h2' | 'h3' }) {
  const photo = d.photo ? getImage(d.photo) : null;
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-brand border border-border bg-surface transition-shadow hover:shadow-card">
      <Link href={`/doctors/${d.slug}`} className="relative block aspect-[4/3] overflow-hidden" tabIndex={-1} aria-hidden="true">
        {photo ? (
          <Image src={photo.src} alt="" fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" style={{ objectPosition: photo.objectPosition }} />
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
        <Image src={img.src} alt="" fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" style={{ objectPosition: img.objectPosition }} />
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
      <span className="icon-tile">
        <Icon name={icon} />
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
