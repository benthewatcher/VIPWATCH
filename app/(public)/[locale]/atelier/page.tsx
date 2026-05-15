import Image from 'next/image';
import { getT } from '@/lib/i18n/t';
import { createClient } from '@/lib/supabase/server';
import { pickLocale } from '@/lib/i18n/pick';
import { publicMediaUrl } from '@/lib/utils/storage';
import type { Locale } from '@/lib/i18n/config';

export const revalidate = 60;

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const loc = locale as Locale;
  const t = getT(locale, 'atelier');

  const supabase = (await createClient()) as any;
  const { data: row } = await supabase
    .from('pages')
    .select(
      'hero_image, hero_image_mobile, hero_heading_en, hero_heading_fr, hero_cta_label_en, hero_cta_label_fr, body_en, body_fr',
    )
    .eq('key', 'atelier')
    .maybeSingle();

  const eyebrow = pickLocale(row, 'hero_cta_label', loc);
  const title = pickLocale(row, 'hero_heading', loc) || t('title');
  const body = pickLocale(row, 'body', loc) || t('subtitle');
  const imageUrl = publicMediaUrl(row?.hero_image ?? null);
  const imageUrlMobile = publicMediaUrl(row?.hero_image_mobile ?? null);

  return (
    <section className="mx-auto max-w-7xl px-6 py-16 md:py-24 lg:py-32">
      <div className="grid gap-10 md:gap-16 md:grid-cols-12 items-start">
        <div className="md:col-span-6 lg:col-span-5 order-2 md:order-1">
          {eyebrow && (
            <p className="text-[11px] uppercase tracking-[0.4em] text-accent">{eyebrow}</p>
          )}
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl tracking-tight leading-[1.05] mt-4">
            {title}
          </h1>
          {body && (
            <div className="mt-8 text-text-primary/85 text-[15px] md:text-base leading-[1.75] max-w-prose whitespace-pre-line space-y-4">
              {body.split(/\n{2,}/).map((para, i) => (
                <p key={i} className="whitespace-pre-line">
                  {para}
                </p>
              ))}
            </div>
          )}
        </div>

        <div className="md:col-span-6 lg:col-span-7 order-1 md:order-2">
          {imageUrl || imageUrlMobile ? (
            <div className="relative w-full aspect-[4/5] md:aspect-[3/4] lg:aspect-[4/5] overflow-hidden bg-bg-secondary">
              {imageUrlMobile && (
                <Image
                  src={imageUrlMobile}
                  alt={title}
                  fill
                  priority
                  sizes="(min-width: 1024px) 50vw, (min-width: 768px) 50vw, 100vw"
                  className="object-cover md:hidden"
                />
              )}
              {imageUrl && (
                <Image
                  src={imageUrl}
                  alt={title}
                  fill
                  priority
                  sizes="(min-width: 1024px) 50vw, (min-width: 768px) 50vw, 100vw"
                  className={`object-cover ${imageUrlMobile ? 'hidden md:block' : ''}`}
                />
              )}
            </div>
          ) : (
            <div className="relative w-full aspect-[4/5] md:aspect-[3/4] lg:aspect-[4/5] bg-bg-secondary border border-divider grid place-items-center">
              <span className="text-xs uppercase tracking-[0.3em] text-text-muted">
                Add an image in admin
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
