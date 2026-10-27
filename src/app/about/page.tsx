import Image from 'next/image';
import { DoctorCard } from '@/components/cards';
import { PageHeader } from '@/components/layout/PageHeader';
import { Icon } from '@/components/ui/Icon';
import { SectionHead } from '@/components/ui/primitives';
import { getImage, siteAbout, siteDoctors, sitePages, sitePlan } from '@/lib/content';
import { patientBenefits } from '@/lib/plan';
import { pageMetadata } from '@/lib/seo';

const p = sitePages.about;
export const metadata = pageMetadata({ path: '/about', title: p.title, description: p.description });

export default function AboutPage() {
  const a = siteAbout;
  const story = getImage(a.story.image);
  const header = getImage(a.headerImage);
  return (
    <>
      <PageHeader
        title={p.h1!}
        intro={p.intro}
        crumbs={[{ name: 'About', path: '/about' }]}
        aside={
          <div className="relative aspect-[16/9] overflow-hidden rounded-brand border border-border">
            <Image src={header.src} alt={header.alt} fill priority sizes="(min-width: 1024px) 30vw, 100vw" className="object-cover" style={{ objectPosition: header.objectPosition }} />
          </div>
        }
      />
      <section className="section">
        <div className="container-site grid gap-12 lg:grid-cols-[1.3fr_1fr] lg:items-start lg:gap-16">
          <div>
            <h2 className="text-balance">{a.story.title}</h2>
            <div className="prose-site mt-4">
              {a.story.paragraphs.map((t) => (
                <p key={t}>{t}</p>
              ))}
            </div>
          </div>
          <div className="relative aspect-[3/4] overflow-hidden rounded-brand border border-border">
            <Image src={story.src} alt={story.alt} fill sizes="(min-width: 1024px) 35vw, 100vw" className="object-cover" style={{ objectPosition: story.objectPosition }} />
          </div>
        </div>
      </section>
      <section className="section border-y border-border bg-surfaceAlt">
        <div className="container-site">
          <SectionHead title={a.values.title} />
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {a.values.items.map((v) => (
              <li key={v.title} className="rounded-brand border border-border bg-surface p-6">
                <span className="icon-tile">
                  <Icon name={v.icon} />
                </span>
                <h3 className="mt-5">{v.title}</h3>
                <p className="mt-2 text-[0.95rem] text-textSecondary">{v.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="section">
        <div className="container-site">
          <SectionHead title={a.team.title} lead={a.team.lead} />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {siteDoctors.map((d) => (
              <DoctorCard key={d.id} d={d} />
            ))}
          </div>
        </div>
      </section>
      <section className="section border-t border-border">
        <div className="container-site grid gap-10 lg:grid-cols-2">
          <SectionHead title={a.platform.title} lead={a.platform.lead} className="!mb-0" />
          <ul className="grid gap-3">
            {patientBenefits(sitePlan).map((b) => (
              <li key={b} className="flex items-start gap-3 rounded-tile border border-border px-4 py-3">
                <Icon name="check" className="mt-1 h-4 w-4 shrink-0 text-sky" strokeWidth={2.5} /> {b}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
