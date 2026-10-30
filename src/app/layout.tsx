import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { BookingProvider } from '@/components/booking/BookingProvider';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { InfoBar } from '@/components/layout/InfoBar';
import { Logo } from '@/components/layout/Logo';
import { MobileActionBar } from '@/components/layout/MobileActionBar';
import { JsonLd } from '@/components/seo/JsonLd';
import { OpenStatus } from '@/components/ui/OpenStatus';
import { bookingClientConfig } from '@/lib/booking/clientConfig';
import { siteBrand, siteClinic, siteNav, sitePages } from '@/lib/content';
import { clinicJsonLd } from '@/lib/jsonld';
import { channels, directionsHref, portal } from '@/lib/links';
import { NOINDEX, SITE_URL } from '@/lib/site';
import { fontClassNames, themeCss } from '@/lib/theme';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { absolute: sitePages.home.title },
  description: sitePages.home.description,
  applicationName: siteClinic.name.value,
  robots: NOINDEX ? { index: false, follow: false } : { index: true, follow: true },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  themeColor: siteBrand.colors.background,
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const booking = bookingClientConfig();
  return (
    <html lang="en-IN" className={fontClassNames}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeCss }} />
      </head>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-full focus:bg-surface focus:px-5 focus:py-3 focus:font-semibold focus:text-navy focus:shadow-float">
          Skip to content
        </a>
        <JsonLd data={clinicJsonLd()} />
        <BookingProvider config={booking}>
          <InfoBar />
          <Header
            logo={<Logo priority />}
            items={siteNav.header}
            signInHref={portal('login')}
            callHref={channels.call?.href ?? null}
            callDisplay={channels.call?.display ?? null}
            status={<OpenStatus hours={siteClinic.hours.days} timeZone={siteClinic.timezone} />}
          />
          <main id="main" tabIndex={-1} className="outline-none">
            {children}
          </main>
          <Footer />
          <MobileActionBar callHref={channels.call?.href ?? null} directionsHref={directionsHref} />
        </BookingProvider>
      </body>
    </html>
  );
}
