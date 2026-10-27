import Image from 'next/image';
import Link from 'next/link';
import { ArticleCard, DoctorCard } from '@/components/cards';
import { MapFacade } from '@/components/contact/MapFacade';
import { BookButton } from '@/components/booking/BookButton';
import { DepartmentSwitcher, type SwitcherDepartment } from '@/components/sections/DepartmentSwitcher';
import { QuickBook } from '@/components/sections/QuickBook';
import { JsonLd } from '@/components/seo/JsonLd';
import { Icon, WhatsAppIcon } from '@/components/ui/Icon';
import { OpenStatus } from '@/components/ui/OpenStatus';
import { Accordion, SectionHead, TextLink } from '@/components/ui/primitives';
import {
  articles, categoriesInDepartment, doctorsInDepartment, getImage, siteClinic, siteDepartments, siteDoctors, siteFaqs, siteHome, sitePages, siteRouting,
} from '@/lib/content';
import { dayRangeShort, formatSessions, groupDays } from '@/lib/hours';
import { faqJsonLd } from '@/lib/jsonld';
import { altCall, channels, directionsHref, generalWhatsappHref, mapEmbedSrc, mapsApproximate } from '@/lib/links';
import { pageMetadata } from '@/lib/seo';
import { fill, fullAddress } from '@/lib/vars';

const p = sitePages.home;
export const metadata = pageMetadata({ path: '/', title: p.title, description: p.description, absoluteTitle: p.absoluteTitle });

