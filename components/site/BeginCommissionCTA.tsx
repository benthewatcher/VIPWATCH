import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { publicMediaUrl } from '@/lib/utils/storage';
import type { Locale } from '@/lib/i18n/config';

const COPY: Record<Locale, { eyebrow: string; title: string; body: string; cta: string }> = {
  en: {
    eyebrow: 'Your turn',
    title: 'Begin a commission',
    body: 'Send us your location and a brief idea — we will review within a week and arrange a time to talk.',
    cta: 'Send a message',
  },
  ar: {
    eyebrow: 'À votre tour',
    title: 'Commencer une réalisation',
    body: "Envoyez-nous votre localisation et une brève idée — nous vous répondrons dans la semaine pour convenir d'un échange.",
    cta: 'Envoyer un message',
  },
};

/**
 * "Begin a commission" CTA. Rendered at the foot of every public page (mounted
 * in the locale layout). Background image is pulled from the `cta_strip`
 * home_block so admins can change it from /admin/home.
 */
export async function BeginCommissionCTA({ locale }: { locale: Locale }) {
  const t = COPY[locale] ?? COPY.en;

  // pull background image from cta_strip home_block (admin-controlled)
  const supabase = (await createClient()) as any;
  const { data } = await supabase
    .from('home_blocks')
    .select('image')
    .eq('block_key', 'cta_strip')
    .maybeSingle();
  const bgUrl = publicMediaUrl((data as { image?: string | null } | null)?.image ?? null);

  return (
    <section className="relative isolate border-t border-divider overflow-hidden">
      {bgUrl ? (
        <>
          <Image
            src={bgUrl}
            alt=""
            aria-hidden
            fill
            sizes="100vw"
            quality={85}
            className="object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/85 to-bg-primary/40" />
        </>
      ) : (
        <div className="absolute inset-0 bg-bg-secondary" />
      )}

      <div className="relative mx-auto max-w-4xl px-6 py-24 md:py-32 text-center">
        <p className="text-[11px] uppercase tracking-[0.4em] text-accent">{t.eyebrow}</p>
        <h2 className="font-serif text-4xl md:text-6xl mt-4 tracking-tight">{t.title}</h2>
        <p className="mt-6 text-text-muted max-w-xl mx-auto text-sm md:text-base">{t.body}</p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href={`/${locale}/contact`}
            className="border border-accent px-10 py-4 text-xs uppercase tracking-[0.25em] text-accent hover:bg-accent hover:text-bg-primary transition-colors"
          >
            {t.cta}
          </Link>
        </div>
      </div>
    </section>
  );
}
