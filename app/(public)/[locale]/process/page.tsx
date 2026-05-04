import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/site/PageHeader';
import { FadeUp } from '@/components/site/FadeUp';
import { Link } from '@/lib/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { pickLocale } from '@/lib/i18n/pick';
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

export default async function ProcessPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const steps = await getSteps();
  return <Content locale={locale as Locale} steps={steps} />;
}

function Content({ locale, steps }: { locale: Locale; steps: Step[] }) {
  const t = useTranslations('process');
  return (
    <>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

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
          href="/contact"
          className="inline-block mt-10 border border-accent px-10 py-4 text-xs uppercase tracking-[0.25em] text-accent hover:bg-accent hover:text-bg-primary transition-colors"
        >
          {locale === 'ar' ? 'Démarrer une demande' : 'Start an enquiry'}
        </Link>
      </section>
    </>
  );
}
