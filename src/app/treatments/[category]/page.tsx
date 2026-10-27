import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BookButton } from '@/components/booking/BookButton';
import { PageHeader } from '@/components/layout/PageHeader';
import { JsonLd } from '@/components/seo/JsonLd';
import { Icon } from '@/components/ui/Icon';
import { Accordion, DraftBadge } from '@/components/ui/primitives';
import { categories, getCategory, getDepartment, getDoctorById, getImage, siteServices } from '@/lib/content';
import { faqJsonLd, treatmentJsonLd } from '@/lib/jsonld';
import { pageMetadata } from '@/lib/seo';

export const dynamicParams = false;
export const generateStaticParams = () => categories.map((c) => ({ category: c.slug }));

export function generateMetadata({ params }: { params: { category: string } }) {
  const c = getCategory(params.category);
  if (!c) return {};
  return pageMetadata({ path: `/treatments/${c.slug}`, title: c.seo.title, description: c.seo.description, image: getImage(c.image).src });
}

export default function CategoryPage({ params }: { params: { category: string } }) {
  const c = getCategory(params.category);
  if (!c) notFound();
  const dept = getDepartment(c.department)!;
  const img = getImage(c.image);
  const path = `/treatments/${c.slug}`;
  return (
    <>
      <JsonLd data={treatmentJsonLd(c, path)} />
      {c.faqs.length > 0 && <JsonLd data={faqJsonLd(c.faqs)} />}
      <PageHeader
        title={c.title}
        intro={c.short}
        eyebrow={dept.title}
        crumbs={[
          { name: 'Treatments', path: '/treatments' },
          { name: c.shortTitle, path },
        ]}
        aside={
          <div className="relative aspect-[4/3] overflow-hidden rounded-brand border border-border">
            <Image src={img.src} alt={img.alt} fill priority sizes="(min-width: 1024px) 30vw, 100vw" className="object-cover" style={{ objectPosition: img.objectPosition }} />
          </div>
        }
      >
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <BookButton prefill={{ treatment: c.slug }} className="btn-primary">
            Book for {c.shortTitle.toLowerCase()}
          </BookButton>
          <DraftBadge status={c.status} label="List to confirm with the clinic" />
        </div>
      </PageHeader>

      <section className="section">
        <div className="container-site grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
          <div>
            <div className="prose-site">
              {c.intro.map((t) => (
                <p key={t}>{t}</p>
              ))}
            </div>
            {dept.caution && <p className="mt-6 max-w-prose border-l-2 border-sky pl-4 text-sm text-textSecondary">{dept.caution}</p>}

            <h2 className="mt-12 text-[1.9rem]">What this covers</h2>
            <p className="mt-2 text-sm text-textSecondary">To be confirmed with the clinic. Visit counts are typical and vary from person to person.</p>
            <ul className="mt-6 divide-y divide-border border-y border-border">
              {c.subTreatments.map((s) => (
                <li key={s.slug} className="grid gap-2 py-5 sm:grid-cols-[1fr_auto] sm:gap-6">
                  <div>
                    <h3>{s.title}</h3>
                    <p className="mt-1 text-[0.97rem] text-textSecondary">{s.summary}</p>
                  </div>
                  <p className="flex items-start gap-1.5 text-sm font-medium text-primary sm:justify-end">
                    <Icon name="calendar" className="mt-0.5 h-4 w-4" /> {s.visits}
                  </p>
                </li>
              ))}
            </ul>

            {c.steps.length > 0 && (
              <>
                <h2 className="mt-12 text-[1.9rem]">How it usually goes</h2>
                <ol className="mt-6 space-y-4">
                  {c.steps.map((s, i) => (
                    <li key={s.title} className="flex gap-4 rounded-brand border border-border p-5">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy font-heading font-semibold text-onDark">{i + 1}</span>
                      <div>
                        <h3>{s.title}</h3>
                        <p className="mt-1 text-[0.97rem] text-textSecondary">{s.text}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </>
            )}

            {c.faqs.length > 0 && (
              <>
                <h2 className="mb-4 mt-12 text-[1.9rem]">Questions</h2>
                <Accordion name={`faq-${c.slug}`} items={c.faqs} />
              </>
            )}
          </div>
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-brand border border-border bg-surface p-6">
              <h2 className="text-xl">Who you will see</h2>
              <ul className="mt-4 space-y-3">
                {c.doctors.map((id) => {
                  const d = getDoctorById(id)!;
                  return (
                    <li key={id}>
                      <Link href={`/doctors/${d.slug}`} className="flex min-h-[56px] items-center gap-3 hover:text-primary">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-navy font-heading text-sm font-semibold text-onDark">{d.initials}</span>
                        <span>
                          <span className="block font-semibold">{d.displayName}</span>
                          <span className="text-sm text-textSecondary">{d.specialty}</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="rounded-brand border border-border bg-surfaceAlt p-6 text-sm text-textSecondary">
              <p className="font-semibold text-text">Fees</p>
              <p className="mt-1">{siteServices.priceNote}</p>
            </div>
            <Link href={`/departments/${dept.id}`} className="inline-flex min-h-[44px] items-center gap-1.5 font-semibold text-primary">
              <Icon name="chevron-left" className="h-4 w-4" /> {dept.title}
            </Link>
          </aside>
        </div>
      </section>
    </>
  );
}
