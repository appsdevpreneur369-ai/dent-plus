import { PageHeader } from '@/components/layout/PageHeader';
import { Icon } from '@/components/ui/Icon';
import { OpenStatus } from '@/components/ui/OpenStatus';
import { getDepartment, siteClinic, siteEmergency, sitePages } from '@/lib/content';
import { channels } from '@/lib/links';
import { pageMetadata } from '@/lib/seo';

const p = sitePages.emergency;
export const metadata = pageMetadata({ path: '/emergency', title: p.title, description: p.description });

export default function EmergencyPage() {
  const e = siteEmergency;
  return (
    <>
      <PageHeader title={p.h1!} intro={e.lead} crumbs={[{ name: 'Urgent problems', path: '/emergency' }]}>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <OpenStatus hours={siteClinic.hours.days} timeZone={siteClinic.timezone} />
          {channels.call && (
            <a href={channels.call.href} className="btn-primary">
              <Icon name="phone" className="h-4 w-4" /> Call {channels.call.display}
            </a>
          )}
        </div>
      </PageHeader>
      <section className="section">
        <div className="container-site">
          <div role="note" className="flex gap-4 rounded-brand border border-warning/35 bg-warningSoft p-6 text-warningText">
            <Icon name="triangle-alert" className="mt-0.5 h-6 w-6 shrink-0" />
            <p className="font-medium">{e.hospitalWarning}</p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {e.situations.map((s) => (
              <article key={s.title} className="rounded-brand border border-border p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{getDepartment(s.department)?.title}</p>
                <h2 className="mt-2 text-[1.4rem]">{s.title}</h2>
                <ol className="mt-4 space-y-2">
                  {s.steps.map((st, i) => (
                    <li key={st} className="flex gap-3 text-[0.97rem]">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-skySoft text-xs font-bold text-primaryDeep">{i + 1}</span>
                      {st}
                    </li>
                  ))}
                </ol>
              </article>
            ))}
          </div>
          <p className="mt-8 text-sm text-textSecondary">General first-aid information only, not a substitute for medical care.</p>
        </div>
      </section>
    </>
  );
}
