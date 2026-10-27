'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useRef, useState, type KeyboardEvent } from 'react';
import { cn } from '@/lib/cn';
import { useBooking } from '../booking/BookingProvider';
import { Icon } from '../ui/Icon';

export type SwitcherDepartment = {
  id: string;
  title: string;
  shortTitle: string;
  icon: string;
  line: string;
  summary: string;
  caution?: string;
  services: { slug: string; title: string; short: string }[];
  concerns: { id: string; label: string; icon: string }[];
  doctors: { slug: string; displayName: string; initials: string; specialty: string; photo: string | null }[];
};

/**
 * Department switcher (WAI-ARIA tabs: arrow keys / Home / End move between tabs). Filters doctors, services and
 * concern chips in place; every panel is in the HTML, so the content is crawlable and works before hydration.
 */
export function DepartmentSwitcher({ departments, labels }: { departments: SwitcherDepartment[]; labels: { services: string; doctors: string; more: string } }) {
  const [active, setActive] = useState(departments[0].id);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const { open } = useBooking();

  const onKey = (e: KeyboardEvent, i: number) => {
    const n = departments.length;
    const to = e.key === 'ArrowRight' ? (i + 1) % n : e.key === 'ArrowLeft' ? (i - 1 + n) % n : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : -1;
    if (to < 0) return;
    e.preventDefault();
    setActive(departments[to].id);
    tabs.current[to]?.focus();
  };

  return (
    <div>
      <div role="tablist" aria-label="Departments" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {departments.map((d, i) => {
          const selected = d.id === active;
          return (
            <button
              key={d.id}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              role="tab"
              id={`tab-${d.id}`}
              aria-selected={selected}
              aria-controls={`panel-${d.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(d.id)}
              onKeyDown={(e) => onKey(e, i)}
              className={cn(
                'flex min-h-[52px] shrink-0 items-center gap-2.5 rounded-full border px-5 font-semibold transition-colors',
                selected ? 'border-sky bg-sky text-navy' : 'border-onDark/20 text-onDark hover:border-onDark/60',
              )}
            >
              <Icon name={d.icon} className="h-5 w-5" />
              {d.shortTitle}
            </button>
          );
        })}
      </div>

      {departments.map((d) => (
        <div key={d.id} role="tabpanel" id={`panel-${d.id}`} aria-labelledby={`tab-${d.id}`} hidden={d.id !== active} className={cn('mt-10 gap-10 lg:grid-cols-[1.1fr_1fr_0.9fr] motion-safe:animate-rise', d.id === active ? 'grid' : 'hidden')}>
          <div>
            <h3 className="text-[2rem] !text-onDark">{d.title}</h3>
            <p className="mt-4 leading-relaxed text-onDarkMuted">{d.summary}</p>
            {d.caution && <p className="mt-4 border-l-2 border-sky pl-4 text-sm text-onDarkMuted">{d.caution}</p>}
            <div className="mt-6 flex flex-wrap gap-2">
              {d.concerns.map((c) => (
                <button key={c.id} type="button" onClick={() => open({ problem: c.id })} aria-haspopup="dialog" className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-onDark/20 bg-navySoft px-4 text-sm font-medium text-onDark hover:border-sky">
                  <Icon name={c.icon} className="h-4 w-4 text-skyOnDark" /> {c.label}
                </button>
              ))}
            </div>
            <Link href={`/departments/${d.id}`} className="mt-6 inline-flex min-h-[44px] items-center gap-1.5 font-semibold text-skyOnDark hover:text-onDark">
              {labels.more} {d.title.toLowerCase()} <Icon name="arrow-right" className="h-4 w-4" />
            </Link>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-skyOnDark">{labels.services}</p>
            <ul className="mt-4 divide-y divide-onDark/10 border-y border-onDark/10">
              {d.services.map((s) => (
                <li key={s.slug}>
                  <Link href={`/treatments/${s.slug}`} className="group flex min-h-[64px] items-start justify-between gap-4 py-4">
                    <span>
                      <span className="block font-heading text-lg font-medium text-onDark group-hover:text-skyOnDark">{s.title}</span>
                      <span className="mt-0.5 block text-sm text-onDarkMuted">{s.short}</span>
                    </span>
                    <Icon name="arrow-up-right" className="mt-1 h-5 w-5 shrink-0 text-skyOnDark" />
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-onDarkMuted">Treatment lists are being confirmed with the clinic.</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-skyOnDark">{labels.doctors}</p>
            <ul className="mt-4 space-y-3">
              {d.doctors.map((doc) => (
                <li key={doc.slug}>
                  <Link href={`/doctors/${doc.slug}`} className="flex min-h-[72px] items-center gap-4 rounded-brand border border-onDark/10 bg-navySoft p-3 hover:border-sky">
                    {doc.photo ? (
                      <Image src={doc.photo} alt="" width={56} height={56} className="h-14 w-14 shrink-0 rounded-full object-cover" />
                    ) : (
                      <span aria-hidden="true" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary font-heading font-semibold text-onDark">
                        {doc.initials}
                      </span>
                    )}
                    <span>
                      <span className="block font-semibold text-onDark">{doc.displayName}</span>
                      <span className="text-sm text-onDarkMuted">{doc.specialty}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <button type="button" onClick={() => open({ department: d.id })} aria-haspopup="dialog" className="btn-light mt-5 w-full">
              Book {d.title.toLowerCase()}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
