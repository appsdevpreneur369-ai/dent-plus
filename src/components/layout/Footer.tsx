import Link from 'next/link';
import { siteClinic, siteNav, siteSocial } from '@/lib/content';
import { groupDays, dayRangeShort, formatSessions } from '@/lib/hours';
import { altCall, channels, directionsHref, generalWhatsappHref, resolveHref } from '@/lib/links';
import { fullAddress } from '@/lib/vars';
import { Icon, WhatsAppIcon } from '../ui/Icon';
import { DraftBadge } from '../ui/primitives';
import { Logo } from './Logo';

export function Footer() {
  const year = new Date().getFullYear();
  const social = siteSocial.links.filter((l) => l.url);
  return (
    <footer className="on-dark bg-navy pb-28 text-onDarkMuted md:pb-0">
      <div className="container-site grid gap-12 py-16 lg:grid-cols-[1.3fr_2fr] lg:py-20">
        <div>
          <Logo onDark />
          <p className="mt-6 max-w-sm font-heading text-2xl font-medium leading-snug tracking-tight text-onDark">{siteClinic.tagline.value}</p>
          <address className="mt-6 not-italic leading-relaxed">{fullAddress}</address>
          <ul className="mt-6 space-y-2">
            {[channels.call, altCall].filter(Boolean).map((c) => (
              <li key={c!.href}>
                <a href={c!.href} className="inline-flex min-h-[44px] items-center gap-2.5 font-semibold text-onDark hover:text-skyOnDark">
                  <Icon name="phone" className="h-4 w-4 text-skyOnDark" /> {c!.display}
                </a>
              </li>
            ))}
            {generalWhatsappHref && (
              <li>
                <a href={generalWhatsappHref} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center gap-2.5 font-semibold text-onDark hover:text-skyOnDark">
                  <WhatsAppIcon className="h-4 w-4 text-skyOnDark" /> WhatsApp {channels.whatsapp?.display}
                </a>
              </li>
            )}
            <li className="flex min-h-[44px] items-center gap-2.5">
              <Icon name="mail" className="h-4 w-4 text-skyOnDark" />
              {channels.email ? (
                <a href={channels.email.href} className="font-semibold text-onDark hover:text-skyOnDark">
                  {channels.email.display}
                </a>
              ) : (
                <span>
                  Email being confirmed <DraftBadge status={siteClinic.email.status} className="ml-1" />
                </span>
              )}
            </li>
          </ul>
          <dl className="mt-6 space-y-1 text-sm">
            {groupDays(siteClinic.hours.days).map((g) => (
              <div key={g.days[0]} className="flex gap-3">
                <dt className="w-24 text-onDark">{dayRangeShort(g.days)}</dt>
                <dd>{g.sessions.length ? formatSessions(g.sessions) : 'Closed'}</dd>
              </div>
            ))}
          </dl>
          <a href={directionsHref} target="_blank" rel="noopener noreferrer" className="btn-dark-ghost mt-6 !min-h-[44px] text-sm">
            <Icon name="navigation" className="h-4 w-4" /> Get directions
          </a>
        </div>
        <div className="grid gap-10 sm:grid-cols-3">
          {siteNav.footer.map((col) => (
            <div key={col.title}>
              <h2 className="font-body text-xs font-semibold uppercase tracking-[0.16em] !text-skyOnDark">{col.title}</h2>
              <ul className="mt-4 space-y-1">
                {col.links.map((l) => {
                  const r = resolveHref(l.href);
                  if (!r) return null;
                  return (
                    <li key={l.label}>
                      {r.external ? (
                        <a href={r.href} className="inline-flex min-h-[44px] items-center hover:text-onDark">
                          {l.label}
                        </a>
                      ) : (
                        <Link href={r.href} className="inline-flex min-h-[44px] min-w-[44px] items-center hover:text-onDark">
                          {l.label}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-onDark/10">
        <div className="container-site flex flex-col gap-3 py-6 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {siteClinic.name.value}
          </p>
          <ul className="flex flex-wrap gap-x-5">
            {[
              ['Privacy', '/privacy'],
              ['Terms', '/terms'],
              ['Disclaimer', '/disclaimer'],
              ['Cookies', '/cookies'],
            ].map(([label, href]) => (
              <li key={href}>
                <Link href={href} className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center hover:text-onDark">
                  {label}
                </Link>
              </li>
            ))}
            {social.map((s) => (
              <li key={s.platform}>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center hover:text-onDark">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
