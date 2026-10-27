// Resolved links (server-side): contact channels with the placeholder rule, portal URLs, maps.
import 'server-only';
import { siteBooking, siteClinic, sitePlan, sitePortal } from './content';
import { contactChannels, fillTemplate, whatsappLink } from './contact';
import { portalUrl } from './site-redirects.mjs';

export const channels = contactChannels(siteClinic);
/** Second appointment line (approved numbers only). */
export const altCall = siteClinic.phoneAlt ? contactChannels({ ...siteClinic, phone: siteClinic.phoneAlt }).call : null;

export const generalWhatsappHref = channels.whatsapp
  ? whatsappLink(channels.whatsapp.digits, fillTemplate(siteBooking.generalWhatsappMessage, { clinic: siteClinic.shortName }))
  : null;

export type PortalKey = 'login' | 'register' | 'forgotPassword' | 'clinicPage' | 'bookingPage' | 'staffLogin';
export const portal = (key: PortalKey) => portalUrl(sitePortal, sitePlan, key);

/** Content href → real href. Returns null when the target is a placeholder (caller hides the link). */
export function resolveHref(href: string): { href: string; external: boolean } | null {
  if (href === '@call') return channels.call ? { href: channels.call.href, external: false } : null;
  if (href === '@whatsapp') return generalWhatsappHref ? { href: generalWhatsappHref, external: true } : null;
  if (href.startsWith('@portal:')) return { href: portal(href.slice(8) as PortalKey), external: true };
  if (href.startsWith('http')) return { href, external: true };
  return { href, external: false };
}

const m = siteClinic.maps;
export const mapsApproximate = !m.shareUrl;
export const directionsHref = m.shareUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(m.query)}`;
export const mapEmbedSrc = m.embedUrl || `https://www.google.com/maps?q=${encodeURIComponent(m.query)}&output=embed`;
