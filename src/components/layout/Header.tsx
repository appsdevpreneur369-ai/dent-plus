'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { BookButton } from '../booking/BookButton';
import { Icon } from '../ui/Icon';

/**
 * Fixed 72px header. Scrolling only toggles a bottom border/shadow, never height or padding (no bounce).
 * Below xl the navigation moves into a full-screen menu (Esc closes, focus returns to the toggle).
 */
export function Header({ logo, items, callHref, callDisplay, signInHref, status }: { logo: ReactNode; items: { label: string; href: string }[]; callHref: string | null; callDisplay: string | null; signInHref: string; status: ReactNode }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  // The menu sheet starts at the header's real bottom edge: 72px once stuck, lower at the page top (info bar above).
  const [menuTop, setMenuTop] = useState(72);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => setMenu(false), [pathname]);
  useEffect(() => {
    if (!menu) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setMenu(false);
      document.getElementById('menu-toggle')?.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [menu]);

  const active = (href: string) => (href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`));

  return (
    <header ref={headerRef} className={cn('sticky top-0 z-50 h-[72px] transition-shadow', scrolled || menu ? 'shadow-[0_1px_0_rgb(var(--c-border))]' : '')}>
      {/* Blur on its own layer: backdrop-filter on <header> itself would make it the containing block of the fixed menu
          sheet below (the sheet then collapsed to 0px height inside the 72px header). */}
      <span aria-hidden="true" className="absolute inset-0 -z-10 bg-surface/95 backdrop-blur" />
      <div className="container-site flex h-[72px] items-center justify-between gap-4">
        {logo}
        <nav aria-label="Main" className="hidden h-full xl:block">
          <ul className="flex h-full items-center">
            {items.map((it) => (
              <li key={it.href}>
                <Link href={it.href} aria-current={active(it.href) ? 'page' : undefined} className="nav-link">
                  {it.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-2">
          {callHref && (
            <a href={callHref} className="hidden min-h-[44px] items-center gap-2 rounded-full px-3 font-semibold text-navy hover:text-primary lg:inline-flex">
              <Icon name="phone" className="h-4 w-4 text-sky" /> {callDisplay}
            </a>
          )}
          <BookButton className="btn-primary hidden !min-h-[44px] !px-5 sm:inline-flex">Book</BookButton>
          <button
            id="menu-toggle"
            type="button"
            onClick={() => {
              setMenuTop(Math.max(0, headerRef.current?.getBoundingClientRect().bottom ?? 72));
              setMenu((m) => !m);
            }}
            aria-expanded={menu}
            aria-controls="mobile-menu"
            aria-label={menu ? 'Close menu' : 'Open menu'}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-border text-navy xl:hidden"
          >
            <Icon name={menu ? 'x' : 'menu'} />
          </button>
        </div>
      </div>
      <nav id="mobile-menu" aria-label="Mobile" hidden={!menu} style={{ top: menuTop }} className="fixed inset-x-0 bottom-0 overflow-y-auto bg-surface xl:hidden">
        <div className="container-site py-6">
          <ul>
            {items.map((it) => (
              <li key={it.href}>
                <Link href={it.href} aria-current={active(it.href) ? 'page' : undefined} className="mobile-nav-link">
                  {it.label} <Icon name="chevron-right" className="h-5 w-5 text-sky" />
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-6">{status}</div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <BookButton className="btn-primary w-full">Book an appointment</BookButton>
            {callHref && (
              <a href={callHref} className="btn-ghost w-full">
                <Icon name="phone" className="h-4 w-4" /> Call {callDisplay}
              </a>
            )}
            <a href={signInHref} className="btn-ghost w-full">
              <Icon name="log-in" className="h-4 w-4" /> Patient sign-in
            </a>
          </div>
        </div>
      </nav>
    </header>
  );
}
