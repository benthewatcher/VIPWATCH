import type { Locale } from '@/lib/i18n/config';

const LABELS: Record<Locale, { eyebrow: string; baseWatch: string; services: string; timeline: string }> = {
  en: {
    eyebrow: 'Project specifications',
    baseWatch: 'Base watch',
    services: 'Services performed',
    timeline: 'Timeline',
  },
  ar: {
    eyebrow: 'Spécifications du projet',
    baseWatch: "Montre d'origine",
    services: 'Services réalisés',
    timeline: 'Calendrier',
  },
};

export function CommissionSpec({
  locale,
  baseWatch,
  services,
  timeline,
}: {
  locale: Locale;
  baseWatch: string | null;
  services: string | null;
  timeline: string | null;
}) {
  if (!baseWatch && !services && !timeline) return null;
  const t = LABELS[locale] ?? LABELS.en;

  return (
    <section className="border-t border-divider">
      <div className="mx-auto max-w-5xl px-6 py-16 md:py-24">
        <p className="text-[11px] uppercase tracking-[0.4em] text-accent">{t.eyebrow}</p>
        <dl className="mt-8 grid gap-10 md:grid-cols-2">
          {baseWatch && (
            <div>
              <dt className="text-xs uppercase tracking-[0.2em] text-text-muted">{t.baseWatch}</dt>
              <dd className="font-serif text-2xl md:text-3xl mt-3 leading-snug">{baseWatch}</dd>
            </div>
          )}
          {timeline && (
            <div>
              <dt className="text-xs uppercase tracking-[0.2em] text-text-muted">{t.timeline}</dt>
              <dd className="font-serif text-2xl md:text-3xl mt-3 leading-snug">{timeline}</dd>
            </div>
          )}
          {services && (
            <div className="md:col-span-2">
              <dt className="text-xs uppercase tracking-[0.2em] text-text-muted">{t.services}</dt>
              <dd className="mt-3 text-base md:text-lg leading-relaxed whitespace-pre-line text-text-primary">
                {services}
              </dd>
            </div>
          )}
        </dl>
      </div>
    </section>
  );
}
