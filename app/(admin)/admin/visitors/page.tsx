import Link from 'next/link';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Visitors' };
export const dynamic = 'force-dynamic';

type Visitor = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  invite_id: string | null;
  referred_by_name: string | null;
  first_seen_at: string;
  last_seen_at: string;
};

export default async function VisitorsPage() {
  const supabase = (await createClient()) as any;
  const { data } = await supabase
    .from('visitors')
    .select('id, name, email, phone, invite_id, referred_by_name, first_seen_at, last_seen_at')
    .order('last_seen_at', { ascending: false })
    .limit(500);
  const rows = (data ?? []) as Visitor[];

  // Pull invite labels for attribution.
  const inviteIds = Array.from(new Set(rows.map((r) => r.invite_id).filter((v): v is string => !!v)));
  const inviteLabels = new Map<string, string>();
  if (inviteIds.length > 0) {
    const { data: invites } = await supabase
      .from('invites')
      .select('id, label')
      .in('id', inviteIds);
    for (const inv of ((invites ?? []) as Array<{ id: string; label: string }>)) {
      inviteLabels.set(inv.id, inv.label);
    }
  }

  return (
    <>
      <AdminHeader title="Visitors" />
      <main className="p-10">
        <p className="text-xs text-text-muted mb-6 max-w-2xl">
          Everyone who has entered a name and email at /welcome. Click a row to send them a
          message — by email and/or as an on-site note that surfaces next time they visit.
        </p>

        {rows.length === 0 ? (
          <p className="text-text-muted text-sm">No visitors yet.</p>
        ) : (
          <div className="border border-divider overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-secondary text-text-muted text-[11px] uppercase tracking-[0.2em]">
                <tr>
                  <th className="px-4 py-3 text-left">Last seen</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Invited by</th>
                  <th className="px-4 py-3 text-left">First seen</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const inviteLabel = r.invite_id ? inviteLabels.get(r.invite_id) : null;
                  return (
                    <tr key={r.id} className="border-t border-divider align-top">
                      <td className="px-4 py-3 text-text-muted whitespace-nowrap">
                        {new Date(r.last_seen_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        {r.name ? (
                          <Link href={`/admin/visitors/${r.id}`} className="hover:text-accent">
                            {r.name}
                          </Link>
                        ) : (
                          <span className="text-text-muted italic">No name yet</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {r.email ? (
                          <a href={`mailto:${r.email}`} className="text-accent hover:underline">
                            {r.email}
                          </a>
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
                        {r.phone && (
                          <div className="text-[10px] text-text-muted mt-1">{r.phone}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[11px]">
                        {r.referred_by_name ? (
                          <span>{r.referred_by_name}</span>
                        ) : inviteLabel ? (
                          <Link href={`/admin/invites/${r.invite_id}`} className="text-accent hover:underline">
                            {inviteLabel}
                          </Link>
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-text-muted whitespace-nowrap">
                        {new Date(r.first_seen_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/visitors/${r.id}`}
                          className="text-xs uppercase tracking-[0.2em] text-text-muted hover:text-accent"
                        >
                          Open →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
