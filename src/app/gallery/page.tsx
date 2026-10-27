import Image from 'next/image';
import { PageHeader } from '@/components/layout/PageHeader';
import { JsonLd } from '@/components/seo/JsonLd';
import { getImage, siteGallery, sitePages } from '@/lib/content';
import { galleryJsonLd } from '@/lib/jsonld';
import { pageMetadata } from '@/lib/seo';

const p = sitePages.gallery;
export const metadata = pageMetadata({ path: '/gallery', title: p.title, description: p.description });

export default function GalleryPage() {
  const g = siteGallery;
  return (
    <>
      <JsonLd data={galleryJsonLd('/gallery', g.items.map((it) => ({ ...getImage(it.image), caption: it.caption })))} />
      <PageHeader title={p.h1!} intro={g.intro} crumbs={[{ name: 'Gallery', path: '/gallery' }]} />
      {g.categories.map((cat) => (
        <section key={cat} className="section !pb-0 last:!pb-20" aria-labelledby={`g-${cat}`}>
          <div className="container-site">
            <h2 id={`g-${cat}`} className="mb-6 text-[1.8rem]">
              {cat}
            </h2>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
              {g.items
                .filter((it) => it.category === cat)
                .map((it) => {
                  const img = getImage(it.image);
                  return (
                    <li key={it.image}>
                      <figure>
                        <div className="relative aspect-[3/4] overflow-hidden rounded-brand border border-border">
                          <Image src={img.src} alt={img.alt} fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw" className="object-cover" style={{ objectPosition: img.objectPosition }} />
                        </div>
                        <figcaption className="mt-2 text-sm text-textSecondary">{it.caption}</figcaption>
                      </figure>
                    </li>
                  );
                })}
            </ul>
          </div>
        </section>
      ))}
    </>
  );
}
