import { DepartmentTile, TreatmentCard } from '@/components/cards';
import { PageHeader } from '@/components/layout/PageHeader';
import { BookButton } from '@/components/booking/BookButton';
import { Icon } from '@/components/ui/Icon';
import { categoriesInDepartment, doctorsInDepartment, siteDepartments, sitePages, siteServices } from '@/lib/content';
import { pageMetadata } from '@/lib/seo';

const p = sitePages.treatments;
const groupCount = (n: number) => `${n} treatment ${n === 1 ? 'group' : 'groups'}`;
export const metadata = pageMetadata({ path: '/treatments', title: p.title, description: p.description });

export default function TreatmentsPage() {
  return (
    <>
      <PageHeader title={p.h1!} intro={p.intro} crumbs={[{ name: 'Treatments', path: '/treatments' }]} />

      {/* Four picture cards: jump to a department further down the page. */}
      <section className="pt-10 sm:pt-14" aria-label="Jump to a department">
        <ul className="container-site grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {siteDepartments.map((d, i) => (
            <li key={d.id}>
              <DepartmentTile id={d.id} href={`#${d.id}`} title={d.title} line={groupCount(categoriesInDepartment(d.id).length)} icon={d.icon} priority={i < 2} />
            </li>
          ))}
        </ul>
      </section>

      {siteDepartments.map((d) => {
        const docs = doctorsInDepartment(d.id);
        return (
          <section key={d.id} id={d.id} className="section scroll-mt-24" aria-labelledby={`h-${d.id}`}>
            <div className="container-site grid gap-8 lg:grid-cols-[18rem_1fr] lg:gap-12">
              <div className="lg:sticky lg:top-28 lg:self-start">
                <div className="flex items-center gap-4">
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-tile bg-navy text-onDark">
                    <Icon name={d.icon} className="h-8 w-8" strokeWidth={1.6} />
                  </span>
                  <h2 id={`h-${d.id}`} className="text-[2rem] leading-tight">
                    {d.title}
                  </h2>
                </div>
                <p className="mt-4 text-textSecondary">{d.line}.</p>
                <p className="mt-4 text-sm">
                  <span className="text-textSecondary">Seen by </span>
                  <span className="font-medium text-text">{docs.map((x) => x.displayName).join(' and ')}</span>
                </p>
                <BookButton prefill={{ department: d.id }} className="btn-primary mt-6 w-full sm:w-auto lg:w-full">
                  Book {d.shortTitle.toLowerCase()}
                </BookButton>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {categoriesInDepartment(d.id).map((c) => (
                  <TreatmentCard key={c.slug} slug={c.slug} title={c.title} short={c.short} icon={c.icon} status={c.status} />
                ))}
              </div>
            </div>
          </section>
        );
      })}
      <section className="border-t border-border py-10">
        <div className="container-site">
          <p className="max-w-2xl text-sm text-textSecondary">{siteServices.priceNote}</p>
        </div>
      </section>
    </>
  );
}
