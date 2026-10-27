import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Icon } from '@/components/ui/Icon';
import { categoriesInDepartment, doctorsInDepartment, siteDepartments, sitePages } from '@/lib/content';
import { pageMetadata } from '@/lib/seo';

const p = sitePages.departments;
export const metadata = pageMetadata({ path: '/departments', title: p.title, description: p.description });

export default function DepartmentsPage() {
  return (
    <>
      <PageHeader title={p.h1!} intro={p.intro} crumbs={[{ name: 'Departments', path: '/departments' }]} />
      <section className="section">
        <div className="container-site grid gap-5 md:grid-cols-2">
          {siteDepartments.map((d, i) => (
            <article key={d.id} className="group relative flex flex-col rounded-brand border border-border bg-surface p-7 transition-colors hover:border-primary sm:p-9">
              <div className="flex items-start justify-between gap-4">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-navy text-onDark group-hover:bg-sky">
                  <Icon name={d.icon} className="h-6 w-6" />
                </span>
                <span className="font-heading text-5xl font-semibold text-border" aria-hidden="true">
                  0{i + 1}
                </span>
              </div>
              <h2 className="mt-6 text-[2rem]">
                <Link href={`/departments/${d.id}`} className="after:absolute after:inset-0">
                  {d.title}
                </Link>
              </h2>
              <p className="mt-3 text-textSecondary">{d.summary}</p>
              <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-5 text-sm">
                <div>
                  <dt className="text-textSecondary">Doctors</dt>
                  <dd className="mt-1 font-medium text-text">{doctorsInDepartment(d.id).map((x) => x.displayName).join(', ')}</dd>
                </div>
                <div>
                  <dt className="text-textSecondary">Treatment groups</dt>
                  <dd className="mt-1 font-medium text-text">{categoriesInDepartment(d.id).length}</dd>
                </div>
              </dl>
              <span className="mt-6 inline-flex items-center gap-1.5 font-semibold text-primary">
                Open department <Icon name="arrow-right" className="h-4 w-4" />
              </span>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
