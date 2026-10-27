import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BookButton } from '@/components/booking/BookButton';
import { TreatmentCard } from '@/components/cards';
import { PageHeader } from '@/components/layout/PageHeader';
import { JsonLd } from '@/components/seo/JsonLd';
import { Icon } from '@/components/ui/Icon';
import { DraftBadge, Initials, SectionHead } from '@/components/ui/primitives';
import { categories, getDepartment, getDoctor, getImage, siteDoctors } from '@/lib/content';
import { dayRangeShort, formatSessions } from '@/lib/hours';
import { physicianJsonLd } from '@/lib/jsonld';
import { pageMetadata } from '@/lib/seo';

export const dynamicParams = false;
export const generateStaticParams = () => siteDoctors.map((d) => ({ slug: d.slug }));

export function generateMetadata({ params }: { params: { slug: string } }) {
  const d = getDoctor(params.slug);
  if (!d) return {};
  return pageMetadata({ path: `/doctors/${d.slug}`, title: `${d.displayName}, ${d.specialty}`, description: `${d.displayName} (${d.qualification}), ${d.specialty} at Dent Plus, Lakshmipuram, Guntur. ${d.summary}` });
}

export default function DoctorPage({ params }: { params: { slug: string } }) {
  const d = getDoctor(params.slug);
  if (!d) notFound();
  const photo = d.photo ? getImage(d.photo) : null;
  const cats = categories.filter((c) => c.doctors.includes(d.id));
  const council = d.council === 'dental' ? 'State Dental Council' : 'State Medical Council';
  return (
    <>
      <JsonLd data={physicianJsonLd(d)} />
      <PageHeader
        title={d.displayName}
        eyebrow={d.departments.map((id) => getDepartment(id)?.title).join(' · ')}
        crumbs={[
          { name: 'Doctors', path: '/doctors' },
          { name: d.displayName, path: `/doctors/${d.slug}` },
        ]}
        aside={
          <div className="relative mx-auto aspect-square w-full max-w-[20rem] overflow-hidden rounded-brand border border-border lg:mx-0 lg:ml-auto">
            {photo ? <Image src={photo.src} alt={photo.alt} fill priority sizes="20rem" className="object-cover" style={{ objectPosition: photo.objectPosition }} /> : <Initials initials={d.initials} className="h-full w-full text-7xl" />}
          </div>
        }
      >
        <p className="mt-4 text-lg font-medium text-text">{d.qualification}</p>
        <p className="text-textSecondary">{d.specialty}</p>
        {d.role && <p className="mt-1 text-sm text-textSecondary">{d.role}</p>}
        <div className="mt-6 flex flex-wrap gap-3">
          <BookButton prefill={{ doctor: d.slug }} className="btn-primary">
            Book with {d.displayName.replace(/^Dr\. [A-Z]\. /, 'Dr. ')}
          </BookButton>
        </div>
      </PageHeader>
      <section className="section">
        <div className="container-site grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
          <div>
            <h2 className="text-[1.9rem]">About {d.displayName}</h2>
            <div className="prose-site mt-2">
              {d.bio.map((b) => (
                <p key={b}>{b}</p>
              ))}
            </div>
            <h3 className="mt-10">Areas of focus</h3>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {d.focus.map((f) => (
                <li key={f} className="flex items-start gap-2.5 rounded-tile border border-border px-4 py-3 text-[0.97rem]">
                  <span aria-hidden="true" className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky text-xs font-bold text-onDark">
                    +
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <aside className="space-y-4">
            <dl className="divide-y divide-border rounded-brand border border-border bg-surface px-6">
              <div className="py-4">
                <dt className="text-sm text-textSecondary">Qualification</dt>
                <dd className="mt-1 font-medium">{d.qualification}</dd>
              </div>
              <div className="py-4">
                <dt className="text-sm text-textSecondary">Registration ({council})</dt>
                <dd className="mt-1 flex flex-wrap items-center gap-2 font-medium">{d.registrationNumber || <>Being confirmed <DraftBadge status="placeholder" /></>}</dd>
              </div>
              <div className="py-4">
                <dt className="text-sm text-textSecondary">Consultation hours</dt>
                <dd className="mt-1 font-medium">
                  {d.consultation.map((c) => (
                    <span key={c.opens} className="block">
                      {dayRangeShort(c.days)}, {formatSessions([{ opens: c.opens, closes: c.closes }])}
                    </span>
                  ))}
                  <span className="mt-1 flex items-center gap-2 text-sm font-normal text-textSecondary">
                    Clinic hours; doctor&apos;s own times being confirmed <DraftBadge status={d.consultationStatus} />
                  </span>
                </dd>
              </div>
              <div className="py-4">
                <dt className="text-sm text-textSecondary">Consultation fee</dt>
                <dd className="mt-1 flex items-center gap-2 font-medium">
                  Being confirmed <DraftBadge status="placeholder" />
                </dd>
              </div>
            </dl>
            <Link href="/doctors" className="inline-flex min-h-[44px] items-center gap-1.5 font-semibold text-primary">
              <Icon name="chevron-left" className="h-4 w-4" /> All doctors
            </Link>
          </aside>
        </div>
      </section>
      {cats.length > 0 && (
        <section className="section border-t border-border bg-surfaceAlt">
          <div className="container-site">
            <SectionHead eyebrow="Sees patients for" title="Treatments and visits" />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {cats.map((c) => (
                <TreatmentCard key={c.slug} slug={c.slug} title={c.title} short={c.short} icon={c.icon} status={c.status} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
