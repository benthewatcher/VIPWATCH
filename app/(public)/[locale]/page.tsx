import Link from 'next/link';
import Image from 'next/image';
import { Hero } from '@/components/site/Hero';
import { HeroCarousel, type HeroSlide } from '@/components/site/HeroCarousel';
import { FadeUp } from '@/components/site/FadeUp';
import { SectionIntro } from '@/components/site/SectionIntro';
import { CommissionCard } from '@/components/site/CommissionCard';
import { getHomePage, getFeaturedCommissions, getServicesForGrid, getFeaturedCollections, getCollectionsForHeroCarousel, getDepartments, getFeaturedTestimonials, getHomeBlocks, getProcessSteps } from '@/lib/queries/home';
import { mobileCoverUrl, publicMediaUrl } from '@/lib/utils/storage';
import { pickLocale } from '@/lib/i18n/pick';
import type { Locale } from '@/lib/i18n/config';
import { getT } from '@/lib/i18n/t';

// While the homepage is actively being authored, render dynamically so admin
// edits show up immediately. Switch back to `export const revalidate = 60`
// once the content stabilises.
export const dynamic = 'force-dynamic';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [page, featured, services, collections, heroCollections, departments, testimonials, blocks, processSteps] = await Promise.all([
    getHomePage(),
    getFeaturedCommissions(3),
    getServicesForGrid(4),
    getFeaturedCollections(2),
    getCollectionsForHeroCarousel(),
    getDepartments(),
    getFeaturedTestimonials(6),
    getHomeBlocks(),
    getProcessSteps(3),
  ]);
  return (
    <Home
      locale={locale as Locale}
      page={page}
      featured={featured}
      services={services}
      collections={collections}
      heroCollections={heroCollections}
      departments={departments}
      testimonials={testimonials}
      atelier={blocks.get('atelier_intro') ?? null}
      processBlock={blocks.get('process_teaser') ?? null}
      ctaStrip={blocks.get('cta_strip') ?? null}
      processSteps={processSteps}
    />
  );
}

type HomeProps = {
  locale: Locale;
  page: Record<string, unknown> | null;
  featured: Array<{ id: string; slug: string; card_image: string | null; hero_image: string | null; title_en: string; title_fr: string; watch_model: string | null }>;
  services: Array<{ id: string; slug: string; title_en: string; title_fr: string; position: number }>;
  collections: Array<{ id: string; slug: string; name_en: string | null; name_fr: string | null; project_en: string | null; project_fr: string | null; cover_image: string | null; position: number }>;
  heroCollections: Array<{ id: string; slug: string; name_en: string | null; name_fr: string | null; project_en: string | null; project_fr: string | null; cover_image: string | null; cover_image_mobile: string | null }>;
  departments: Array<{ id: string; slug: string; title_en: string | null; title_fr: string | null; body_en: string | null; body_fr: string | null; image: string | null; link_url: string | null; link_label_en: string | null; link_label_fr: string | null; position: number }>;
  testimonials: Array<{ id: string; client_name: string; client_role: string | null; quote_en: string; quote_fr: string | null; photo_url: string | null; backdrop_image: string | null; position: number }>;
  atelier: HomeBlock | null;
  processBlock: HomeBlock | null;
  ctaStrip: HomeBlock | null;
  processSteps: Array<{ id: string; number: string; title_en: string; title_fr: string; copy_en: string; copy_fr: string; position: number }>;
};

type HomeBlock = {
  block_key: 'atelier_intro' | 'cta_strip' | 'process_teaser';
  is_visible: boolean;
  eyebrow_en: string | null;
  eyebrow_fr: string | null;
  title_en: string | null;
  title_fr: string | null;
  body_en: string | null;
  body_fr: string | null;
  cta_label_en: string | null;
  cta_label_fr: string | null;
  cta_url: string | null;
  image: string | null;
};

