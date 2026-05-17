import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { createClient } from '@/lib/supabase/server';
import { InviteActions } from '@/components/admin/InviteActions';

export const dynamic = 'force-dynamic';

type Invite = {
  id: string;
  token: string;
  label: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  max_uses: number | null;
  used_count: number;
  expires_at: string;
  is_revoked: boolean;
  created_at: string;
};

type Use = {
  id: string;
  used_at: string;
  ip_hash: string | null;
  user_agent: string | null;
};

type Enquiry = {
  id: string;
  name: string;
  email: string;
  message: string;
  status: string;
  created_at: string;
};

export default async function InviteDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = (await createClient()) as any;
  const { data: invite } = await supabase
    .from('invites')
    .select('id, token, label, phone, email, notes, max_uses, used_count, expires_at, is_revoked, created_at')
    .eq('id', id)
    .maybeSingle();
  if (!invite) notFound();
  const inv = invite as Invite;

  const [{ data: usesData }, { data: enqData }] = await Promise.all([
    supabase
      .from('invite_uses')
      .select('id, used_at, ip_hash, user_agent')
      .eq('invite_id', id)
      .order('used_at', { ascending: false })
      .limit(200),
    supabase
      .from('enquiries')
      .select('id, name, email, message, status, created_at')
      .eq('invite_id', id)
      .order('created_at', { ascending: false })
      .limit(200),
  ]);
  const uses = (usesData ?? []) as Use[];
  const enquiries = (enqData ?? []) as Enquiry[];

  const uniqueDevices = new Set(uses.map((u) => u.ip_hash).filter(Boolean)).size;
  const lastUsedAt = uses[0]?.used_at ?? null;

  return (
    <>
      <AdminHeader
        title={inv.label}
        back={{ href: '/admin/invites', label: 'Invites' }}
      />
      <main className="p-10 grid gap-10">
        <InviteActions
          id={inv.id}
          token={inv.token}
          isRevoked={inv.is_revoked}
        />

        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl">
          <Stat label="Total taps" value={inv.used_count} />
          <Stat label="Unique devices" value={uniqueDevices} />
          <Stat label="Enquiries" value={enquiries.length} />
          <Stat
            label="Last tapped"
            value={lastUsedAt ? new Date(lastUsedAt).toLocaleDateString() : '—'}
          />
        </section>

        <section className="border border-divider p-6 max-w-3xl">
          <h2 className="text-xs uppercase tracking-[0.2em] text-text-muted">Details</h2>
          <dl className="mt-4 grid grid-cols-2 gap-y-3 text-sm">
            <Dt>Token</Dt><Dd className="font-mono text-xs">{inv.token}</Dd>
            <Dt>Phone</Dt><Dd>{inv.phone ?? '—'}</Dd>
            <Dt>Email</Dt><Dd>{inv.email ?? '—'}</Dd>
            <Dt>Uses</Dt><Dd>{inv.used_count} / {inv.max_uses ?? '∞'}</Dd>
            <Dt>Expires</Dt><Dd>{new Date(inv.expires_at).toLocaleString()}</Dd>
            <Dt>Created</Dt><Dd>{new Date(inv.created_at).toLocaleString()}</Dd>
            {inv.notes && (
              <>
                <Dt>Notes</Dt>
                <Dd className="whitespace-pre-line">{inv.notes}</Dd>
              </>
            )}
          </dl>
        </section>

        <section>
          <h2 className="text-xs uppercase tracking-[0.2em] text-text-muted mb-3">
            Attributed enquiries ({enquiries.length})
          </h2>
          {enquiries.length === 0 ? (
            <p className="text-text-muted text-sm">No enquiries from this invite yet.</p>
          ) : (
            <div className="border border-divider overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-bg-secondary text-text-muted text-[11px] uppercase tracking-[0.2em]">
                  <tr>
                    <th className="px-4 py-3 text-left">Received</th>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Message</th>
                    <th className="px-4 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {enquiries.map((e) => (
                    <tr key={e.id} className="border-t border-divider align-top">
                      <td className="px-4 py-3 text-text-muted whitespace-nowrap">
                        {new Date(e.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">{e.name}</td>
                      <td className="px-4 py-3">
                        <a href={`mailto:${e.email}`} className="text-accent hover:underline">{e.email}</a>
                      </td>
                      <td className="px-4 py-3 max-w-md whitespace-pre-line text-text-muted">
                        {e.message.length > 160 ? e.message.slice(0, 160) + '…' : e.message}
                      </td>
                      <td className="px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-text-muted">
                        {e.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section>
          <h2 className="text-xs uppercase tracking-[0.2em] text-text-muted mb-3">
            Tap log ({uses.length})
          </h2>
          {uses.length === 0 ? (
            <p className="text-text-muted text-sm">This invite hasn't been used yet.</p>
          ) : (
            <div className="border border-divider overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-bg-secondary text-text-muted text-[11px] uppercase tracking-[0.2em]">
                  <tr>
                    <th className="px-4 py-3 text-left">Used at</th>
                    <th className="px-4 py-3 text-left">IP (hashed)</th>
                    <th className="px-4 py-3 text-left">User-agent</th>
                  </tr>
                </thead>
                <tbody>
                  {uses.map((u) => (
                    <tr key={u.id} className="border-t border-divider">
                      <td className="px-4 py-3 text-text-muted whitespace-nowrap">
                        {new Date(u.used_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-mono text-[10px] text-text-muted">{u.ip_hash ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-text-muted truncate max-w-[400px]">
                        {u.user_agent ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className="text-xs text-text-muted">
          <Link href="/admin/invites" className="hover:text-accent">← Back to all invites</Link>
        </p>
      </main>
    </>
  );
}

function Dt({ children }: { children: React.ReactNode }) {
  return <dt className="text-text-muted text-[11px] uppercase tracking-[0.2em]">{children}</dt>;
}
function Dd({ children, className }: { children: React.ReactNode; className?: string }) {
  return <dd className={className}>{children}</dd>;
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="border border-divider p-4">
      <p className="text-[10px] uppercase tracking-[0.3em] text-text-muted">{label}</p>
      <p className="font-serif text-3xl mt-2 leading-none">{value}</p>
    </div>
  );
}
