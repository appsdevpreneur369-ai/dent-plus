import 'server-only';
import { articles, categories, getImage, siteDepartments, siteDoctors, siteGallery, siteHome } from './content';

export type Entry = { path: string; priority: number; changefreq: 'weekly' | 'monthly' | 'yearly'; images?: { src: string; caption: string }[] };

export function sitemapEntries(): Entry[] {
  const img = (id: string) => ({ src: getImage(id).src, caption: getImage(id).alt });
  return [
    { path: '/', priority: 1, changefreq: 'weekly', images: [img(siteHome.hero.image), img('og')] },
    { path: '/departments', priority: 0.9, changefreq: 'monthly' },
    ...siteDepartments.map((d) => ({ path: `/departments/${d.id}`, priority: 0.9, changefreq: 'monthly' as const })),
    { path: '/treatments', priority: 0.8, changefreq: 'monthly' },
    ...categories.map((c) => ({ path: `/treatments/${c.slug}`, priority: 0.8, changefreq: 'monthly' as const })),
    { path: '/doctors', priority: 0.8, changefreq: 'monthly' },
    ...siteDoctors.map((d) => ({ path: `/doctors/${d.slug}`, priority: 0.7, changefreq: 'monthly' as const, images: [d.photo, d.photoSecondary].filter((x): x is string => !!x).map(img) })),
    { path: '/book', priority: 0.8, changefreq: 'monthly' },
    { path: '/contact', priority: 0.8, changefreq: 'monthly' },
    { path: '/about', priority: 0.6, changefreq: 'monthly' },
    { path: '/gallery', priority: 0.5, changefreq: 'monthly', images: siteGallery.items.map((g) => ({ src: getImage(g.image).src, caption: g.caption })) },
    { path: '/patient-education', priority: 0.6, changefreq: 'monthly' },
    ...articles.map((a) => ({ path: `/patient-education/${a.meta.slug}`, priority: 0.6, changefreq: 'monthly' as const, images: [img(a.meta.image)] })),
    { path: '/faqs', priority: 0.5, changefreq: 'monthly' },
    { path: '/emergency', priority: 0.5, changefreq: 'yearly' },
    { path: '/privacy', priority: 0.2, changefreq: 'yearly' },
    { path: '/terms', priority: 0.2, changefreq: 'yearly' },
    { path: '/disclaimer', priority: 0.2, changefreq: 'yearly' },
    { path: '/cookies', priority: 0.2, changefreq: 'yearly' },
  ];
}

