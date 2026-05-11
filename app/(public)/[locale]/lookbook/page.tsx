import type { Metadata } from 'next';
import { LookbookSection } from '@/components/site/lookbook/LookbookSection';
import { getLookbookCollections } from '@/lib/data/collections';
import { pickLocale } from '@/lib/i18n/pick';
import { publicMediaUrl, mobileCoverUrl } from '@/lib/utils/storage';
import type { Locale } from '@/lib/i18n/config';

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const title = locale === 'ar' ? 'كتاب الإطلالات — VIP WATCH' : 'Lookbook — VIP WATCH';
  const description =
    locale === 'ar'
      ? 'مجموعات مختارة من الأعمال السرية.'
      : 'Cinematic collections from the atelier.';
  return {
    title,
    description,
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: { index: false, follow: false, noimageindex: true },
    },
    openGraph: { type: 'website', title, description, url: `/${locale}/lookbook`, locale },
  };
}

export default async function LookbookPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const loc = locale as Locale;

  const collections = await getLookbookCollections();

  return (
    <>
      {collections.length === 0 ? (
        <section className="min-h-[60vh] grid place-items-center px-6">
          <p className="text-text-muted text-sm uppercase tracking-[0.2em]">
            {loc === 'ar' ? 'لا توجد مجموعات منشورة بعد.' : 'No collections published yet.'}
          </p>
        </section>
      ) : (
        collections.map((c) => (
          <LookbookSection
            key={c.id}
            name={pickLocale(c, 'name', loc) ?? ''}
            project={pickLocale(c, 'project', loc)}
            description={pickLocale(c, 'description', loc)}
            videoUrl={publicMediaUrl(c.hero_video)}
            posterUrl={publicMediaUrl(c.cover_image)}
            posterUrlMobile={mobileCoverUrl(c.cover_image, c.cover_image_mobile)}
            locale={loc}
            commissions={c.commissions.map((com) => ({
              id: com.id,
              slug: com.slug,
              title: pickLocale(com, 'title', loc) ?? '',
              brand: com.watch_model,
              image: publicMediaUrl(com.card_image ?? com.hero_image),
            }))}
          />
        ))
      )}
    </>
  );
}
