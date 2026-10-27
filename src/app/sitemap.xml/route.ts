import { sitemapEntries } from '@/lib/sitemap';
import { absoluteUrl } from '@/lib/site';

// Sitemap with image entries (Next's built-in sitemap() cannot emit <image:image>).
export const dynamic = 'force-static';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function GET() {
  const lastmod = new Date().toISOString().slice(0, 10);
  const body = sitemapEntries()
    .map(
      (e) =>
        `<url><loc>${absoluteUrl(e.path)}</loc><lastmod>${lastmod}</lastmod><changefreq>${e.changefreq}</changefreq><priority>${e.priority.toFixed(1)}</priority>${(e.images ?? [])
          .map((i) => `<image:image><image:loc>${absoluteUrl(i.src)}</image:loc><image:caption>${esc(i.caption)}</image:caption></image:image>`)
          .join('')}</url>`,
    )
    .join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${body}</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
