import { parseServices, stripBespoke } from '@/lib/commission/services';
import type { Locale } from '@/lib/i18n/config';

const LABELS: Record<Locale, { eyebrow: string; baseWatch: string; services: string; timeline: string }> = {
  en: {
    eyebrow: 'Project specifications',
    baseWatch: 'Base watch',
    services: 'Bespoke services performed',
    timeline: 'Timeline',
  },
  ar: {
    eyebrow: 'Spécifications du projet',
    baseWatch: "Montre d'origine",
    services: 'Services bespoke réalisés',
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
  const serviceList = parseServices(services).map(stripBespoke);
  void timeline; // hidden from the public spec for now; admin field is kept.
  if (!baseWatch && serviceList.length === 0) return null;
  const t = LABELS[locale] ?? LABELS.en;

  return (
    <section className="border-t border-divider">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <p className="text-[11px] uppercase tracking-[0.4em] text-accent">{t.eyebrow}</p>

        {baseWatch && (
          <div className="mt-10">
            <p className="text-[11px] uppercase tracking-[0.3em] text-text-muted">{t.baseWatch}</p>
            <p className="font-serif text-3xl md:text-4xl mt-3 leading-tight">{baseWatch}</p>
          </div>
        )}

        {serviceList.length > 0 && (
          <div className="mt-16">
            <p className="text-[11px] uppercase tracking-[0.3em] text-text-muted">{t.services}</p>
            <ul className="mt-6 grid gap-px bg-divider sm:grid-cols-2 lg:grid-cols-3 border border-divider">
              {serviceList.map((s, i) => (
                <li
                  key={`${s}-${i}`}
                  className="bg-bg-primary px-6 py-5 flex items-center gap-3 min-h-[72px]"
                >
                  <span
                    aria-hidden
                    className="font-serif text-accent text-sm tabular-nums w-6"
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="font-serif text-lg md:text-xl leading-tight">{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
