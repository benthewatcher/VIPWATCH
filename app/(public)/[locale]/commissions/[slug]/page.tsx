import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Hero } from '@/components/site/Hero';
import { FadeUp } from '@/components/site/FadeUp';
import { CommissionCard } from '@/components/site/CommissionCard';
import { CommissionSpec } from '@/components/site/CommissionSpec';
import { ThemeForce } from '@/components/site/ThemeForce';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createAnonClient } from '@/lib/supabase/anon';
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
  const supabase = createAnonClient();
  const { data: row } = await supabase
    .from('commissions')
    .select('title_en, title_fr, summary_en, summary_fr, hero_image, card_image, watch_model')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();
  if (!row) return { title: 'Commission not found' };

  const loc = locale as Locale;
  const title = pickLocale(row, 'title', loc) ?? '';
  const description = pickLocale(row, 'summary', loc) ?? row.watch_model ?? '';
  const ogImage = publicMediaUrl(row.hero_image ?? row.card_image) ?? undefined;
  const fullTitle = `${title} — VIP WATCH`;
  const url = `/${locale}/commissions/${slug}`;

  return {
    title: fullTitle,
    description,
    alternates: {
      canonical: url,
      languages: {
        en: `/en/commissions/${slug}`,
        ar: `/ar/commissions/${slug}`,
      },
    },
    openGraph: {
      type: 'article',
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
  const supabase = createAnonClient();
  const { data } = await supabase
    .from('commissions')
    .select('slug')
    .eq('status', 'published');
  // Generate for both locales.
  return (data ?? []).flatMap((c) => [
    { locale: 'en', slug: c.slug },
    { locale: 'ar', slug: c.slug },
  ]);
}

async function getCommission(slug: string) {
  const supabase = await createClient();
  const { data: row } = await supabase
    .from('commissions')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();
  if (!row) return null;
  const { data: gallery } = await supabase
    .from('commission_images')
    .select('id, url, alt_en, alt_fr, position')
    .eq('commission_id', row.id)
    .order('position');
  // commission_blocks isn't in generated supabase types yet — cast.
  const { data: blocks } = await (supabase as any)
    .from('commission_blocks')
    .select('id, position, type, hidden, body_en, body_fr, image_url, image_url_2, alt_en, alt_fr')
    .eq('commission_id', row.id)
    .eq('hidden', false)
    .order('position');
  // Manual related list takes precedence; otherwise show every other published
  // commission that shares at least one collection with this one (de-duplicated).
  const relatedIds = ((row as any).related_commission_ids ?? []) as string[];
  let more: Array<{
    id: string;
    slug: string;
    title_en: string | null;
    title_fr: string | null;
    watch_model: string | null;
    hero_image: string | null;
    card_image: string | null;
  }> = [];
  if (relatedIds.length > 0) {
    const { data } = await supabase
      .from('commissions')
      .select('id, slug, title_en, title_fr, watch_model, hero_image, card_image')
      .eq('status', 'published')
      .in('id', relatedIds);
    const byId = new Map((data ?? []).map((c) => [c.id, c]));
    more = relatedIds
      .map((id) => byId.get(id))
      .filter((c): c is NonNullable<typeof c> => Boolean(c));
  } else {
    // 1. find every collection this commission belongs to
    const { data: ownLinks } = await (supabase as any)
      .from('collection_commissions')
      .select('collection_id')
      .eq('commission_id', row.id);
    const collectionIds = ((ownLinks ?? []) as Array<{ collection_id: string }>).map((l) => l.collection_id);

    if (collectionIds.length > 0) {
      // 2. fetch every other commission in any of those collections, preserving pivot position order
      const { data: siblingLinks } = await (supabase as any)
        .from('collection_commissions')
        .select('commission_id, position')
        .in('collection_id', collectionIds)
        .order('position', { ascending: true });
      const orderedIds: string[] = [];
      const seen = new Set<string>([row.id]);
      for (const link of (siblingLinks ?? []) as Array<{ commission_id: string; position: number }>) {
        if (seen.has(link.commission_id)) continue;
        seen.add(link.commission_id);
        orderedIds.push(link.commission_id);
      }
      if (orderedIds.length > 0) {
        const { data } = await supabase
          .from('commissions')
          .select('id, slug, title_en, title_fr, watch_model, hero_image, card_image')
          .eq('status', 'published')
          .in('id', orderedIds);
        const byId = new Map((data ?? []).map((c) => [c.id, c]));
        more = orderedIds
          .map((id) => byId.get(id))
          .filter((c): c is NonNullable<typeof c> => Boolean(c));
      }
    }
  }
  type Block = {
    id: string;
    position: number;
    type: 'paragraph' | 'image' | 'image_pair';
    body_en: string | null;
    body_fr: string | null;
    image_url: string | null;
    image_url_2: string | null;
    alt_en: string | null;
    alt_fr: string | null;
  };
  return { row, gallery: gallery ?? [], blocks: (blocks ?? []) as Block[], more };
}

export default async function CommissionDetail({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const result = await getCommission(slug);
  if (!result) notFound();
  const { row, gallery, blocks, more } = result;
  const loc = locale as Locale;

  const title = pickLocale(row, 'title', loc) ?? '';
  const summary = pickLocale(row, 'summary', loc);
  const heroUrl = publicMediaUrl(row.hero_image);
  const heroUrlMobile = publicMediaUrl((row as { hero_image_mobile?: string | null }).hero_image_mobile);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    headline: title,
    description: summary ?? '',
    image: heroUrl ?? undefined,
    inLanguage: loc,
    about: row.watch_model ?? undefined,
    author: { '@type': 'Organization', name: 'VIP WATCH' },
    url: `/${loc}/commissions/${slug}`,
  };

  return (
    <article>
      <ThemeForce theme={(row as { theme?: 'system' | 'light' | 'dark' }).theme ?? 'system'} />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero image={heroUrl ?? undefined} imageMobile={heroUrlMobile ?? undefined} alt={title}>
        <FadeUp>
          <h1 className="font-serif text-5xl md:text-7xl max-w-4xl tracking-tight leading-[1.05]">
            {title}
          </h1>
        </FadeUp>
      </Hero>

      <CommissionSpec
        locale={loc}
        baseWatch={(row as { base_watch?: string | null }).base_watch ?? null}
        services={(row as { services_performed?: string | null }).services_performed ?? null}
        timeline={(row as { timeline?: string | null }).timeline ?? null}
      />

      {blocks.length > 0 && (
        <div className="py-24 md:py-32 grid gap-20">
          {blocks.map((block) => {
            if (block.type === 'paragraph') {
              return null;
            }
            if (block.type === 'image') {
              const url = publicMediaUrl(block.image_url);
              if (!url) return null;
              const alt = pickLocale(block, 'alt', loc) ?? title;
              return (
                <section key={block.id} className="mx-auto max-w-5xl px-6">
                  <FadeUp>
                    <Image
                      src={url}
                      alt={alt}
                      width={1600}
                      height={1067}
                      className="w-full h-auto bg-bg-secondary"
                      sizes="(min-width: 1024px) 1024px, 100vw"
                    />
                  </FadeUp>
                </section>
              );
            }
            if (block.type === 'image_pair') {
              const url1 = publicMediaUrl(block.image_url);
              const url2 = publicMediaUrl(block.image_url_2);
              const alt = pickLocale(block, 'alt', loc) ?? title;
              return (
                <section key={block.id} className="mx-auto max-w-7xl px-6">
                  <FadeUp>
                    <div className="grid gap-4 md:grid-cols-2">
                      {url1 && (
                        <Image src={url1} alt={alt} width={900} height={1200} className="w-full h-auto bg-bg-secondary" sizes="(min-width: 768px) 50vw, 100vw" />
                      )}
                      {url2 && (
                        <Image src={url2} alt={alt} width={900} height={1200} className="w-full h-auto bg-bg-secondary" sizes="(min-width: 768px) 50vw, 100vw" />
                      )}
                    </div>
                  </FadeUp>
                </section>
              );
            }
            return null;
          })}
        </div>
      )}

      {false && gallery.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 pb-24">
          <div className="grid gap-4 md:grid-cols-2">
            {gallery.map((img, i) => {
              const url = publicMediaUrl(img.url);
              if (!url) return null;
              const alt = pickLocale(img, 'alt', loc) ?? title;
              return (
                <FadeUp key={img.id} delay={(i % 4) * 0.06}>
                  <div className="relative aspect-[4/5] bg-bg-secondary border border-divider overflow-hidden">
                    <Image src={url} alt={alt} fill className="object-cover" sizes="(min-width: 768px) 50vw, 100vw" />
                  </div>
                </FadeUp>
              );
            })}
          </div>
        </section>
      )}

      {more.length > 0 && (
        <section className="border-t border-divider">
          <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
            <h2 className="font-serif text-3xl md:text-4xl mb-12">
              {loc === 'ar' ? 'Autres réalisations' : 'More commissions'}
            </h2>
            <div className="grid gap-8 md:grid-cols-3">
              {more.map((c, i) => (
                <FadeUp key={c.id} delay={i * 0.08}>
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
          </div>
        </section>
      )}

    </article>
  );
}
