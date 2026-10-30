import Image from 'next/image';
import { BookButton } from '@/components/booking/BookButton';
import { MapFacade } from '@/components/contact/MapFacade';
import { PageHeader } from '@/components/layout/PageHeader';
import { Icon, WhatsAppIcon } from '@/components/ui/Icon';
import { OpenStatus } from '@/components/ui/OpenStatus';
import { DraftBadge } from '@/components/ui/primitives';
import { getImage, siteClinic, sitePages } from '@/lib/content';
import { dayRangeShort, formatSessions, groupDays } from '@/lib/hours';
import { altCall, channels, directionsHref, generalWhatsappHref, mapEmbedSrc, mapsApproximate } from '@/lib/links';
import { pageMetadata } from '@/lib/seo';
import { fullAddress } from '@/lib/vars';
import { fitClass, fitStyle } from '@/lib/image-fit';

const p = sitePages.contact;
export const metadata = pageMetadata({ path: '/contact', title: p.title, description: p.description });

export default function ContactPage() {
  const rows = [
    ...[channels.call, altCall].filter(Boolean).map((c) => ({ icon: 'phone', label: 'Appointments', value: <a href={c!.href} className="inline-flex min-h-[44px] items-center font-semibold text-primary hover:underline">{c!.display}</a> })),
    ...(generalWhatsappHref ? [{ icon: 'whatsapp', label: 'WhatsApp', value: <a href={generalWhatsappHref} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center font-semibold text-primary hover:underline">{channels.whatsapp?.display}</a> }] : []),
    { icon: 'mail', label: 'Email', value: channels.email ? <a href={channels.email.href} className="font-semibold text-primary hover:underline">{channels.email.display}</a> : <span className="flex items-center gap-2">Being confirmed <DraftBadge status={siteClinic.email.status} /></span> },
    { icon: 'map-pin', label: 'Address', value: <address className="not-italic">{fullAddress}</address> },
  ];
  const boards = [
    { img: getImage('clinic-name-board'), caption: 'The lit blue name board on Ashok Nagar 3rd Lane', wide: true },
    { img: getImage('clinic-signboard-telugu'), caption: 'Tooth-shaped sign at the entrance', wide: false },
    { img: getImage('clinic-reception'), caption: 'Reception, once you step inside', wide: false },
  ];
  return (
    <>
      <PageHeader title={p.h1!} intro={p.intro} crumbs={[{ name: 'Contact', path: '/contact' }]} />
      <section className="section">
        <div className="container-site grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <dl className="divide-y divide-border border-y border-border">
              {rows.map((r, i) => (
                <div key={i} className="relative py-5 pl-[3.75rem]">
                  {/* Icon inside <dt>: a <dl> row may only hold dt/dd. */}
                  <dt className="text-sm text-textSecondary">
                    <span className="icon-tile absolute left-0 top-5">{r.icon === 'whatsapp' ? <WhatsAppIcon /> : <Icon name={r.icon} />}</span>
                    {r.label}
                  </dt>
                  <dd className="mt-0.5 text-lg">{r.value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-8 rounded-brand border border-border bg-surfaceAlt p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl">Opening hours</h2>
                <OpenStatus hours={siteClinic.hours.days} timeZone={siteClinic.timezone} />
              </div>
              <dl className="mt-4 divide-y divide-border">
                {groupDays(siteClinic.hours.days).map((g) => (
                  <div key={g.days[0]} className="flex justify-between gap-4 py-3">
                    <dt className="font-medium">{dayRangeShort(g.days)}</dt>
                    <dd className="text-textSecondary">{g.sessions.length ? formatSessions(g.sessions) : 'Closed'}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <BookButton className="btn-primary">Book an appointment</BookButton>
              <a href={directionsHref} target="_blank" rel="noopener noreferrer" className="btn-ghost">
                <Icon name="navigation" className="h-4 w-4" /> Directions
              </a>
            </div>
          </div>
          <div>
            <MapFacade src={mapEmbedSrc} title={`Map: ${siteClinic.name.value}`} label="Show map" note={mapsApproximate ? 'Loads Google Maps · pin is approximate' : undefined} />
            <h2 className="mt-10 text-[1.7rem]">What to look for</h2>
            <ul className="mt-4 grid grid-cols-2 gap-3">
              {boards.map((b) => (
                <li key={b.caption} className={b.wide ? 'col-span-2' : undefined}>
                  <figure>
                    <div className={`relative overflow-hidden rounded-brand border border-border ${b.wide ? 'aspect-[1600/717]' : 'aspect-[4/5]'}`}>
                      <Image src={b.img.src} alt={b.img.alt} fill sizes={b.wide ? '(min-width: 1024px) 40vw, 100vw' : '(min-width: 1024px) 20vw, 50vw'} className={fitClass(b.img)} style={fitStyle(b.img)} />
                    </div>
                    <figcaption className="mt-2 text-sm text-textSecondary">{b.caption}</figcaption>
                  </figure>
                </li>
              ))}
            </ul>
            <h2 className="mt-10 text-[1.7rem]">Finding us</h2>
            <ul className="mt-4 space-y-3">
              {siteClinic.maps.wayfinding.map((w) => (
                <li key={w.text} className="flex gap-3">
                  <span className="icon-tile !h-9 !w-9">
                    <Icon name={w.icon} className="h-4 w-4" />
                  </span>
                  <span className="pt-1.5">{w.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
