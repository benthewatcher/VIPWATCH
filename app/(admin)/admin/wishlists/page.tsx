import Link from 'next/link';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Shared wishlists' };
export const dynamic = 'force-dynamic';

type Row = {
  id: string;
  token: string;
  title: string | null;
  sharer_name: string | null;
  sharer_email: string | null;
  commission_ids: string[];
  invite_id: string | null;
  view_count: number;
  last_viewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export default async function WishlistsPage() {
  const supabase = (await createClient()) as any;
  const { data } = await supabase
    .from('shared_wishlists')
    .select(
      'id, token, title, sharer_name, sharer_email, commission_ids, invite_id, view_count, last_viewed_at, created_at, updated_at',
    )
    .order('updated_at', { ascending: false })
    .limit(200);
  const rows = (data ?? []) as Row[];

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
      <AdminHeader title="Shared wishlists" />
      <main className="p-10">
        <p className="text-xs text-text-muted mb-6 max-w-2xl">
          Lists curated by invited visitors and shared via private URLs. Each row
          increments as recipients open the link. Click a row to view what they see.
        </p>

        {rows.length === 0 ? (
          <p className="text-text-muted text-sm">No shared wishlists yet.</p>
        ) : (
          <div className="border border-divider overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-secondary text-text-muted text-[11px] uppercase tracking-[0.2em]">
                <tr>
                  <th className="px-4 py-3 text-left">Updated</th>
                  <th className="px-4 py-3 text-left">Shared by</th>
                  <th className="px-4 py-3 text-left">Title</th>
                  <th className="px-4 py-3 text-left">Items</th>
                  <th className="px-4 py-3 text-left">Via invite</th>
                  <th className="px-4 py-3 text-left">Views</th>
                  <th className="px-4 py-3 text-left">Last viewed</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const inviteLabel = r.invite_id ? inviteLabels.get(r.invite_id) : null;
                  return (
                    <tr key={r.id} className="border-t border-divider align-top">
                      <td className="px-4 py-3 text-text-muted whitespace-nowrap">
                        {new Date(r.updated_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div>{r.sharer_name ?? <span className="text-text-muted">—</span>}</div>
                        {r.sharer_email && (
                          <a
                            href={`mailto:${r.sharer_email}`}
                            className="text-[10px] text-accent hover:underline"
                          >
                            {r.sharer_email}
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div>{r.title ?? <span className="text-text-muted">—</span>}</div>
                        <code className="text-[10px] font-mono text-text-muted">/{r.token}</code>
                      </td>
                      <td className="px-4 py-3 text-text-muted">{r.commission_ids.length}</td>
                      <td className="px-4 py-3 text-[11px]">
                        {r.invite_id && inviteLabel ? (
                          <Link href={`/admin/invites/${r.invite_id}`} className="text-accent hover:underline">
                            {inviteLabel}
                          </Link>
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-text-muted">{r.view_count}</td>
                      <td className="px-4 py-3 text-text-muted whitespace-nowrap">
                        {r.last_viewed_at ? new Date(r.last_viewed_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <Link
                          href={`/wishlist/${r.token}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs uppercase tracking-[0.2em] text-text-muted hover:text-accent"
                        >
                          View →
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
