import type { Metadata } from 'next';
import Link from 'next/link';
import { headers, cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { createClient as createSb } from '@supabase/supabase-js';
import { CommissionCardVisual } from '@/components/site/CommissionCardVisual';
import { pickLocale } from '@/lib/i18n/pick';
import { publicMediaUrl } from '@/lib/utils/storage';
import { COOKIE_NAME, verifySessionCookie, createSessionCookie } from '@/lib/auth/invite-session';
import { createVisitor } from '@/lib/auth/visitor';

// Shared wishlists double as forwardable invites: tapping this URL admits the
// visitor via the SHARER's invite (consumes one use). When the sharer's
// invite is dead, we bounce to /waitlist — no read-only teaser.

export const dynamic = 'force-dynamic';

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createSb(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

type Shared = {
  id: string;
  token: string;
  title: string | null;
  message: string | null;
  sharer_name: string | null;
  sharer_email: string | null;
  commission_ids: string[];
  invite_id: string | null;
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
    .select('id, token, title, message, sharer_name, sharer_email, commission_ids, invite_id, created_at, updated_at')
    .eq('token', token)
    .maybeSingle();
  if (!shared) notFound();
  const s = shared as Shared;

  // Does the visitor already have a session?
  const cookieStore = await cookies();
  const existing = await verifySessionCookie(cookieStore.get(COOKIE_NAME)?.value);

  if (!existing) {
    // First-time viewer. Admit via the SHARER's invite, if valid.
    if (!s.invite_id) redirect('/waitlist?reason=invalid');

    const { data: inviteRow } = await supabase
      .from('invites')
      .select('id, is_revoked, expires_at, max_uses, used_count, label')
      .eq('id', s.invite_id)
      .maybeSingle();
    if (!inviteRow) redirect('/waitlist?reason=invalid');
    const invite = inviteRow as {
      id: string;
      is_revoked: boolean;
      expires_at: string;
      max_uses: number | null;
      used_count: number;
      label: string;
    };
    if (invite.is_revoked) redirect('/waitlist?reason=revoked');
    if (new Date(invite.expires_at).getTime() < Date.now()) redirect('/waitlist?reason=expired');
    if (typeof invite.max_uses === 'number' && invite.used_count >= invite.max_uses) {
      redirect('/waitlist?reason=used');
    }

    const hdrs = await headers();
    const ip = hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '';
    const ua = hdrs.get('user-agent') ?? '';

    const visitor = await createVisitor({
      inviteId: invite.id,
      referredByName: s.sharer_name ?? invite.label,
      sharedWishlistId: s.id,
      ip,
      userAgent: ua,
    });

    await supabase.from('invite_uses').insert({
      invite_id: invite.id,
      ip_hash: null,
      user_agent: ua.slice(0, 500),
    });
    const rpc = await supabase.rpc('increment_invite_used', { _invite_id: invite.id });
    if (rpc.error) {
      await supabase.from('invites').update({ used_count: invite.used_count + 1 }).eq('id', invite.id);
    }

    supabase.rpc('increment_shared_wishlist_view', { _token: token }).then(() => {});

    const cookie = await createSessionCookie(invite.id, visitor?.id ?? null);
    cookieStore.set(cookie);
    redirect(`/welcome?next=${encodeURIComponent('/wishlist/' + token)}`);
  }

  // Already signed in — just bump the view counter.
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

  const subjectLine = encodeURIComponent(`Re: ${s.title || 'your VIP WATCH selection'}`);
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
                <Link key={c.id} href={`/en/commissions/${c.slug}`} className="group block">
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
