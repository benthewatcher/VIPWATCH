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
  email_sent_at: string | null;
  read_at: string | null;
  created_at: string;
};

export default async function VisitorDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = (await createClient()) as any;

  const { data: visitor } = await supabase
    .from('visitors')
    .select('id, name, email, invite_id, referred_by_name, shared_wishlist_id, first_seen_at, last_seen_at')
    .eq('id', id)
    .maybeSingle();
  if (!visitor) notFound();
  const v = visitor as Visitor;

  const { data: notesData } = await supabase
    .from('visitor_notifications')
    .select('id, subject, body, sent_email, sent_banner, email_sent_at, read_at, created_at')
    .eq('visitor_id', id)
    .order('created_at', { ascending: false });
  const notes = (notesData ?? []) as Note[];

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

        <VisitorCompose visitorId={v.id} hasEmail={!!v.email} />

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
                        <span className="text-accent">Email sent</span>
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
