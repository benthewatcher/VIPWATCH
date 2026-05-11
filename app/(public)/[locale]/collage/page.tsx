import type { Metadata } from 'next';
import { CollageGrid, type CollageItem } from '@/components/site/collage/CollageGrid';
import { getCollectionImages } from '@/lib/data/collections';
import { pickLocale } from '@/lib/i18n/pick';
import { publicMediaUrl } from '@/lib/utils/storage';
import type { Locale } from '@/lib/i18n/config';

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const ar = locale === 'ar';
  return {
    title: ar ? 'الطيف — VIP WATCH' : 'Spectrum — VIP WATCH',
    description: ar
      ? 'كل الساعات في المجموعات، مرتبة بترتيب قوس قزح حسب اللون السائد.'
      : 'Every collection commission, arranged in rainbow order by dominant colour.',
  };
}

export default async function CollagePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const loc = locale as Locale;
  const rows = await getCollectionImages();

  const items: CollageItem[] = rows
    .map((r) => ({
      id: `${r.commission_id}:${r.kind}:${r.position}`,
      slug: r.slug,
      title: pickLocale(r, 'title', loc) ?? '',
      image: publicMediaUrl(r.url) ?? '',
    }))
    .filter((i) => i.image);

  return (
    <section>
      <header className="mx-auto max-w-7xl px-6 pt-16 pb-10">
        <p className="text-[11px] uppercase tracking-[0.4em] text-accent">
          {loc === 'ar' ? 'مرتَّبة بقوس قزح' : 'Arranged in rainbow'}
        </p>
        <h1 className="font-serif text-5xl md:text-7xl tracking-tight leading-[0.95] mt-3">
          {loc === 'ar' ? 'الطيف' : 'Spectrum'}
        </h1>
        <p className="mt-4 max-w-xl text-text-muted text-sm md:text-base">
          {loc === 'ar'
            ? 'كل الساعات الموجودة في مجموعاتنا، مرتَّبة حسب اللون السائد لكل صورة.'
            : 'Every commission that lives in a collection, sorted by the dominant hue of its photograph — from red, through gold and green, to violet.'}
        </p>
      </header>

      {items.length === 0 ? (
        <p className="mx-auto max-w-7xl px-6 pb-24 text-text-muted text-sm">
          {loc === 'ar' ? 'لا توجد ساعات بعد.' : 'No watches yet.'}
        </p>
      ) : (
        <CollageGrid items={items} locale={loc} />
      )}
    </section>
  );
}
