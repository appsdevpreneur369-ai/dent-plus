import { ArticleCard } from '@/components/cards';
import { PageHeader } from '@/components/layout/PageHeader';
import { articles, sitePages } from '@/lib/content';
import { pageMetadata } from '@/lib/seo';

const p = sitePages.education;
export const metadata = pageMetadata({ path: '/patient-education', title: p.title, description: p.description });

export default function EducationPage() {
  return (
    <>
      <PageHeader title={p.h1!} intro={p.intro} crumbs={[{ name: 'Patient guides', path: '/patient-education' }]} />
      <section className="section">
        <div className="container-site grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {articles.map((a) => (
            <ArticleCard key={a.meta.slug} a={a.meta} />
          ))}
        </div>
      </section>
    </>
  );
}
