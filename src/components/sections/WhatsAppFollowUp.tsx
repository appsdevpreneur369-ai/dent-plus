import { Icon, WhatsAppIcon } from '../ui/Icon';
import { SectionHead } from '../ui/primitives';

type Step = { icon: string; when: string; title: string; text: string; action?: string; time: string };

/**
 * WhatsApp follow-up: the four stages as a numbered timeline, and the same messages in a phone on the right.
 * Always captioned as example messages (real wording = the clinic's approved templates). Server-rendered, no JS.
 * Only shown when the plan includes WhatsApp reminders (the home page checks the plan).
 */
export function WhatsAppFollowUp({ eyebrow, title, lead, phoneTitle, phoneSubtitle, note, steps }: { eyebrow: string; title: string; lead?: string; phoneTitle: string; phoneSubtitle: string; note: string; steps: Step[] }) {
  return (
    <section className="section overflow-hidden" aria-labelledby="wa-title">
      <div className="container-site grid gap-12 lg:grid-cols-[1fr_minmax(0,24rem)] lg:items-center lg:gap-20">
        <div>
          <SectionHead eyebrow={eyebrow} title={title} lead={lead} id="wa-title" className="!mb-8" />
          <ol className="space-y-3">
            {steps.map((s, i) => (
              <li key={s.title} className="flex items-center gap-4 rounded-brand border border-border bg-surface p-4 sm:p-5">
                <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-tile bg-skySoft text-primary">
                  <Icon name={s.icon} className="h-7 w-7" strokeWidth={1.7} />
                  <span aria-hidden="true" className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-navy text-xs font-semibold text-onDark">
                    {i + 1}
                  </span>
                </span>
                <span>
                  <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-primary">{s.when}</span>
                  <span className="mt-1 block font-heading text-lg font-semibold text-navy">{s.title}</span>
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-6 flex gap-2 text-sm text-textSecondary">
            <Icon name="shield-check" className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {note}
          </p>
        </div>

        {/* Phone mock-up. */}
        <figure className="relative mx-auto w-full max-w-[22rem]">
          {/* Soft glow as a radial gradient (a CSS blur filter here cost layout time on budget phones). */}
          <span aria-hidden="true" className="absolute -inset-12 -z-10 bg-[radial-gradient(closest-side,rgb(var(--c-skySoft))_55%,transparent)]" />
          <div className="rounded-[2.4rem] border-[10px] border-navy bg-navy shadow-float">
            <div className="overflow-hidden rounded-[1.7rem] bg-tint">
              <div className="flex items-center gap-3 bg-whatsapp px-4 py-3 text-onDark">
                <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-full bg-onDark font-heading text-sm font-bold text-navy">
                  D+
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold leading-tight">{phoneTitle}</span>
                  <span className="block text-xs text-onDark">{phoneSubtitle}</span>
                </span>
                <WhatsAppIcon className="ml-auto h-5 w-5" />
              </div>
              <ul className="space-y-3 px-3 py-4">
                {steps.map((s) => (
                  <li key={s.title}>
                    <p className="mb-2 text-center">
                      <span className="rounded-full bg-surface/80 px-3 py-0.5 text-[0.7rem] font-medium text-textSecondary">{s.when}</span>
                    </p>
                    <div className="relative mr-6 rounded-2xl rounded-tl-sm bg-surface px-3.5 pb-2 pt-2.5 text-[0.86rem] leading-snug text-text shadow-card">
                      {s.text}
                      {s.action && (
                        <span className="mt-2 flex items-center justify-center gap-1.5 border-t border-border pt-2 text-[0.8rem] font-semibold text-primary">
                          <Icon name="arrow-up-right" className="h-3.5 w-3.5" /> {s.action}
                        </span>
                      )}
                      <span className="mt-1 block text-right text-[0.68rem] text-textSecondary">{s.time}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <figcaption className="mt-4 text-center text-xs text-textSecondary">Example messages · names and times are illustrative</figcaption>
        </figure>
      </div>
    </section>
  );
}
