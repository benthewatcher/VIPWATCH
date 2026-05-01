import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import Image from 'next/image';
import { Hero } from '@/components/site/Hero';
import { FadeUp } from '@/components/site/FadeUp';
import { Link } from '@/lib/i18n/navigation';
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
    { locale: 'fr', slug: c.slug },
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
  return { row, gallery: gallery ?? [] };
}

export default async function CommissionDetail({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const result = await getCommission(slug);
  if (!result) notFound();
  const { row, gallery } = result;
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

      {body && (
        <section className="mx-auto max-w-3xl px-6 py-24 md:py-32">
          <FadeUp>
            <div className="font-serif text-2xl md:text-3xl leading-snug whitespace-pre-line">
              {body}
            </div>
          </FadeUp>
        </section>
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

      <section className="border-t border-divider mx-auto max-w-7xl px-6 py-24 md:py-32 text-center">
        <h2 className="font-serif text-4xl md:text-5xl">
          {loc === 'fr' ? 'Une réalisation similaire vous intéresse ?' : 'Considering a similar commission?'}
        </h2>
        <Link
          href="/contact"
          className="inline-block mt-10 border border-accent px-10 py-4 text-xs uppercase tracking-[0.25em] text-accent hover:bg-accent hover:text-bg-primary transition-colors"
        >
          {loc === 'fr' ? 'Contacter l\'atelier' : 'Contact the atelier'}
        </Link>
      </section>
    </article>
  );
}
