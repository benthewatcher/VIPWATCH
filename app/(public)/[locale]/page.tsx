import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/lib/i18n/routing';
import { Hero } from '@/components/site/Hero';
import { FadeUp } from '@/components/site/FadeUp';
import { SectionIntro } from '@/components/site/SectionIntro';
import { CommissionCard } from '@/components/site/CommissionCard';
import { getHomePage, getFeaturedCommissions, getServicesForGrid } from '@/lib/queries/home';
import { publicMediaUrl } from '@/lib/utils/storage';
import { pickLocale } from '@/lib/i18n/pick';
import type { Locale } from '@/lib/i18n/config';
import { useTranslations } from 'next-intl';

export const revalidate = 60;

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [page, featured, services] = await Promise.all([
    getHomePage(),
    getFeaturedCommissions(3),
    getServicesForGrid(4),
  ]);
  return <Home locale={locale as Locale} page={page} featured={featured} services={services} />;
}

type HomeProps = {
  locale: Locale;
  page: Record<string, unknown> | null;
  featured: Array<{ id: string; slug: string; card_image: string | null; hero_image: string | null; title_en: string; title_fr: string; watch_model: string | null }>;
  services: Array<{ id: string; slug: string; title_en: string; title_fr: string; position: number }>;
};

function Home({ locale, page, featured, services }: HomeProps) {
  const t = useTranslations('home');
  const heroHeading = pickLocale(page, 'hero_heading', locale) ?? t('heroHeading');
  const intro = pickLocale(page, 'body', locale) ?? t('intro');
  const ctaLabel = pickLocale(page, 'hero_cta_label', locale) ?? t('heroCta');
  const ctaHref = (page?.hero_cta_href as string) ?? '/contact';
  const heroImg = publicMediaUrl(page?.hero_image as string | null);

  return (
    <>
      <Hero image={heroImg ?? undefined} alt={heroHeading}>
        <FadeUp>
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl max-w-4xl tracking-tight leading-[1.05]">
            {heroHeading}
          </h1>
        </FadeUp>
        <FadeUp delay={0.15}>
          <p className="mt-8 max-w-xl text-lg text-text-muted">{intro}</p>
        </FadeUp>
        <FadeUp delay={0.3}>
          <Link
            href={ctaHref}
            className="inline-block mt-12 border border-accent px-10 py-4 text-xs uppercase tracking-[0.25em] text-accent hover:bg-accent hover:text-bg-primary transition-colors"
          >
            {ctaLabel}
          </Link>
        </FadeUp>
      </Hero>

      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <SectionIntro
            eyebrow="01"
            heading={t('featuredHeading')}
            cta={{ label: locale === 'fr' ? 'Toutes les réalisations' : 'View all commissions', href: '/commissions' }}
          />
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {featured.map((c, i) => (
              <FadeUp key={c.id} delay={i * 0.1}>
                <CommissionCard
                  slug={c.slug}
                  title={pickLocale(c, 'title', locale) ?? ''}
                  brand={c.watch_model}
                  image={publicMediaUrl(c.card_image ?? c.hero_image)}
                />
              </FadeUp>
            ))}
          </div>
        </section>
      )}

      {services.length > 0 && (
        <section className="border-t border-divider">
          <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
            <SectionIntro
              eyebrow="02"
              heading={t('departmentsHeading')}
              cta={{ label: locale === 'fr' ? 'Voir les services' : 'Explore services', href: '/services' }}
            />
          </div>
          <div className="grid gap-px bg-divider md:grid-cols-2 lg:grid-cols-4">
            {services.map((s, i) => (
              <FadeUp key={s.id} delay={i * 0.05}>
                <Link
                  href="/services"
                  className="block bg-bg-primary p-10 aspect-square flex items-end h-full group"
                >
                  <div>
                    <span className="text-xs uppercase tracking-[0.25em] text-accent">
                      {String(s.position).padStart(2, '0')}
                    </span>
                    <p className="font-serif text-3xl mt-3 group-hover:text-accent transition-colors">
                      {pickLocale(s, 'title', locale)}
                    </p>
                  </div>
                </Link>
              </FadeUp>
            ))}
          </div>
        </section>
      )}

      <section className="border-t border-divider mx-auto max-w-7xl px-6 py-24 md:py-32">
        <SectionIntro eyebrow="03" heading={t('testimonialsHeading')} />
        <div className="mt-16 grid gap-12 md:grid-cols-2">
          {[1, 2].map((i) => (
            <FadeUp key={i} delay={i * 0.1}>
              <figure>
                <blockquote className="font-serif text-2xl md:text-3xl leading-snug">
                  &ldquo;An act of patience and precision. They understood the piece better than I did.&rdquo;
                </blockquote>
                <figcaption className="mt-6 text-xs uppercase tracking-[0.25em] text-text-muted">
                  Private client · Geneva
                </figcaption>
              </figure>
            </FadeUp>
          ))}
        </div>
      </section>
    </>
  );
}
