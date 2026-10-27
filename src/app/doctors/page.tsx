import { DoctorCard } from '@/components/cards';
import { PageHeader } from '@/components/layout/PageHeader';
import { siteDoctors, sitePages } from '@/lib/content';
import { pageMetadata } from '@/lib/seo';

const p = sitePages.doctors;
export const metadata = pageMetadata({ path: '/doctors', title: p.title, description: p.description });

export default function DoctorsPage() {
  return (
    <>
      <PageHeader title={p.h1!} intro={p.intro} crumbs={[{ name: 'Doctors', path: '/doctors' }]} />
      <section className="section">
        <div className="container-site">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {siteDoctors.map((d) => (
              <DoctorCard key={d.id} d={d} headingLevel="h2" />
            ))}
          </div>
          <p className="mt-8 max-w-2xl text-sm text-textSecondary">Qualifications are as shown on the clinic&apos;s signboard and confirmed by the clinic. Registration numbers and the remaining photos are being added.</p>
        </div>
      </section>
    </>
  );
}
