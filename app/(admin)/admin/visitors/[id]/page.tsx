import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { createClient } from '@/lib/supabase/server';
import { VisitorCompose } from '@/components/admin/VisitorCompose';

export const dynamic = 'force-dynamic';

type Visitor = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  invite_id: string | null;
  referred_by_name: string | null;
  shared_wishlist_id: string | null;
  first_seen_at: string;
  last_seen_at: string;
};

type Note = {
  id: string;
  subject: string | null;
  body: string;
  sent_email: boolean;
  sent_banner: boolean;
  sent_sms: boolean;
  email_sent_at: string | null;
  sms_sent_at: string | null;
  read_at: string | null;
  created_at: string;
  email_delivered_at: string | null;
  email_opened_at: string | null;
  email_clicked_at: string | null;
  email_bounced_at: string | null;
  sms_status: string | null;
  sms_delivered_at: string | null;
  sms_failed_reason: string | null;
};

type Event = {
  id: string;
  event_type: string;
  path: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type WishlistRow = {
  commission_id: string;
  added_at: string;
  removed_at: string | null;
  commissions: { slug: string; title_en: string | null } | null;
};

export default async function VisitorDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = (await createClient()) as any;

  const { data: visitor } = await supabase
    .from('visitors')
    .select('id, name, email, phone, invite_id, referred_by_name, shared_wishlist_id, first_seen_at, last_seen_at')
    .eq('id', id)
    .maybeSingle();
  if (!visitor) notFound();
  const v = visitor as Visitor;

  const { data: notesData } = await supabase
    .from('visitor_notifications')
    .select('id, subject, body, sent_email, sent_banner, sent_sms, email_sent_at, sms_sent_at, read_at, created_at, email_delivered_at, email_opened_at, email_clicked_at, email_bounced_at, sms_status, sms_delivered_at, sms_failed_reason')
    .eq('visitor_id', id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  const notes = (notesData ?? []) as Note[];

  const { data: eventsData } = await supabase
    .from('visitor_events')
    .select('id, event_type, path, metadata, created_at')
    .eq('visitor_id', id)
    .order('created_at', { ascending: false })
    .limit(200);
  const events = (eventsData ?? []) as Event[];

  const { data: wishlistData } = await supabase
    .from('wishlist_items')
    .select('commission_id, added_at, removed_at, commissions ( slug, title_en )')
    .eq('visitor_id', id)
    .order('added_at', { ascending: false });
  const wishlist = (wishlistData ?? []) as unknown as WishlistRow[];
  const activeWishlist = wishlist.filter((w) => !w.removed_at);

  let inviteLabel: string | null = null;
  if (v.invite_id) {
    const { data: invite } = await supabase
      .from('invites')
      .select('label')
      .eq('id', v.invite_id)
      .maybeSingle();
    inviteLabel = (invite as { label: string } | null)?.label ?? null;
  }

  return (
    <>
      <AdminHeader
        title={v.name ?? 'Unnamed visitor'}
        back={{ href: '/admin/visitors', label: 'Visitors' }}
      />
      <main className="p-10 grid gap-10">
        <section className="border border-divider p-6 max-w-3xl">
          <h2 className="text-xs uppercase tracking-[0.2em] text-text-muted">Details</h2>
          <dl className="mt-4 grid grid-cols-2 gap-y-3 text-sm">
            <Dt>Email</Dt>
            <Dd>
              {v.email ? (
                <a href={`mailto:${v.email}`} className="text-accent hover:underline">{v.email}</a>
              ) : (
                <span className="text-text-muted">—</span>
              )}
            </Dd>
            <Dt>Phone</Dt>
            <Dd>
              {v.phone ? (
                <a href={`tel:${v.phone}`} className="text-accent hover:underline">{v.phone}</a>
              ) : (
                <span className="text-text-muted">—</span>
              )}
            </Dd>
            <Dt>Referred by</Dt>
            <Dd>
              {v.referred_by_name ?? inviteLabel ?? <span className="text-text-muted">—</span>}
            </Dd>
            <Dt>First seen</Dt><Dd>{new Date(v.first_seen_at).toLocaleString()}</Dd>
            <Dt>Last seen</Dt><Dd>{new Date(v.last_seen_at).toLocaleString()}</Dd>
            {v.invite_id && (
              <>
                <Dt>Invite</Dt>
                <Dd>
                  <Link href={`/admin/invites/${v.invite_id}`} className="text-accent hover:underline">
                    {inviteLabel ?? 'view invite'}
                  </Link>
                </Dd>
              </>
            )}
          </dl>
        </section>

        <VisitorCompose visitorId={v.id} hasEmail={!!v.email} hasPhone={!!v.phone} />

        <section>
          <h2 className="text-xs uppercase tracking-[0.2em] text-text-muted mb-3">
            Wishlist ({activeWishlist.length})
          </h2>
          {activeWishlist.length === 0 ? (
            <p className="text-text-muted text-sm">Nothing hearted yet.</p>
          ) : (
            <ul className="grid gap-2 text-sm">
              {activeWishlist.map((w) => (
                <li key={w.commission_id} className="border border-divider px-4 py-2 flex justify-between items-baseline gap-4">
                  <Link
                    href={`/admin/commissions/${w.commission_id}`}
                    className="text-accent hover:underline"
                  >
                    {w.commissions?.title_en ?? w.commission_id}
                  </Link>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted">
                    {new Date(w.added_at).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="text-xs uppercase tracking-[0.2em] text-text-muted mb-3">
            Journey ({events.length})
          </h2>
          {events.length === 0 ? (
            <p className="text-text-muted text-sm">No events yet.</p>
          ) : (
            <ol className="grid gap-2 text-sm font-mono">
              {events.map((e) => (
                <li key={e.id} className="border-l-2 border-divider pl-4 py-1">
                  <div className="flex flex-wrap gap-4 items-baseline">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted whitespace-nowrap">
                      {new Date(e.created_at).toLocaleString()}
                    </span>
                    <span className="text-accent">{e.event_type}</span>
                    {e.path && <span className="text-text-muted truncate">{e.path}</span>}
                  </div>
                  {e.metadata && Object.keys(e.metadata).length > 0 && (
                    <pre className="mt-1 text-[10px] text-text-muted/70 whitespace-pre-wrap break-all">
                      {JSON.stringify(e.metadata)}
                    </pre>
                  )}
                </li>
              ))}
            </ol>
          )}
        </section>

        <section>
          <h2 className="text-xs uppercase tracking-[0.2em] text-text-muted mb-3">
            Messages sent ({notes.length})
          </h2>
          {notes.length === 0 ? (
            <p className="text-text-muted text-sm">No messages yet.</p>
          ) : (
            <div className="grid gap-3">
              {notes.map((n) => (
                <article key={n.id} className="border border-divider p-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-3 text-[10px] uppercase tracking-[0.25em] text-text-muted">
                    <span>{new Date(n.created_at).toLocaleString()}</span>
                    <span className="flex gap-3">
                      {n.sent_email && (
                        <span className={n.email_bounced_at ? 'text-red-400' : n.email_opened_at ? 'text-accent' : 'text-text-muted'}>
                          Email{' '}
                          {n.email_bounced_at
                            ? 'bounced'
                            : n.email_clicked_at
                              ? 'clicked'
                              : n.email_opened_at
                                ? 'opened'
                                : n.email_delivered_at
                                  ? 'delivered'
                                  : 'sent'}
                        </span>
                      )}
                      {n.sent_sms && (
                        <span className={n.sms_failed_reason ? 'text-red-400' : n.sms_delivered_at ? 'text-accent' : 'text-text-muted'}>
                          SMS {n.sms_failed_reason ? `failed (${n.sms_failed_reason})` : (n.sms_status ?? 'sent')}
                        </span>
                      )}
                      {n.sent_banner && (
                        <span className={n.read_at ? 'text-text-muted' : 'text-accent'}>
                          {n.read_at ? `Banner read ${new Date(n.read_at).toLocaleDateString()}` : 'Banner pending'}
                        </span>
                      )}
                    </span>
                  </div>
                  {n.subject && <p className="mt-3 font-medium">{n.subject}</p>}
                  <p className="mt-2 whitespace-pre-line text-sm">{n.body}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}

function Dt({ children }: { children: React.ReactNode }) {
  return <dt className="text-text-muted text-[11px] uppercase tracking-[0.2em]">{children}</dt>;
}
function Dd({ children }: { children: React.ReactNode }) {
  return <dd>{children}</dd>;
}
