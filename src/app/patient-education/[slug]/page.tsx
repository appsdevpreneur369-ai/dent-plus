import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BookButton } from '@/components/booking/BookButton';
import { PageHeader } from '@/components/layout/PageHeader';
import { JsonLd } from '@/components/seo/JsonLd';
import { Icon } from '@/components/ui/Icon';
import { articles, getArticle, getDoctorById, getImage } from '@/lib/content';
import { articleJsonLd } from '@/lib/jsonld';
import { pageMetadata } from '@/lib/seo';
import { fitClass, fitStyle } from '@/lib/image-fit';

export const dynamicParams = false;
export const generateStaticParams = () => articles.map((a) => ({ slug: a.meta.slug }));

export function generateMetadata({ params }: { params: { slug: string } }) {
  const a = getArticle(params.slug);
  if (!a) return {};
  return pageMetadata({ path: `/patient-education/${a.meta.slug}`, title: a.meta.title, description: a.meta.description, image: getImage(a.meta.image).src, type: 'article' });
}

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const a = getArticle(params.slug);
  if (!a) notFound();
  const m = a.meta;
  const reviewer = getDoctorById(m.reviewedBy);
  const img = getImage(m.image);
  const path = `/patient-education/${m.slug}`;
  return (
    <>
      <JsonLd data={articleJsonLd({ path, title: m.title, description: m.description, datePublished: m.datePublished, image: m.image, reviewer, wordCount: a.words })} />
      <PageHeader
        title={m.title}
        intro={m.description}
        eyebrow={m.category}
        crumbs={[
          { name: 'Patient guides', path: '/patient-education' },
          { name: m.title, path },
        ]}
      >
        <p className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-textSecondary">
          <span className="flex items-center gap-1.5">
            <Icon name="clock" className="h-4 w-4" /> {m.readingMinutes} min read
          </span>
          {reviewer && (
            <span>
              {m.reviewStatus === 'reviewed' ? 'Reviewed by' : 'Awaiting review by'}{' '}
              <Link href={`/doctors/${reviewer.slug}`} className="font-semibold text-primary hover:underline">
                {reviewer.displayName}
              </Link>
            </span>
          )}
        </p>
      </PageHeader>
      <section className="section">
        <div className="container-site grid gap-12 lg:grid-cols-[1fr_18rem] lg:gap-16">
          <article>
            <div className="relative mb-10 aspect-[16/8] overflow-hidden rounded-brand border border-border">
              <Image src={img.src} alt={img.alt} fill priority sizes="(min-width: 1024px) 50vw, 100vw" className={fitClass(img)} style={fitStyle(img)} />
            </div>
            <div className="prose-site" dangerouslySetInnerHTML={{ __html: a.html }} />
          </article>
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            {a.headings.length > 0 && (
              <nav aria-label="On this page" className="rounded-brand border border-border p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-textSecondary">On this page</p>
                <ul className="mt-3 space-y-2 text-sm">
                  {a.headings.map((h) => (
                    <li key={h} className="text-text">
                      {h}
                    </li>
                  ))}
                </ul>
              </nav>
            )}
            <div className="rounded-brand bg-navy p-5 text-onDark">
              <p className="font-heading text-lg font-semibold">Questions about this?</p>
              <p className="mt-1 text-sm text-onDarkMuted">Talk it through with {reviewer?.displayName ?? 'our doctors'}.</p>
              <BookButton prefill={reviewer ? { doctor: reviewer.slug } : {}} className="btn-light mt-4 w-full !min-h-[44px] text-sm">
                Book a visit
              </BookButton>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
