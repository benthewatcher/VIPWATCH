'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { LookbookCard } from './LookbookCard';
import { ShareWishlist } from './ShareWishlist';
import { getWishlist, subscribe } from '@/lib/wishlist/local';
import { pickLocale } from '@/lib/i18n/pick';
import { publicMediaUrl } from '@/lib/utils/storage';
import type { Locale } from '@/lib/i18n/config';

type Row = {
  id: string;
  slug: string;
  title_en: string | null;
  title_fr: string | null;
  watch_model: string | null;
  hero_image: string | null;
  card_image: string | null;
};

export function WishlistView({ locale }: { locale: Locale }) {
  const [ids, setIds] = useState<string[] | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIds(getWishlist());
    return subscribe(() => setIds(getWishlist()));
  }, []);

  useEffect(() => {
    if (ids === null) return;
    if (ids.length === 0) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const supabase = createClient() as any;
    supabase
      .from('commissions')
      .select('id, slug, title_en, title_fr, watch_model, hero_image, card_image')
      .eq('status', 'published')
      .in('id', ids)
      .then(({ data }: { data: Row[] | null }) => {
        const byId = new Map((data ?? []).map((r) => [r.id, r]));
        setRows(ids.map((id) => byId.get(id)).filter((r): r is Row => Boolean(r)));
        setLoading(false);
      });
  }, [ids]);

  return (
    <section className="mx-auto max-w-7xl px-6 py-16 md:py-24">
      <header className="mb-12 flex flex-wrap items-end justify-between gap-6">
        <h1 className="font-serif text-5xl md:text-6xl">
          {locale === 'ar' ? 'قائمة الرغبات' : 'Wishlist'}
        </h1>
        {rows.length > 0 && <ShareWishlist />}
      </header>

      {ids === null || loading ? (
        <p className="text-text-muted text-sm">
          {locale === 'ar' ? 'جارٍ التحميل…' : 'Loading…'}
        </p>
      ) : rows.length === 0 ? (
        <div>
          <p className="text-text-muted text-sm">
            {locale === 'ar' ? 'قائمتك فارغة.' : 'Your wishlist is empty.'}
          </p>
          <Link
            href={`/${locale}/lookbook`}
            className="inline-block mt-8 border border-accent px-8 py-3 text-xs uppercase tracking-[0.25em] text-accent hover:bg-accent hover:text-bg-primary transition-colors"
          >
            {locale === 'ar' ? 'تصفح كتاب الإطلالات' : 'Browse the lookbook'}
          </Link>
        </div>
      ) : (
        <div className="flex flex-wrap gap-6">
          {rows.map((c) => (
            <LookbookCard
              key={c.id}
              id={c.id}
              slug={c.slug}
              title={pickLocale(c, 'title', locale) ?? ''}
              brand={c.watch_model}
              image={publicMediaUrl(c.card_image ?? c.hero_image)}
              locale={locale}
            />
          ))}
        </div>
      )}
    </section>
  );
}
