import { TreatmentCard } from '@/components/cards';
import { PageHeader } from '@/components/layout/PageHeader';
import { Icon } from '@/components/ui/Icon';
import { categoriesInDepartment, siteDepartments, sitePages, siteServices } from '@/lib/content';
import { pageMetadata } from '@/lib/seo';

const p = sitePages.treatments;
export const metadata = pageMetadata({ path: '/treatments', title: p.title, description: p.description });

export default function TreatmentsPage() {
  return (
    <>
      <PageHeader title={p.h1!} intro={p.intro} crumbs={[{ name: 'Treatments', path: '/treatments' }]}>
        <nav aria-label="Jump to department" className="mt-6 flex flex-wrap gap-2">
          {siteDepartments.map((d) => (
            <a key={d.id} href={`#${d.id}`} className="chip">
              <Icon name={d.icon} className="h-4 w-4 text-primary" /> {d.shortTitle}
            </a>
          ))}
        </nav>
      </PageHeader>
      {siteDepartments.map((d, i) => (
        <section key={d.id} id={d.id} className={i % 2 ? 'section border-y border-border bg-surfaceAlt' : 'section'}>
          <div className="container-site">
            <div className="mb-8 flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-navy text-onDark">
                <Icon name={d.icon} />
              </span>
              <h2 className="text-[2rem]">{d.title}</h2>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {categoriesInDepartment(d.id).map((c) => (
                <TreatmentCard key={c.slug} slug={c.slug} title={c.title} short={c.short} icon={c.icon} status={c.status} />
              ))}
            </div>
          </div>
        </section>
      ))}
      <section className="pb-16">
        <div className="container-site">
          <p className="max-w-2xl text-sm text-textSecondary">{siteServices.priceNote}</p>
        </div>
      </section>
    </>
  );
}
