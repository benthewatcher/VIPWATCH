import Image from 'next/image';
import { getT } from '@/lib/i18n/t';
import { FadeUp } from '@/components/site/FadeUp';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { pickLocale } from '@/lib/i18n/pick';
import { publicMediaUrl } from '@/lib/utils/storage';
import type { Locale } from '@/lib/i18n/config';

export const revalidate = 60;

async function getSteps() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('process_steps')
    .select('id, number, position, title_en, title_fr, copy_en, copy_fr')
    .eq('status', 'published')
    .order('position');
  return data ?? [];
}

type Step = { id: string; number: string; position: number; title_en: string; title_fr: string; copy_en: string; copy_fr: string };

async function getIntro() {
  const supabase = (await createClient()) as any;
  const { data } = await supabase
    .from('pages')
    .select('hero_image, hero_image_mobile, hero_heading_en, hero_heading_fr, body_en, body_fr')
    .eq('key', 'process-intro')
    .maybeSingle();
  return data as {
    hero_image: string | null;
    hero_image_mobile: string | null;
    hero_heading_en: string | null;
    hero_heading_fr: string | null;
    body_en: string | null;
    body_fr: string | null;
  } | null;
}

export default async function ProcessPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [steps, intro] = await Promise.all([getSteps(), getIntro()]);
  return <Content locale={locale as Locale} steps={steps} intro={intro} />;
}

function Content({
  locale,
  steps,
  intro,
}: {
  locale: Locale;
  steps: Step[];
  intro: Awaited<ReturnType<typeof getIntro>>;
}) {
  const t = getT(locale, 'process');
  const title = pickLocale(intro as Record<string, unknown> | null, 'hero_heading', locale) || t('title');
  const subtitle = pickLocale(intro as Record<string, unknown> | null, 'body', locale) || t('subtitle');
  const heroUrl = publicMediaUrl(intro?.hero_image ?? null);
  const heroUrlMobile = publicMediaUrl(intro?.hero_image_mobile ?? null);

  return (
    <>
      {(heroUrl || heroUrlMobile) && (
        <section className="relative h-[60vh] min-h-[420px] w-full overflow-hidden">
          {heroUrlMobile && (
            <Image src={heroUrlMobile} alt={title} fill priority sizes="100vw" className="object-cover md:hidden" />
          )}
          {heroUrl && (
            <Image src={heroUrl} alt={title} fill priority sizes="100vw" className={`object-cover ${heroUrlMobile ? 'hidden md:block' : ''}`} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/90 via-bg-primary/40 to-bg-primary/20" />
        </section>
      )}
      <header className="mx-auto max-w-7xl px-6 pt-10 pb-8 md:pt-14 md:pb-10">
        <h1 className="font-serif text-4xl md:text-5xl tracking-tight">{title}</h1>
        {subtitle && (
          <p className="mt-3 max-w-2xl text-sm md:text-base text-text-muted whitespace-pre-line">{subtitle}</p>
        )}
      </header>

      <section className="border-t border-divider">
        <div className="mx-auto max-w-5xl px-6 py-20 md:py-28">
          {steps.length === 0 ? (
            <p className="text-text-muted">No process steps published yet.</p>
          ) : (
            <ol className="relative">
              <span className="absolute left-[28px] top-0 bottom-0 w-px bg-divider hidden md:block" aria-hidden />
              {steps.map((step, i) => (
                <FadeUp key={step.id} delay={i * 0.05}>
                  <li className="relative grid gap-6 md:grid-cols-[80px_1fr] py-10 md:py-14 border-b border-divider last:border-b-0">
                    <div className="flex md:flex-col items-center md:items-start gap-4">
                      <span className="relative grid place-items-center w-14 h-14 rounded-full border border-accent text-accent font-serif text-lg bg-bg-primary">
                        {step.number}
                      </span>
                    </div>
                    <div>
                      <h2 className="font-serif text-3xl md:text-4xl leading-tight">
                        {pickLocale(step, 'title', locale)}
                      </h2>
                      <p className="mt-4 text-text-muted text-lg leading-relaxed max-w-2xl whitespace-pre-line">
                        {pickLocale(step, 'copy', locale)}
                      </p>
                    </div>
                  </li>
                </FadeUp>
              ))}
            </ol>
          )}
        </div>
      </section>

      <section className="border-t border-divider mx-auto max-w-7xl px-6 py-24 md:py-32 text-center">
        <h2 className="font-serif text-4xl md:text-5xl">
          {locale === 'ar' ? 'Prêt à commencer ?' : 'Ready to begin?'}
        </h2>
        <Link
          href={`/${locale}/contact`}
          className="inline-block mt-10 border border-accent px-10 py-4 text-xs uppercase tracking-[0.25em] text-accent hover:bg-accent hover:text-bg-primary transition-colors"
        >
          {locale === 'ar' ? 'Démarrer une demande' : 'Start an enquiry'}
        </Link>
      </section>
    </>
  );
}
