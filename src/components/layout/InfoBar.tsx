import { siteClinic } from '@/lib/content';
import { altCall, channels, directionsHref, generalWhatsappHref } from '@/lib/links';
import { Icon, WhatsAppIcon } from '../ui/Icon';
import { OpenStatus } from '../ui/OpenStatus';

const a = siteClinic.address;
/** One-line address for the bar: door number, lane, landmark, area and PIN (the full form is in the footer and on Contact). */
const barAddress = [a.doorNumber, a.street, a.landmark, `${a.locality} ${a.postalCode}`].filter(Boolean).join(', ');

/**
 * Navy strip above the sticky header, on every page: live open/closed status, the address (links to directions),
 * the appointment numbers and WhatsApp, all on one line. Scrolls away; the header stays. On phones it keeps
 * status, call and WhatsApp as 44px icons (numbers spelled out from 640px); the address joins from 768px, the second
 * number from 1280px.
 */
export function InfoBar() {
  return (
    <div className="on-dark bg-navy text-sm text-onDark">
      <div className="container-site flex h-11 items-center gap-x-5">
        <OpenStatus hours={siteClinic.hours.days} timeZone={siteClinic.timezone} variant="onDark" className="shrink-0 whitespace-nowrap" />
        <a href={directionsHref} target="_blank" rel="noopener noreferrer" title={barAddress} className="hidden min-w-0 flex-1 items-center gap-1.5 text-onDarkMuted hover:text-onDark md:flex">
          <Icon name="map-pin" className="h-4 w-4 shrink-0 text-skyOnDark" />
          <span className="truncate">{barAddress}</span>
        </a>
        <div className="ml-auto flex shrink-0 items-center gap-x-1 sm:gap-x-4">
          {[channels.call, altCall].filter(Boolean).map((c, i) => (
            <a key={c!.href} href={c!.href} aria-label={`Call ${c!.display}`} className={`${i ? 'hidden xl:inline-flex' : 'inline-flex'} h-11 min-w-[44px] items-center justify-center gap-1.5 whitespace-nowrap font-semibold hover:text-skyOnDark`}>
              <Icon name="phone" className="h-4 w-4 text-skyOnDark" />
              <span className="hidden sm:inline">{c!.display}</span>
            </a>
          ))}
          {generalWhatsappHref && (
            <a href={generalWhatsappHref} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp us" className="inline-flex h-11 min-w-[44px] items-center justify-center gap-1.5 whitespace-nowrap font-semibold hover:text-skyOnDark">
              <WhatsAppIcon className="h-4 w-4 text-skyOnDark" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
