import { PageHeader } from '@/components/layout/PageHeader';
import { PhotoViewer } from '@/components/sections/PhotoViewer';
import { JsonLd } from '@/components/seo/JsonLd';
import { BookButton } from '@/components/booking/BookButton';
import { getImage, siteGallery, sitePages } from '@/lib/content';
import { galleryJsonLd } from '@/lib/jsonld';
import { pageMetadata } from '@/lib/seo';

const p = sitePages.gallery;
export const metadata = pageMetadata({ path: '/gallery', title: p.title, description: p.description });

export default function GalleryPage() {
  const g = siteGallery;
  const photos = g.items.map((it) => ({ id: it.image, ...getImage(it.image), caption: it.caption, category: it.category }));
  return (
    <>
      <JsonLd data={galleryJsonLd('/gallery', photos)} />
      <PageHeader title={p.h1!} intro={g.intro} crumbs={[{ name: 'Gallery', path: '/gallery' }]} />
      <section className="section">
        <div className="container-site">
          <PhotoViewer photos={photos} layout="grid" categories={g.categories} />
          <div className="mt-14 flex flex-col items-start justify-between gap-5 rounded-brand border border-border bg-surfaceAlt p-6 sm:flex-row sm:items-center sm:p-8">
            <p className="max-w-xl font-heading text-xl font-semibold text-navy">Seeing the rooms is one thing. Come and meet the doctors.</p>
            <BookButton className="btn-primary">Book a visit</BookButton>
          </div>
        </div>
      </section>
    </>
  );
}
