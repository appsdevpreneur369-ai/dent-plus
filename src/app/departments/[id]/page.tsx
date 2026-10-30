import Image from 'next/image';
import { notFound } from 'next/navigation';
import { BookButton } from '@/components/booking/BookButton';
import { DoctorCard, TreatmentCard } from '@/components/cards';
import { PageHeader } from '@/components/layout/PageHeader';
import { DepartmentBanner } from '@/components/sections/DepartmentBanner';
import { Icon } from '@/components/ui/Icon';
import { SectionHead } from '@/components/ui/primitives';
import { categoriesInDepartment, doctorsInDepartment, getDepartment, getImage, siteDepartments, siteRouting } from '@/lib/content';
import { pageMetadata } from '@/lib/seo';
import { fitClass, fitStyle } from '@/lib/image-fit';

export const dynamicParams = false;
export const generateStaticParams = () => siteDepartments.map((d) => ({ id: d.id }));

export function generateMetadata({ params }: { params: { id: string } }) {
  const d = getDepartment(params.id);
  if (!d) return {};
  return pageMetadata({ path: `/departments/${d.id}`, title: `${d.title} in Lakshmipuram, Guntur`, description: d.summary });
}

export default function DepartmentPage({ params }: { params: { id: string } }) {
  const d = getDepartment(params.id);
  if (!d) notFound();
  const cats = categoriesInDepartment(d.id);
  const docs = doctorsInDepartment(d.id);
  const img = getImage(d.image);
  const concerns = siteRouting.problems.filter((p) => p.department === d.id);
  return (
    <>
      <PageHeader
        title={d.title}
        intro={d.summary}
        eyebrow="Department"
        banner={<DepartmentBanner d={d} doctors={docs} />}
        crumbs={[
          { name: 'Departments', path: '/departments' },
          { name: d.title, path: `/departments/${d.id}` },
        ]}
        aside={
          <div className="overflow-hidden rounded-brand border border-border bg-surface">
            <div className="relative aspect-[16/9] bg-navy">
              <Image src={img.src} alt={img.alt} fill priority sizes="(min-width: 1024px) 34vw, 100vw" className={fitClass(img)} style={fitStyle(img)} />
              <span className="absolute bottom-3 left-3 flex h-14 w-14 items-center justify-center rounded-tile bg-sky text-navy shadow-card">
                <Icon name={d.icon} className="h-7 w-7" strokeWidth={1.7} />
              </span>
            </div>
            <div className="p-6">
              <p className="font-heading text-lg font-semibold text-navy">Book in this department</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {concerns.map((c) => (
                  <li key={c.id}>
                    <BookButton prefill={{ problem: c.id }} className="chip text-sm">
                      <Icon name={c.icon} className="h-4 w-4 text-primary" /> {c.label}
                    </BookButton>
                  </li>
                ))}
              </ul>
              <BookButton prefill={{ department: d.id }} className="btn-primary mt-5 w-full">
                Book {d.title.toLowerCase()}
              </BookButton>
            </div>
          </div>
        }
      >
        {d.caution && <p className="mt-5 max-w-2xl border-l-2 border-sky pl-4 text-sm text-textSecondary">{d.caution}</p>}
      </PageHeader>
      <section className="section">
        <div className="container-site">
          <SectionHead eyebrow="What we see" title={`${d.shortTitle}: treatments and visits`} lead="These lists are being confirmed with the clinic. Ask at the desk if you don't see what you need." />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cats.map((c) => (
              <TreatmentCard key={c.slug} slug={c.slug} title={c.title} short={c.short} icon={c.icon} status={c.status} />
            ))}
          </div>
        </div>
      </section>
      <section className="section border-t border-border bg-surfaceAlt">
        <div className="container-site">
          <SectionHead eyebrow="Your doctors" title={docs.length > 1 ? 'Doctors in this department' : 'Your doctor in this department'} />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {docs.map((x) => (
              <DoctorCard key={x.id} d={x} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
