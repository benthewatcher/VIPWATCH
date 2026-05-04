import { getT } from '@/lib/i18n/t';
import { PageHeader } from '@/components/site/PageHeader';
import { CommissionCard } from '@/components/site/CommissionCard';
import { FadeUp } from '@/components/site/FadeUp';
import { createClient } from '@/lib/supabase/server';
import { publicMediaUrl } from '@/lib/utils/storage';
import { pickLocale } from '@/lib/i18n/pick';
import type { Locale } from '@/lib/i18n/config';

export const revalidate = 60;

async function getCommissions() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('commissions')
    .select('id, slug, card_image, hero_image, title_en, title_fr, watch_model')
    .eq('status', 'published')
    .order('position', { ascending: true })
    .order('published_at', { ascending: false });
  return data ?? [];
}

export default async function CommissionsIndex({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const items = await getCommissions();
  return <Content locale={locale as Locale} items={items} />;
}

function Content({
  locale,
  items,
}: {
  locale: Locale;
  items: Array<{ id: string; slug: string; card_image: string | null; hero_image: string | null; title_en: string; title_fr: string; watch_model: string | null }>;
}) {
  const t = getT(locale, 'commissions');
  return (
    <>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />
      <section className="mx-auto max-w-7xl px-6 pb-32">
        {items.length === 0 ? (
          <p className="text-text-muted">No commissions published yet.</p>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {items.map((c, i) => (
              <FadeUp key={c.id} delay={(i % 3) * 0.08}>
                <CommissionCard
                  slug={c.slug}
                  title={pickLocale(c, 'title', locale) ?? ''}
                  brand={c.watch_model}
                  image={publicMediaUrl(c.card_image ?? c.hero_image)}
                />
              </FadeUp>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
