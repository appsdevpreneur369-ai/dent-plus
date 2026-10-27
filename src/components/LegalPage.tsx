import { notFound } from 'next/navigation';
import { getLegal, sitePages } from '@/lib/content';
import { pageMetadata } from '@/lib/seo';
import { PageHeader } from './layout/PageHeader';

type Key = 'privacy' | 'terms' | 'disclaimer' | 'cookies';

export const legalMetadata = (key: Key) => pageMetadata({ path: `/${key}`, title: sitePages[key].title, description: sitePages[key].description });

export function LegalPage({ slug }: { slug: Key }) {
  const l = getLegal(slug);
  if (!l) notFound();
  return (
    <>
      <PageHeader
        title={l.meta.title}
        crumbs={[{ name: l.meta.title, path: `/${slug}` }]}
        badge={l.meta.draft ? <span className="inline-flex h-7 items-center rounded-full border border-warning/35 bg-warningSoft px-3 font-body text-sm font-semibold text-warningText">Draft</span> : undefined}
      >
        <p className="mt-4 text-sm text-textSecondary">Last updated {new Date(l.meta.lastUpdated).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </PageHeader>
      <section className="section">
        <div className="container-site">
          <div className="prose-site" dangerouslySetInnerHTML={{ __html: l.html }} />
        </div>
      </section>
    </>
  );
}
