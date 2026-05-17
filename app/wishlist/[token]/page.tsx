import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient as createSb } from '@supabase/supabase-js';
import { CommissionCardVisual } from '@/components/site/CommissionCardVisual';
import { pickLocale } from '@/lib/i18n/pick';
import { publicMediaUrl } from '@/lib/utils/storage';

export const dynamic = 'force-dynamic';

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createSb(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

type Shared = {
  token: string;
  title: string | null;
  message: string | null;
  sharer_name: string | null;
  sharer_email: string | null;
  commission_ids: string[];
  created_at: string;
  updated_at: string;
};

type Commission = {
  id: string;
  slug: string;
  title_en: string | null;
  title_fr: string | null;
  watch_model: string | null;
  hero_image: string | null;
  card_image: string | null;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const supabase = serviceClient() as any;
  const { data } = await supabase
    .from('shared_wishlists')
    .select('title, sharer_name, commission_ids')
    .eq('token', token)
    .maybeSingle();
  const row = data as Pick<Shared, 'title' | 'sharer_name' | 'commission_ids'> | null;
  const count = row?.commission_ids?.length ?? 0;
  const title = row?.title || (row?.sharer_name ? `${row.sharer_name}'s selection` : 'A shared selection');
  return {
    title: `${title} — VIP WATCH`,
    description: `${count} piece${count === 1 ? '' : 's'} shared from the atelier.`,
    robots: { index: false, follow: false },
  };
}

export default async function SharedWishlist({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = serviceClient() as any;

  const { data: shared } = await supabase
    .from('shared_wishlists')
    .select('token, title, message, sharer_name, sharer_email, commission_ids, created_at, updated_at')
    .eq('token', token)
    .maybeSingle();
  if (!shared) notFound();
  const s = shared as Shared;

  // Increment view count (best effort, non-blocking).
  supabase.rpc('increment_shared_wishlist_view', { _token: token }).then(() => {});

  let commissions: Commission[] = [];
  if (s.commission_ids.length > 0) {
    const { data } = await supabase
      .from('commissions')
      .select('id, slug, title_en, title_fr, watch_model, hero_image, card_image')
      .eq('status', 'published')
      .in('id', s.commission_ids);
    const byId = new Map(((data ?? []) as Commission[]).map((c) => [c.id, c]));
    commissions = s.commission_ids.map((id) => byId.get(id)).filter((c): c is Commission => Boolean(c));
  }

  const subjectLine = encodeURIComponent(
    `Re: ${s.title || 'your VIP WATCH selection'}`,
  );
  const replyBody = encodeURIComponent(
    `Hello ${s.sharer_name ?? ''},\n\nAbout your selection of ${commissions.length} piece${commissions.length === 1 ? '' : 's'}…\n\n`,
  );
  const replyHref = s.sharer_email
    ? `mailto:${s.sharer_email}?subject=${subjectLine}&body=${replyBody}`
    : null;

  return (
    <main className="min-h-screen bg-bg-primary text-text-primary">
      <header className="border-b border-divider">
        <div className="mx-auto max-w-7xl px-6 py-12 md:py-16">
          <p className="text-[11px] uppercase tracking-[0.4em] text-accent">
            {s.sharer_name ? `Shared by ${s.sharer_name}` : 'A shared selection'}
          </p>
          <h1 className="font-serif text-4xl md:text-6xl tracking-tight mt-4 leading-[1.05]">
            {s.title || 'A selection'}
          </h1>
          {s.message && (
            <p className="mt-6 max-w-2xl text-text-primary/85 text-base md:text-lg leading-relaxed whitespace-pre-line">
              {s.message}
            </p>
          )}
          <p className="mt-6 text-[11px] uppercase tracking-[0.25em] text-text-muted">
            {commissions.length} piece{commissions.length === 1 ? '' : 's'} ·
            {' '}Last updated {new Date(s.updated_at).toLocaleDateString()}
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-16">
        {commissions.length === 0 ? (
          <p className="text-text-muted text-sm">This selection is empty.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {commissions.map((c) => {
              const title = pickLocale(c, 'title', 'en') ?? '';
              return (
                <Link
                  key={c.id}
                  href={`/en/commissions/${c.slug}`}
                  className="group block"
                >
                  <CommissionCardVisual
                    title={title}
                    image={publicMediaUrl(c.card_image ?? c.hero_image)}
                  />
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <footer className="border-t border-divider">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          {replyHref ? (
            <>
              <p className="text-[11px] uppercase tracking-[0.4em] text-accent">
                Reply to {s.sharer_name ?? 'sender'}
              </p>
              <h2 className="font-serif text-3xl md:text-4xl mt-4 tracking-tight">
                Continue the conversation
              </h2>
              <a
                href={replyHref}
                className="inline-block mt-8 border border-accent px-10 py-4 text-xs uppercase tracking-[0.25em] text-accent hover:bg-accent hover:text-bg-primary transition-colors"
              >
                Send a message
              </a>
            </>
          ) : (
            <>
              <p className="text-[11px] uppercase tracking-[0.4em] text-accent">VIP WATCH</p>
              <h2 className="font-serif text-3xl md:text-4xl mt-4 tracking-tight">
                Begin a commission
              </h2>
              <Link
                href="/en/contact"
                className="inline-block mt-8 border border-accent px-10 py-4 text-xs uppercase tracking-[0.25em] text-accent hover:bg-accent hover:text-bg-primary transition-colors"
              >
                Send us a message
              </Link>
            </>
          )}
        </div>
      </footer>
    </main>
  );
}
