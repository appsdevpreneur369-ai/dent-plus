import Image from 'next/image';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Icon } from '@/components/ui/Icon';
import { categoriesInDepartment, doctorsInDepartment, getImage, siteDepartments, sitePages } from '@/lib/content';
import { pageMetadata } from '@/lib/seo';
import { fitClass, fitStyle } from '@/lib/image-fit';

const p = sitePages.departments;
export const metadata = pageMetadata({ path: '/departments', title: p.title, description: p.description });

export default function DepartmentsPage() {
  return (
    <>
      <PageHeader title={p.h1!} intro={p.intro} crumbs={[{ name: 'Departments', path: '/departments' }]} />
      <section className="section">
        <div className="container-site grid gap-5 md:grid-cols-2">
          {siteDepartments.map((d, i) => (
            <article key={d.id} className="group relative flex flex-col overflow-hidden rounded-brand border border-border bg-surface transition-colors hover:border-primary">
              <div className="relative aspect-[16/9] overflow-hidden bg-navy">
                <Image src={getImage(d.image).src} alt={getImage(d.image).alt} fill priority={i < 2} sizes="(min-width: 768px) 50vw, 100vw" className={`${fitClass(getImage(d.image))} transition-transform duration-700 group-hover:scale-[1.04] motion-reduce:transition-none`} style={fitStyle(getImage(d.image))} />
                <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-navy/70 to-transparent" />
                <span className="absolute bottom-4 left-4 flex h-16 w-16 items-center justify-center rounded-tile bg-sky text-navy shadow-card">
                  <Icon name={d.icon} className="h-8 w-8" strokeWidth={1.7} />
                </span>
                <span className="absolute bottom-4 right-5 font-heading text-5xl font-semibold text-onDark/70" aria-hidden="true">
                  0{i + 1}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-7 sm:p-9 sm:pt-7">
                <h2 className="text-[2rem]">
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
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
