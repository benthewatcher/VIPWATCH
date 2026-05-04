import { getT } from '@/lib/i18n/t';
import * as Icons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PageHeader } from '@/components/site/PageHeader';
import { FadeUp } from '@/components/site/FadeUp';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { publicMediaUrl } from '@/lib/utils/storage';
import { pickLocale } from '@/lib/i18n/pick';
import type { Locale } from '@/lib/i18n/config';
import Image from 'next/image';

export const revalidate = 60;

type ServiceRow = {
  id: string;
  slug: string;
  icon_name: string | null;
  hero_image: string | null;
  position: number;
  status: string;
  title_en: string | null;
  title_fr: string | null;
  summary_en: string | null;
  summary_fr: string | null;
  body_en: string | null;
  body_fr: string | null;
};

async function getServices() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('services')
    .select('*')
    .eq('status', 'published')
    .order('position', { ascending: true });
  return (data ?? []) as ServiceRow[];
}

export default async function ServicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const services = await getServices();
  return <Content locale={locale as Locale} services={services} />;
}

function Content({ locale, services }: { locale: Locale; services: ServiceRow[] }) {
  const t = getT(locale, 'services');
  return (
    <>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      <section className="border-t border-divider">
        <div className="grid divide-y divide-divider">
          {services.map((s, i) => {
            const Icon = (Icons[s.icon_name as keyof typeof Icons] ?? Icons.Circle) as LucideIcon;
            const reverse = i % 2 === 1;
            const heroUrl = publicMediaUrl(s.hero_image);
            const title = pickLocale(s, 'title', locale) ?? '';
            const summary = pickLocale(s, 'summary', locale);
            const body = pickLocale(s, 'body', locale);

            return (
              <FadeUp key={s.id}>
                <article className="mx-auto max-w-7xl px-6 py-20 md:py-28 grid gap-10 md:grid-cols-12 items-center">
                  <div className={'md:col-span-5 ' + (reverse ? 'md:order-2' : '')}>
                    <div className="relative aspect-[4/5] bg-bg-secondary border border-divider overflow-hidden">
                      {heroUrl ? (
                        <Image
                          src={heroUrl}
                          alt={title}
                          fill
                          className="object-cover"
                          sizes="(min-width: 768px) 40vw, 100vw"
                        />
                      ) : (
                        <div className="absolute inset-0 grid place-items-center">
                          <Icon size={64} className="text-accent" strokeWidth={1} />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={'md:col-span-7 ' + (reverse ? 'md:order-1' : '')}>
                    <span className="text-xs uppercase tracking-[0.3em] text-accent">
                      {String(s.position).padStart(2, '0')}
                    </span>
                    <h2 className="font-serif text-4xl md:text-5xl mt-4 leading-[1.1]">{title}</h2>
                    {summary && <p className="mt-5 text-lg text-text-muted">{summary}</p>}
                    {body && (
                      <p className="mt-6 text-text-primary/80 leading-relaxed max-w-xl whitespace-pre-line">
                        {body}
                      </p>
                    )}
                  </div>
                </article>
              </FadeUp>
            );
          })}
          {services.length === 0 && (
            <div className="mx-auto max-w-7xl px-6 py-32 text-center text-text-muted">
              No services published yet.
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-divider mx-auto max-w-7xl px-6 py-24 md:py-32 text-center">
        <h2 className="font-serif text-4xl md:text-5xl">
          {locale === 'ar' ? 'Commencer une réalisation' : 'Begin a commission'}
        </h2>
        <Link
          href="/contact"
          className="inline-block mt-10 border border-accent px-10 py-4 text-xs uppercase tracking-[0.25em] text-accent hover:bg-accent hover:text-bg-primary transition-colors"
        >
          {locale === 'ar' ? "Contacter l'atelier" : 'Contact the atelier'}
        </Link>
      </section>
    </>
  );
}
