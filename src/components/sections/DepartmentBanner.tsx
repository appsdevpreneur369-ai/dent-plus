import type { Department } from '@/lib/content/schemas';
import { Icon } from '../ui/Icon';

/**
 * Gradient tagline panel for a department page header (fills the column beside the photo + booking card).
 * Dental shows the clinic's own wall banner as a quote; departments without a banner show their one-line summary.
 * Glow and ring are gradients/borders, not CSS blur filters (those cost layout time on budget phones).
 */
export function DepartmentBanner({ d, doctors }: { d: Department; doctors: { id: string; displayName: string; initials: string }[] }) {
  const b = d.banner;
  const text = b?.text ?? `${d.line}.`;
  const accent = b?.accent && text.includes(b.accent) ? b.accent : null;
  const [before, after] = accent ? [text.slice(0, text.indexOf(accent)), text.slice(text.indexOf(accent) + accent.length)] : [text, ''];
  const Quote = b?.quote ? 'blockquote' : 'p';
  return (
    <figure className="on-dark relative isolate overflow-hidden rounded-[1.6rem] bg-navy p-7 text-onDark shadow-float sm:p-10">
      <span aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(125deg,rgb(var(--c-navy))_0%,rgb(var(--c-primaryDeep))_42%,rgb(var(--c-primary))_78%,rgb(var(--c-sky))_135%)]" />
      <span aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(28rem_18rem_at_88%_110%,rgb(var(--c-sky)/0.45),transparent_70%)]" />
      <span aria-hidden="true" className="absolute -right-20 -top-20 -z-10 h-64 w-64 rounded-full border-[34px] border-sky/20" />
      <Icon name={d.icon} className="absolute -bottom-8 right-4 -z-10 h-44 w-44 text-onDark/[0.08] sm:right-10" strokeWidth={1.1} />

      <figcaption className="inline-flex items-center gap-2 rounded-full bg-onDark/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-skyOnDark">
        <Icon name="sparkles" className="h-3.5 w-3.5" /> {b?.label ?? d.title}
      </figcaption>
      <Quote className="mt-5 max-w-[16ch] font-heading text-[2.2rem] font-semibold leading-[1.04] tracking-tight sm:text-5xl lg:text-[3.35rem]">
        {b?.quote && <span className="text-skyOnDark">“</span>}
        {before}
        {accent && <span className="bg-gradient-to-r from-skyOnDark via-onDark to-skyOnDark bg-clip-text text-transparent">{accent}</span>}
        {after}
        {b?.quote && <span className="text-skyOnDark">”</span>}
      </Quote>

      <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-onDark/15 pt-5">
        <span className="flex -space-x-2" aria-hidden="true">
          {doctors.map((x) => (
            <span key={x.id} className="flex h-10 w-10 items-center justify-center rounded-full bg-onDark font-heading text-sm font-semibold text-navy ring-2 ring-primaryDeep">
              {x.initials}
            </span>
          ))}
        </span>
        <span className="text-sm text-onDarkMuted">
          <span className="block font-semibold text-onDark">{doctors.map((x) => x.displayName).join(' · ')}</span>
          {d.title} at Dent Plus, Lakshmipuram
        </span>
      </div>
    </figure>
  );
}
