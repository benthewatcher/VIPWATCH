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
  const t = getT(locale, 'warranty');

  const supabase = (await createClient()) as any;
  const { data: row } = await supabase
    .from('pages')
    .select('hero_image, hero_image_mobile, hero_heading_en, hero_heading_fr, body_en, body_fr')
    .eq('key', 'warranty')
    .maybeSingle();

  const title = pickLocale(row, 'hero_heading', loc) || t('title');
  const subtitle = pickLocale(row, 'body', loc) || t('subtitle');
  const heroUrl = publicMediaUrl(row?.hero_image ?? null);
  const heroUrlMobile = publicMediaUrl(row?.hero_image_mobile ?? null);

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
    </>
  );
}
