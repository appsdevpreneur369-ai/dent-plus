import { PageHeader } from '@/components/layout/PageHeader';
import { JsonLd } from '@/components/seo/JsonLd';
import { Accordion } from '@/components/ui/primitives';
import { siteFaqs, sitePages } from '@/lib/content';
import { faqJsonLd } from '@/lib/jsonld';
import { pageMetadata } from '@/lib/seo';
import { fill } from '@/lib/vars';

const p = sitePages.faqs;
export const metadata = pageMetadata({ path: '/faqs', title: p.title, description: p.description });

export default function FaqsPage() {
  const items = siteFaqs.items.map((f) => ({ q: fill(f.q), a: fill(f.a) }));
  return (
    <>
      <JsonLd data={faqJsonLd(siteFaqs.items)} />
      <PageHeader title={p.h1!} crumbs={[{ name: 'FAQs', path: '/faqs' }]} />
      <section className="section">
        <div className="container-site max-w-4xl">
          <Accordion items={items} />
        </div>
      </section>
    </>
  );
}
