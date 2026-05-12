import Link from 'next/link';
import type { Locale } from '@/lib/i18n/config';

const COPY: Record<Locale, { eyebrow: string; title: string; body: string; cta: string; whatsapp: string }> = {
  en: {
    eyebrow: 'Your turn',
    title: 'Begin a commission',
    body: 'Send us your location and a brief idea — we will review within a week and arrange a time to talk.',
    cta: 'Send a message',
    whatsapp: 'WhatsApp',
  },
  ar: {
    eyebrow: 'À votre tour',
    title: 'Commencer une réalisation',
    body: "Envoyez-nous votre localisation et une brève idée — nous vous répondrons dans la semaine pour convenir d'un échange.",
    cta: 'Envoyer un message',
    whatsapp: 'WhatsApp',
  },
};

export function BeginCommissionCTA({ locale }: { locale: Locale }) {
  const t = COPY[locale] ?? COPY.en;
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  const waHref = number
    ? `https://wa.me/${number}?text=${encodeURIComponent(t.body)}`
    : null;

  return (
    <section className="border-t border-divider bg-bg-secondary">
      <div className="mx-auto max-w-4xl px-6 py-24 md:py-32 text-center">
        <p className="text-[11px] uppercase tracking-[0.4em] text-accent">{t.eyebrow}</p>
        <h2 className="font-serif text-4xl md:text-6xl mt-4 tracking-tight">{t.title}</h2>
        <p className="mt-6 text-text-muted max-w-xl mx-auto text-sm md:text-base">{t.body}</p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href={`/${locale}/contact`}
            className="border border-accent px-8 py-3 text-xs uppercase tracking-[0.25em] text-accent hover:bg-accent hover:text-bg-primary transition-colors"
          >
            {t.cta}
          </Link>
          {waHref && (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-divider px-8 py-3 text-xs uppercase tracking-[0.25em] text-text-muted hover:border-accent hover:text-accent transition-colors"
            >
              {t.whatsapp}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
