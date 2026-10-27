import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { siteDepartments, sitePages } from '@/lib/content';

export const metadata = { title: { absolute: sitePages.notFound.title } };

export default function NotFound() {
  const n = sitePages.notFound;
  return (
    <section className="section">
      <div className="container-site max-w-3xl">
        <p className="eyebrow">404</p>
        <h1 className="mt-5">{n.h1}</h1>
        <p className="lead mt-4">{n.intro}</p>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {[{ href: '/', label: 'Home', icon: 'arrow-right' }, { href: '/book', label: 'Book an appointment', icon: 'calendar-check' }, ...siteDepartments.map((d) => ({ href: `/departments/${d.id}`, label: d.title, icon: d.icon }))].map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="flex min-h-[56px] items-center gap-3 rounded-brand border border-border px-4 font-semibold hover:border-primary">
                <Icon name={l.icon} className="h-5 w-5 text-primary" /> {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