function Home({ locale, page, featured, services, collections, heroCollections, departments, testimonials, atelier, processBlock, ctaStrip, processSteps }: HomeProps) {
  const t = getT(locale, 'home');
  const heroHeading = pickLocale(page, 'hero_heading', locale) ?? t('heroHeading');
  const intro = pickLocale(page, 'body', locale) ?? t('intro');
  const ctaLabel = pickLocale(page, 'hero_cta_label', locale) ?? t('heroCta');
  const ctaHref = (page?.hero_cta_href as string) ?? '/contact';
  const heroImg = publicMediaUrl(page?.hero_image as string | null);
  const heroImgMobile = publicMediaUrl(page?.hero_image_mobile as string | null);

  const heroSlides: HeroSlide[] = heroCollections.flatMap((c) => {
    const image = publicMediaUrl(c.cover_image);
    if (!image) return [];
    return [{
      id: c.id,
      href: `/${locale}/collections/${c.slug}`,
      title: pickLocale(c, 'name', locale) ?? '',
      eyebrow: pickLocale(c, 'project', locale),
      ctaLabel: locale === 'ar' ? 'Découvrir la collection' : 'Explore collection',
      image,
      imageMobile: mobileCoverUrl(c.cover_image, c.cover_image_mobile),
    }];
  });

  return (
    <>
      {heroSlides.length > 0 ? (
        <HeroCarousel slides={heroSlides} />
      ) : (
        <Hero image={heroImg ?? undefined} imageMobile={heroImgMobile ?? undefined} alt={heroHeading}>
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
      )}

      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <SectionIntro
            eyebrow="01"
            heading={t('featuredHeading')}
            cta={{ label: locale === 'ar' ? 'Toutes les réalisations' : 'View all commissions', href: `/${locale}/commissions` }}
          />
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {featured.map((c, i) => (
              <FadeUp key={c.id} delay={i * 0.1}>
                <CommissionCard
                  slug={c.slug}
                  title={pickLocale(c, 'title', locale) ?? ''}
                  brand={c.watch_model}
                  image={publicMediaUrl(c.card_image ?? c.hero_image)}
                  locale={locale}
                />
              </FadeUp>
            ))}
          </div>
        </section>
      )}

      {atelier && (atelier.title_en || atelier.body_en || atelier.eyebrow_en || atelier.image) && (
        <section className="border-t border-divider">
          <div className="mx-auto max-w-7xl px-6 py-24 md:py-32 grid gap-16 md:grid-cols-2 items-center">
            {atelier.image && (
              <FadeUp>
                <div className="relative aspect-[4/5] bg-bg-secondary overflow-hidden">
                  <Image
                    src={publicMediaUrl(atelier.image) ?? ''}
                    alt={pickLocale(atelier, 'title', locale) ?? ''}
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
              </FadeUp>
            )}
            <FadeUp delay={0.1}>
              {pickLocale(atelier, 'eyebrow', locale) && (
                <p className="text-xs uppercase tracking-[0.3em] text-accent">
                  {pickLocale(atelier, 'eyebrow', locale)}
                </p>
              )}
              <h2 className="font-serif text-4xl md:text-5xl mt-4 tracking-tight leading-[1.1]">
                {pickLocale(atelier, 'title', locale)}
              </h2>
              {pickLocale(atelier, 'body', locale) && (
                <p className="mt-6 text-lg text-text-muted whitespace-pre-line">
                  {pickLocale(atelier, 'body', locale)}
                </p>
              )}
              {atelier.cta_url && (
                <Link
                  href={atelier.cta_url}
                  className="inline-block mt-10 border border-accent px-8 py-3 text-xs uppercase tracking-[0.25em] text-accent hover:bg-accent hover:text-bg-primary transition-colors"
                >
                  {pickLocale(atelier, 'cta_label', locale) || (locale === 'ar' ? 'اكتشف' : 'Read more')}
                </Link>
              )}
            </FadeUp>
          </div>
        </section>
      )}

      {processSteps.length > 0 && (
        <section className="border-t border-divider">
          <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
            <SectionIntro
              eyebrow={pickLocale(processBlock as Record<string, unknown> | null, 'eyebrow', locale) ?? '02'}
              heading={
                pickLocale(processBlock as Record<string, unknown> | null, 'title', locale) ??
                (locale === 'ar' ? 'عملنا' : 'How a commission works')
              }
              cta={
                processBlock?.cta_url
                  ? {
                      label:
                        pickLocale(processBlock as Record<string, unknown> | null, 'cta_label', locale) ??
                        (locale === 'ar' ? 'اقرأ العملية' : 'Read the process'),
                      href: processBlock.cta_url,
                    }
                  : { label: locale === 'ar' ? 'اقرأ العملية' : 'Read the process', href: `/${locale}/process` }
              }
            />
            {pickLocale(processBlock as Record<string, unknown> | null, 'body', locale) && (
              <p className="mt-6 max-w-2xl text-text-muted">
                {pickLocale(processBlock as Record<string, unknown> | null, 'body', locale)}
              </p>
            )}
            <ol className="mt-16 grid gap-px bg-divider md:grid-cols-3">
              {processSteps.map((s, i) => (
                <FadeUp key={s.id} delay={i * 0.08}>
                  <div className="bg-bg-primary p-10 h-full">
                    <span className="text-xs uppercase tracking-[0.3em] text-accent">{s.number}</span>
                    <h3 className="font-serif text-2xl mt-4">
                      {pickLocale(s, 'title', locale)}
                    </h3>
                    <p className="mt-4 text-text-muted text-sm leading-relaxed">
                      {pickLocale(s, 'copy', locale)}
                    </p>
                  </div>
                </FadeUp>
              ))}
            </ol>
          </div>
        </section>
      )}

      {collections.length > 0 && (
        <section className="border-t border-divider mx-auto max-w-7xl px-6 py-24 md:py-32">
          <SectionIntro
            eyebrow="02"
            heading={locale === 'ar' ? 'مجموعات منسّقة' : 'Curated collections'}
            cta={{
              label: locale === 'ar' ? 'كل المجموعات' : 'All collections',
              href: `/${locale}/collections`,
            }}
          />
          <div className="mt-16 grid gap-8 md:grid-cols-2">
            {collections.map((c, i) => {
              const img = publicMediaUrl(c.cover_image);
              const name = pickLocale(c, 'name', locale) ?? '';
              const project = pickLocale(c, 'project', locale);
              return (
                <FadeUp key={c.id} delay={i * 0.1}>
                  <Link href={`/${locale}/collections/${c.slug}`} className="group block">
                    <div className="relative aspect-[16/10] overflow-hidden bg-bg-secondary border border-divider">
                      {img && (
                        <Image
                          src={img}
                          alt={name}
                          fill
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      )}
                    </div>
                    <div className="mt-4">
                      {project && (
                        <p className="text-xs uppercase tracking-[0.2em] text-text-muted">{project}</p>
                      )}
                      <h3 className="font-serif text-3xl mt-1 group-hover:text-accent transition-colors">
                        {name}
                      </h3>
                    </div>
                  </Link>
                </FadeUp>
              );
            })}
          </div>
        </section>
      )}

      {services.length > 0 && (
        <section className="border-t border-divider">
          <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
            <SectionIntro
              eyebrow="02"
              heading={t('departmentsHeading')}
              cta={{ label: locale === 'ar' ? 'Voir les services' : 'Explore services', href: `/${locale}/services` }}
            />
          </div>
          <div className="grid gap-px bg-divider md:grid-cols-2 lg:grid-cols-4">
            {services.map((s, i) => (
              <FadeUp key={s.id} delay={i * 0.05}>
                <Link
                  href={`/${locale}/services`}
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

      {departments.length > 0 && (
        <section className="border-t border-divider">
          <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
            <SectionIntro
              eyebrow="04"
              heading={locale === 'ar' ? 'الأقسام' : 'Departments'}
            />
          </div>
          <div className="grid gap-px bg-divider md:grid-cols-2">
            {departments.map((d, i) => {
              const img = publicMediaUrl(d.image);
              const title = pickLocale(d, 'title', locale) ?? '';
              const body = pickLocale(d, 'body', locale);
              const linkLabel = pickLocale(d, 'link_label', locale);
              const Wrapper: React.ElementType = d.link_url ? Link : 'div';
              const wrapperProps = d.link_url ? { href: d.link_url } : {};
              return (
                <FadeUp key={d.id} delay={(i % 2) * 0.08}>
                  <Wrapper
                    {...wrapperProps}
                    className="relative block aspect-[4/5] md:aspect-[5/4] overflow-hidden bg-bg-secondary group"
                  >
                    {img && (
                      <Image
                        src={img}
                        alt={title}
                        fill
                        sizes="(min-width: 768px) 50vw, 100vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/90 via-bg-primary/40 to-transparent" />
                    <div className="relative h-full flex flex-col justify-end p-10 md:p-14">
                      <h3 className="font-serif text-4xl md:text-5xl tracking-tight">{title}</h3>
                      {body && (
                        <p className="mt-4 max-w-md text-text-muted">{body}</p>
                      )}
                      {d.link_url && (linkLabel || true) && (
                        <span className="mt-6 inline-block text-xs uppercase tracking-[0.25em] text-accent">
                          {linkLabel || (locale === 'ar' ? 'استكشف' : 'Explore')} ↗
                        </span>
                      )}
                    </div>
                  </Wrapper>
                </FadeUp>
              );
            })}
          </div>
        </section>
      )}

      {testimonials.length > 0 && (
        <section className="border-t border-divider">
          <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
            <SectionIntro eyebrow="05" heading={t('testimonialsHeading')} />
            <div className="mt-16 grid gap-px bg-divider md:grid-cols-2">
              {testimonials.slice(0, 4).map((tm, i) => {
                const img = publicMediaUrl(tm.backdrop_image);
                const quote = pickLocale(tm as Record<string, unknown>, 'quote', locale) ?? '';
                return (
                  <FadeUp key={tm.id} delay={(i % 2) * 0.08}>
                    <figure className="relative bg-bg-primary p-10 md:p-14 min-h-[28rem] flex flex-col justify-end overflow-hidden">
                      {img && (
                        <>
                          <Image
                            src={img}
                            alt=""
                            aria-hidden="true"
                            fill
                            sizes="(min-width: 768px) 50vw, 100vw"
                            className="object-cover opacity-15"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/80 to-bg-primary/30" />
                        </>
                      )}
                      <blockquote className="relative font-serif text-2xl md:text-3xl leading-snug">
                        &ldquo;{quote}&rdquo;
                      </blockquote>
                      <figcaption className="relative mt-6 text-xs uppercase tracking-[0.25em] text-text-muted">
                        {tm.client_name}
                        {tm.client_role && <> · {tm.client_role}</>}
                      </figcaption>
                    </figure>
                  </FadeUp>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {ctaStrip && (ctaStrip.title_en || ctaStrip.body_en || ctaStrip.cta_url || ctaStrip.image) && (
        <section className="relative border-t border-divider overflow-hidden">
          {ctaStrip.image && (
            <>
              <Image
                src={publicMediaUrl(ctaStrip.image) ?? ''}
                alt=""
                aria-hidden="true"
                fill
                sizes="100vw"
                className="object-cover opacity-30"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/80 to-bg-primary/50" />
            </>
          )}
          <div className="relative mx-auto max-w-4xl px-6 py-32 md:py-40 text-center">
            <FadeUp>
              {pickLocale(ctaStrip, 'eyebrow', locale) && (
                <p className="text-xs uppercase tracking-[0.3em] text-accent">
                  {pickLocale(ctaStrip, 'eyebrow', locale)}
                </p>
              )}
              <h2 className="font-serif text-5xl md:text-6xl mt-4 tracking-tight leading-[1.05]">
                {pickLocale(ctaStrip, 'title', locale)}
              </h2>
              {pickLocale(ctaStrip, 'body', locale) && (
                <p className="mt-6 max-w-xl mx-auto text-lg text-text-muted">
                  {pickLocale(ctaStrip, 'body', locale)}
                </p>
              )}
              {ctaStrip.cta_url && (
                <Link
                  href={ctaStrip.cta_url}
                  className="inline-block mt-10 border border-accent px-12 py-4 text-xs uppercase tracking-[0.25em] text-accent hover:bg-accent hover:text-bg-primary transition-colors"
                >
                  {pickLocale(ctaStrip, 'cta_label', locale) || (locale === 'ar' ? 'ابدأ التكليف' : 'Begin a commission')}
                </Link>
              )}
            </FadeUp>
          </div>
        </section>
      )}
    </>
  );
}