export default function HomePage() {
  const h = siteHome;
  const hero = getImage(h.hero.image);
  const switcher: SwitcherDepartment[] = siteDepartments.map((d) => ({
    id: d.id,
    title: d.title,
    shortTitle: d.shortTitle,
    icon: d.icon,
    line: d.line,
    summary: d.summary,
    caution: d.caution,
    services: categoriesInDepartment(d.id).map((c) => ({ slug: c.slug, title: c.title, short: c.short })),
    concerns: siteRouting.problems.filter((x) => x.department === d.id).map((x) => ({ id: x.id, label: x.label, icon: x.icon })),
    doctors: doctorsInDepartment(d.id).map((x) => ({ slug: x.slug, displayName: x.displayName, initials: x.initials, specialty: x.specialty, photo: x.photo ? getImage(x.photo).src : null })),
  }));
  const faqs = siteFaqs.items.filter((f) => f.home);
  const tiles = h.gallery.tiles;

  return (
    <>
      <JsonLd data={faqJsonLd(faqs)} />

      {/* Split hero: editorial headline left, the clinic's own photo + quick booking card right. */}
      <section className="relative overflow-hidden">
        <div className="grid-wash pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="container-site relative grid gap-12 pb-16 pt-10 sm:pt-14 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-16 lg:pb-24 lg:pt-16">
          <div>
            <p className="eyebrow">{h.hero.eyebrow}</p>
            <h1 className="mt-6 text-balance">
              {h.hero.title} <span className="text-primary">{h.hero.titleAccent}</span>
            </h1>
            <p className="lead mt-6 max-w-xl">{h.hero.lead}</p>
            <ul className="mt-7 grid gap-3 sm:grid-cols-3 sm:gap-4">
              {h.hero.points.map((pt) => (
                <li key={pt} className="flex items-start gap-2.5 border-t border-border pt-3 text-[0.95rem] font-medium text-text">
                  <span aria-hidden="true" className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky text-xs font-bold text-onDark">
                    +
                  </span>
                  {pt}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <OpenStatus hours={siteClinic.hours.days} timeZone={siteClinic.timezone} />
              {[channels.call, altCall].filter(Boolean).map((c) => (
                <a key={c!.href} href={c!.href} className="inline-flex min-h-[44px] items-center gap-2 font-semibold text-navy hover:text-primary">
                  <Icon name="phone" className="h-4 w-4 text-sky" /> {c!.display}
                </a>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="relative aspect-[4/3] overflow-hidden rounded-brand border border-border lg:aspect-[4/5]">
              <Image src={hero.src} alt={hero.alt} fill priority sizes="(min-width: 1024px) 42vw, 100vw" className="object-cover" style={{ objectPosition: hero.objectPosition }} />
              <span className="absolute right-3 top-3 rounded-full bg-surface/90 px-3 py-1 text-xs font-medium text-navy backdrop-blur">{h.hero.imageCaption}</span>
            </div>
            <div className="relative -mt-14 px-3 sm:px-8 lg:absolute lg:-bottom-8 lg:-left-16 lg:mt-0 lg:w-[22rem] lg:px-0">
              <QuickBook {...h.hero.quickBook} callHref={channels.call?.href ?? null} callDisplay={channels.call?.display ?? null} />
            </div>
          </div>
        </div>
      </section>

      {/* Department switcher on the navy band. */}
      <section className="on-dark section bg-navy" aria-labelledby="dept-title">
        <div className="container-site">
          <div className="mb-10 max-w-2xl">
            <p className="eyebrow">{h.departments.eyebrow}</p>
            <h2 id="dept-title" className="mt-5 text-balance !text-onDark">
              {h.departments.title}
            </h2>
            {h.departments.lead && <p className="mt-4 text-lg text-onDarkMuted">{h.departments.lead}</p>}
          </div>
          <DepartmentSwitcher departments={switcher} labels={{ services: h.departments.servicesLabel, doctors: h.departments.doctorsLabel, more: h.departments.moreLabel }} />
        </div>
      </section>

      {/* Doctor strip. */}
      <section className="section">
        <div className="container-site">
          <SectionHead eyebrow={h.doctors.eyebrow} title={h.doctors.title} lead={h.doctors.lead} action={<TextLink href="/doctors">All doctors</TextLink>} />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {siteDoctors.map((d) => (
              <DoctorCard key={d.id} d={d} />
            ))}
          </div>
        </div>
      </section>

      {/* Your visit, step by step. */}
      <section className="section border-y border-border bg-surfaceAlt">
        <div className="container-site">
          <SectionHead eyebrow={h.visit.eyebrow} title={h.visit.title} lead={h.visit.lead} />
          <ol className="relative grid gap-0 lg:grid-cols-5 lg:gap-6">
            <span aria-hidden="true" className="absolute left-[1.35rem] top-2 h-[calc(100%-1rem)] w-px bg-border lg:left-0 lg:top-[1.35rem] lg:h-px lg:w-full" />
            {h.visit.steps.map((s, i) => (
              <li key={s.title} className="relative grid grid-cols-[2.7rem_1fr] gap-4 pb-8 lg:block lg:pb-0">
                <span className="relative z-10 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface font-heading text-lg font-semibold text-navy">
                  {i + 1}
                </span>
                <div className="lg:mt-6">
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                    <Icon name={s.icon} className="h-4 w-4" /> {s.who}
                  </p>
                  <h3 className="mt-2">{s.title}</h3>
                  <p className="mt-2 text-[0.95rem] text-textSecondary">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-8 text-sm text-textSecondary">{h.visit.note}</p>
        </div>
      </section>

      {/* How we work. */}
      <section className="section">
        <div className="container-site grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <SectionHead eyebrow={h.promise.eyebrow} title={h.promise.title} className="!mb-0 lg:!items-start" />
          <ul className="grid gap-px overflow-hidden rounded-brand border border-border bg-border sm:grid-cols-3">
            {h.promise.items.map((it) => (
              <li key={it.title} className="bg-surface p-6">
                <span className="icon-tile">
                  <Icon name={it.icon} />
                </span>
                <h3 className="mt-5">{it.title}</h3>
                <p className="mt-2 text-[0.95rem] text-textSecondary">{it.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Bento gallery of the clinic's own photos. */}
      <section className="section pt-0">
        <div className="container-site">
          <SectionHead eyebrow={h.gallery.eyebrow} title={h.gallery.title} lead={h.gallery.lead} action={<TextLink href="/gallery">Full gallery</TextLink>} />
          <ul className="grid auto-rows-[9.5rem] grid-cols-2 gap-3 sm:auto-rows-[12rem] lg:grid-cols-4 lg:gap-4">
            {tiles.map((t, i) => {
              const img = getImage(t.image);
              const span = i === 0 ? 'col-span-2 row-span-2' : i === 1 || i >= 4 ? 'col-span-2' : '';
              return (
                <li key={t.image} className={`group relative overflow-hidden rounded-brand border border-border ${span}`}>
                  <Image src={img.src} alt={img.alt} fill sizes={i === 0 ? '(min-width: 1024px) 50vw, 100vw' : '(min-width: 1024px) 25vw, 50vw'} className="object-cover transition-transform duration-500 group-hover:scale-[1.04]" style={{ objectPosition: img.objectPosition }} />
                  <span className="absolute bottom-2 left-2 rounded-full bg-surface/90 px-3 py-1 text-xs font-medium text-navy backdrop-blur">{t.caption}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Hours + map with a live open/closed badge. */}
      <section className="section border-t border-border bg-surfaceAlt" aria-labelledby="visit-title">
        <div className="container-site grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="eyebrow">{h.location.eyebrow}</p>
            <h2 id="visit-title" className="mt-5 text-balance">
              {h.location.title}
            </h2>
            <p className="lead mt-4">{h.location.lead}</p>
            <address className="mt-6 not-italic text-text">{fullAddress}</address>
            <div className="mt-8 rounded-brand border border-border bg-surface p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3>Opening hours</h3>
                <OpenStatus hours={siteClinic.hours.days} timeZone={siteClinic.timezone} />
              </div>
              <dl className="mt-4 divide-y divide-border">
                {groupDays(siteClinic.hours.days).map((g) => (
                  <div key={g.days[0]} className="flex justify-between gap-4 py-3">
                    <dt className="font-medium text-text">{dayRangeShort(g.days)}</dt>
                    <dd className="text-textSecondary">{g.sessions.length ? formatSessions(g.sessions) : 'Closed'}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={directionsHref} target="_blank" rel="noopener noreferrer" className="btn-navy">
                <Icon name="navigation" className="h-4 w-4" /> Directions
              </a>
              {channels.call && (
                <a href={channels.call.href} className="btn-ghost">
                  <Icon name="phone" className="h-4 w-4" /> Call
                </a>
              )}
              {generalWhatsappHref && (
                <a href={generalWhatsappHref} target="_blank" rel="noopener noreferrer" className="btn-ghost">
                  <WhatsAppIcon className="h-4 w-4 text-whatsapp" /> WhatsApp
                </a>
              )}
            </div>
          </div>
          <div className="space-y-4">
            <div className="relative aspect-[16/7] overflow-hidden rounded-brand border border-border">
              <Image src={getImage(h.location.image).src} alt={getImage(h.location.image).alt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" style={{ objectPosition: getImage(h.location.image).objectPosition }} />
            </div>
            <MapFacade src={mapEmbedSrc} title={`Map: ${siteClinic.name.value}`} label="Show map" note={mapsApproximate ? 'Loads Google Maps · pin is approximate' : undefined} />
          </div>
        </div>
      </section>

      {/* Patient guides. */}
      <section className="section">
        <div className="container-site">
          <SectionHead eyebrow={h.education.eyebrow} title={h.education.title} lead={h.education.lead} action={<TextLink href="/patient-education">All guides</TextLink>} />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {articles.map((a) => (
              <ArticleCard key={a.meta.slug} a={a.meta} />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ. */}
      <section className="section border-t border-border">
        <div className="container-site grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <SectionHead eyebrow={h.faq.eyebrow} title={h.faq.title} className="!mb-6" />
            <TextLink href="/faqs">More questions</TextLink>
          </div>
          <Accordion name="home-faq" items={faqs.map((f) => ({ q: fill(f.q), a: fill(f.a) }))} />
        </div>
      </section>

      {/* Closing call to action. */}
      <section className="on-dark relative overflow-hidden bg-primary">
        <span aria-hidden="true" className="absolute -right-24 -top-24 h-80 w-80 rounded-full border-[40px] border-sky/40" />
        <div className="container-site relative flex flex-col gap-8 py-16 lg:flex-row lg:items-center lg:justify-between lg:py-20">
          <div className="max-w-2xl">
            <h2 className="!text-onDark">{h.cta.title}</h2>
            <p className="mt-4 text-lg text-onDark/85">{h.cta.lead}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <BookButton className="btn-light">{h.cta.button}</BookButton>
            <Link href="/departments" className="btn-dark-ghost">
              Explore departments
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
