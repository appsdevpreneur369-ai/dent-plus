import Image from 'next/image';
import { DoctorCard } from '@/components/cards';
import { PageHeader } from '@/components/layout/PageHeader';
import { getImage, siteDoctors, sitePages } from '@/lib/content';
import { pageMetadata } from '@/lib/seo';

const p = sitePages.doctors;
export const metadata = pageMetadata({ path: '/doctors', title: p.title, description: p.description });

export default function DoctorsPage() {
  const board = getImage('clinic-name-board');
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
          {/* The board outside the clinic prints the same four names and degrees: the source of the qualifications above. */}
          <figure className="mt-14 grid overflow-hidden rounded-brand border border-border bg-navy lg:grid-cols-[1.6fr_1fr]">
            <div className="relative aspect-[1600/717]">
              <Image src={board.src} alt={board.alt} fill sizes="(min-width: 1024px) 60vw, 100vw" className="object-cover" />
            </div>
            <figcaption className="flex flex-col justify-center p-6 sm:p-8">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-skyOnDark">As printed on our board</span>
              <span className="mt-3 block text-onDark">Qualifications are as shown on the clinic&apos;s signboard and confirmed by the clinic. Registration numbers and the remaining photos are being added.</span>
            </figcaption>
          </figure>
        </div>
      </section>
    </>
  );
}
