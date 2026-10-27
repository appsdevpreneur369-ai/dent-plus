import 'server-only';
import type { Metadata } from 'next';
import { getImage, siteClinic } from './content';
import { absoluteUrl } from './site';

const TITLE_MAX = 60;
export const titleSuffix = ` | ${siteClinic.shortName}, ${siteClinic.address.locality}`;

const clip = (s: string, max: number) => (s.length <= max ? s : `${s.slice(0, max - 1).replace(/\s+\S*$/, '')}…`);

/** "<Page> | Dent Plus, Lakshmipuram, Guntur" when it fits in 60 characters, else a shorter form. */
export function fitTitle(title: string): string {
  if (title.length + titleSuffix.length <= TITLE_MAX) return `${title}${titleSuffix}`;
  const short = `${title} | ${siteClinic.shortName}`;
  if (short.length <= TITLE_MAX) return short;
  return clip(title, TITLE_MAX);
}

export function pageMetadata({
  path,
  title,
  description,
  absoluteTitle,
  image,
  type = 'website',
}: {
  path: string;
  title: string;
  description: string;
  absoluteTitle?: boolean;
  image?: string;
  type?: 'website' | 'article';
}): Metadata {
  const full = absoluteTitle ? title : fitTitle(title);
  const og = getImage('og');
  const img = image ?? og.src;
  const siteName = siteClinic.name.value;
  return {
    title: { absolute: full },
    description: clip(description, 160),
    alternates: { canonical: absoluteUrl(path) },
    openGraph: {
      type,
      url: absoluteUrl(path),
      siteName,
      title: full,
      description: clip(description, 160),
      locale: 'en_IN',
      images: [{ url: absoluteUrl(img), width: og.width, height: og.height, alt: og.alt }],
    },
    twitter: { card: 'summary_large_image', title: full, description: clip(description, 160), images: [absoluteUrl(img)] },
  };
}
