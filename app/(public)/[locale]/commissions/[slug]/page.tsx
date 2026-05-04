import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Hero } from '@/components/site/Hero';
import { FadeUp } from '@/components/site/FadeUp';
import { CommissionCard } from '@/components/site/CommissionCard';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createAnonClient } from '@/lib/supabase/anon';
import { publicMediaUrl } from '@/lib/utils/storage';
import { pickLocale } from '@/lib/i18n/pick';
import type { Locale } from '@/lib/i18n/config';

export const revalidate = 60;

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
    .select('id, position, type, body_en, body_fr, image_url, image_url_2, alt_en, alt_fr')
    .eq('commission_id', row.id)
    .order('position');
  const { data: more } = await supabase
    .from('commissions')
    .select('id, slug, title_en, title_fr, watch_model, hero_image, card_image')
    .eq('status', 'published')
    .neq('id', row.id)
    .order('position', { ascending: true })
    .limit(3);
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
  return { row, gallery: gallery ?? [], blocks: (blocks ?? []) as Block[], more: more ?? [] };
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
  const body = pickLocale(row, 'body', loc);
  const heroUrl = publicMediaUrl(row.hero_image);

  return (
    <article>
      <Hero image={heroUrl ?? undefined} alt={title}>
        <FadeUp>
          {row.watch_model && (
            <p className="text-xs uppercase tracking-[0.3em] text-accent">{row.watch_model}</p>
          )}
          <h1 className="font-serif text-5xl md:text-7xl mt-4 max-w-4xl tracking-tight leading-[1.05]">
            {title}
          </h1>
          {summary && <p className="mt-6 max-w-xl text-lg text-text-muted">{summary}</p>}
        </FadeUp>
      </Hero>

      {blocks.length > 0 ? (
        <div className="py-24 md:py-32 grid gap-20">
          {blocks.map((block) => {
            if (block.type === 'paragraph') {
              const text = pickLocale(block, 'body', loc);
              if (!text) return null;
              return (
                <section key={block.id} className="mx-auto max-w-3xl px-6">
                  <FadeUp>
                    <div className="font-serif text-2xl md:text-3xl leading-snug whitespace-pre-line">
                      {text}
                    </div>
                  </FadeUp>
                </section>
              );
            }
            if (block.type === 'image') {
              const url = publicMediaUrl(block.image_url);
              if (!url) return null;
              const alt = pickLocale(block, 'alt', loc) ?? title;
              return (
                <section key={block.id} className="mx-auto max-w-5xl px-6">
                  <FadeUp>
                    <div className="relative aspect-[3/2] bg-bg-secondary overflow-hidden">
                      <Image src={url} alt={alt} fill quality={90} className="object-cover" sizes="(min-width: 1024px) 1024px, 100vw" />
                    </div>
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
                        <div className="relative aspect-[3/4] bg-bg-secondary overflow-hidden">
                          <Image src={url1} alt={alt} fill quality={90} className="object-cover" sizes="(min-width: 768px) 50vw, 100vw" />
                        </div>
                      )}
                      {url2 && (
                        <div className="relative aspect-[3/4] bg-bg-secondary overflow-hidden">
                          <Image src={url2} alt={alt} fill quality={90} className="object-cover" sizes="(min-width: 768px) 50vw, 100vw" />
                        </div>
                      )}
                    </div>
                  </FadeUp>
                </section>
              );
            }
            return null;
          })}
        </div>
      ) : (
        body && (
          <section className="mx-auto max-w-3xl px-6 py-24 md:py-32">
            <FadeUp>
              <div className="font-serif text-2xl md:text-3xl leading-snug whitespace-pre-line">
                {body}
              </div>
            </FadeUp>
          </section>
        )
      )}

      {gallery.length > 0 && (
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

      <section className="border-t border-divider mx-auto max-w-7xl px-6 py-24 md:py-32 text-center">
        <h2 className="font-serif text-4xl md:text-5xl">
          {loc === 'ar' ? 'Une réalisation similaire vous intéresse ?' : 'Considering a similar commission?'}
        </h2>
        <Link
          href={`/${loc}/contact`}
          className="inline-block mt-10 border border-accent px-10 py-4 text-xs uppercase tracking-[0.25em] text-accent hover:bg-accent hover:text-bg-primary transition-colors"
        >
          {loc === 'ar' ? 'Contacter l\'atelier' : 'Contact the atelier'}
        </Link>
      </section>
    </article>
  );
}
