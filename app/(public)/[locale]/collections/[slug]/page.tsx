import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAnonClient } from '@/lib/supabase/anon';
import { Hero } from '@/components/site/Hero';
import { FadeUp } from '@/components/site/FadeUp';
import { CommissionCard } from '@/components/site/CommissionCard';
import { ThemeForce } from '@/components/site/ThemeForce';
import { publicMediaUrl } from '@/lib/utils/storage';
import { pickLocale } from '@/lib/i18n/pick';
import type { Locale } from '@/lib/i18n/config';

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const supabase = (createAnonClient()) as any;
  const { data: row } = await supabase
    .from('commission_collections')
    .select('name_en, name_fr, project_en, project_fr, description_en, description_fr, cover_image, is_private')
    .eq('slug', slug)
    .maybeSingle();
  if (!row || row.is_private) return { title: 'Collection not found' };

  const loc = locale as Locale;
  const name = pickLocale(row, 'name', loc) ?? '';
  const description =
    pickLocale(row, 'description', loc) ??
    pickLocale(row, 'project', loc) ??
    'A curated VIP WATCH collection.';
  const ogImage = publicMediaUrl(row.cover_image) ?? undefined;
  const fullTitle = `${name} — VIP WATCH`;
  const url = `/${locale}/collections/${slug}`;

  return {
    title: fullTitle,
    description,
    alternates: {
      canonical: url,
      languages: { en: `/en/collections/${slug}`, ar: `/ar/collections/${slug}` },
    },
    openGraph: {
      type: 'website',
      title: fullTitle,
      description,
      url,
      images: ogImage ? [{ url: ogImage }] : undefined,
      locale,
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export async function generateStaticParams() {
  const supabase = (createAnonClient()) as any;
  const { data } = await supabase
    .from('commission_collections')
    .select('slug')
    .eq('is_private', false);
  return ((data ?? []) as Array<{ slug: string }>).flatMap((c) => [
    { locale: 'en', slug: c.slug },
    { locale: 'ar', slug: c.slug },
  ]);
}

export default async function CollectionDetail({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const loc = locale as Locale;
  const supabase = (await createClient()) as any;

  const { data: row } = await supabase
    .from('commission_collections')
    .select('id, slug, name_en, name_fr, project_en, project_fr, description_en, description_fr, cover_image, is_private, theme')
    .eq('slug', slug)
    .eq('is_private', false)
    .maybeSingle();
  if (!row) notFound();

  const { data: pivot } = await supabase
    .from('collection_commissions')
    .select('commission_id, position')
    .eq('collection_id', row.id)
    .order('position');

  const ids = ((pivot ?? []) as Array<{ commission_id: string }>).map((p) => p.commission_id);
  let commissions: Array<{
    id: string;
    slug: string;
    title_en: string | null;
    title_fr: string | null;
    watch_model: string | null;
    hero_image: string | null;
    card_image: string | null;
  }> = [];
  if (ids.length > 0) {
    const { data } = await supabase
      .from('commissions')
      .select('id, slug, title_en, title_fr, watch_model, hero_image, card_image')
      .eq('status', 'published')
      .in('id', ids);
    const byId = new Map((data ?? []).map((c: any) => [c.id, c]));
    commissions = ((pivot ?? []) as Array<{ commission_id: string }>)
      .map((p) => byId.get(p.commission_id))
      .filter((c): c is NonNullable<typeof c> => Boolean(c)) as typeof commissions;
  }

  const name = pickLocale(row, 'name', loc) ?? '';
  const project = pickLocale(row, 'project', loc);
  const description = pickLocale(row, 'description', loc);
  const heroUrl = publicMediaUrl(row.cover_image);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description: description ?? '',
    image: heroUrl ?? undefined,
    inLanguage: loc,
    url: `/${loc}/collections/${slug}`,
  };

  return (
    <article>
      <ThemeForce theme={(row as { theme?: 'system' | 'light' | 'dark' }).theme ?? 'system'} />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero image={heroUrl ?? undefined} alt={name}>
        <FadeUp>
          {project && <p className="text-xs uppercase tracking-[0.3em] text-accent">{project}</p>}
          <h1 className="font-serif text-5xl md:text-7xl mt-4 max-w-4xl tracking-tight leading-[1.05]">
            {name}
          </h1>
          {description && <p className="mt-6 max-w-xl text-lg text-text-muted">{description}</p>}
        </FadeUp>
      </Hero>

      <section className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        {commissions.length === 0 ? (
          <p className="text-text-muted">
            {loc === 'ar' ? 'لا توجد أعمال في هذه المجموعة بعد.' : 'No commissions in this collection yet.'}
          </p>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {commissions.map((c, i) => (
              <FadeUp key={c.id} delay={(i % 3) * 0.08}>
                <CommissionCard
                  slug={c.slug}
                  title={pickLocale(c, 'title', loc) ?? ''}
                  brand={c.watch_model}
                  image={publicMediaUrl(c.card_image ?? c.hero_image)}
                  locale={loc}
                />
              </FadeUp>
            ))}
          </div>
        )}
      </section>
    </article>
  );
}
