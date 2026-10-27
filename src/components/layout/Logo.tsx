import Image from 'next/image';
import Link from 'next/link';
import { siteBrand, siteClinic, siteImages } from '@/lib/content';
import { cn } from '@/lib/cn';

/** Header/footer lockup: the clinic's tile mark + "Dent Plus" / "Dental & Family Clinic". */
export function Logo({ priority, onDark, className }: { priority?: boolean; onDark?: boolean; className?: string }) {
  const m = siteImages.logo.mark;
  return (
    <Link href="/" className={cn('inline-flex min-h-[44px] items-center gap-3', className)} aria-label={`${siteClinic.name.value}, home`}>
      <Image src={m.src} alt="" width={44} height={44} priority={priority} className="h-11 w-11 shrink-0 rounded-[10px]" />
      <span className="flex flex-col leading-none">
        <span className={cn('font-heading text-[1.4rem] font-semibold tracking-[-0.03em]', onDark ? 'text-onDark' : 'text-navy')}>{siteBrand.wordmark.primary}</span>
        <span className={cn('mt-1 text-[0.72rem] font-semibold uppercase tracking-[0.13em]', onDark ? 'text-skyOnDark' : 'text-primary')}>{siteBrand.wordmark.secondary}</span>
      </span>
    </Link>
  );
}
