import Link from 'next/link';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { createClient } from '@/lib/supabase/server';
import { NewInviteForm } from '@/components/admin/NewInviteForm';

export const metadata = { title: 'Invites' };
export const dynamic = 'force-dynamic';

type Row = {
  id: string;
  token: string;
  label: string;
  phone: string | null;
  email: string | null;
  max_uses: number | null;
  used_count: number;
  expires_at: string;
  is_revoked: boolean;
  created_at: string;
};

export default async function InvitesPage() {
  const supabase = (await createClient()) as any;
  const { data } = await supabase
    .from('invites')
    .select('id, token, label, phone, email, max_uses, used_count, expires_at, is_revoked, created_at')
    .order('created_at', { ascending: false });
  const rows = (data ?? []) as Row[];

  // Conversion counts per invite — enquiries stamped with invite_id.
  const enquiryCounts = new Map<string, number>();
  if (rows.length > 0) {
    const { data: enq } = await supabase
      .from('enquiries')
      .select('invite_id')
      .in('invite_id', rows.map((r) => r.id))
      .not('invite_id', 'is', null);
    for (const e of ((enq ?? []) as Array<{ invite_id: string }>)) {
      enquiryCounts.set(e.invite_id, (enquiryCounts.get(e.invite_id) ?? 0) + 1);
    }
  }

  const now = Date.now();

  return (
    <>
      <AdminHeader title="Invites" />
      <main className="p-10 grid gap-10">
        <NewInviteForm />

        {rows.length === 0 ? (
          <p className="text-text-muted text-sm">No invites yet.</p>
        ) : (
          <div className="border border-divider overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-secondary text-text-muted text-[11px] uppercase tracking-[0.2em]">
                <tr>
                  <th className="px-4 py-3 text-left">Label</th>
                  <th className="px-4 py-3 text-left">Link</th>
                  <th className="px-4 py-3 text-left">Phone</th>
                  <th className="px-4 py-3 text-left">Taps</th>
                  <th className="px-4 py-3 text-left">Enquiries</th>
                  <th className="px-4 py-3 text-left">Expires</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const expired = new Date(r.expires_at).getTime() < now;
                  const exhausted = typeof r.max_uses === 'number' && r.used_count >= r.max_uses;
                  const status = r.is_revoked
                    ? { label: 'Revoked', tone: 'text-red-400' }
                    : expired
                      ? { label: 'Expired', tone: 'text-text-muted' }
                      : exhausted
                        ? { label: 'Used up', tone: 'text-text-muted' }
                        : { label: 'Active', tone: 'text-accent' };
                  return (
                    <tr key={r.id} className="border-t border-divider align-top">
                      <td className="px-4 py-3">
                        <Link href={`/admin/invites/${r.id}`} className="hover:text-accent">
                          {r.label}
                        </Link>
                        {r.email && <div className="text-[10px] text-text-muted">{r.email}</div>}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-text-muted">
                        /i/{r.token}
                      </td>
                      <td className="px-4 py-3 text-text-muted">{r.phone ?? '—'}</td>
                      <td className="px-4 py-3 text-text-muted">
                        {r.used_count}
                        {' / '}
                        {r.max_uses ?? '∞'}
                      </td>
                      <td className="px-4 py-3">
                        {(() => {
                          const n = enquiryCounts.get(r.id) ?? 0;
                          return (
                            <span className={n > 0 ? 'text-accent font-medium' : 'text-text-muted'}>
                              {n}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3 text-text-muted whitespace-nowrap">
                        {new Date(r.expires_at).toLocaleDateString()}
                      </td>
                      <td className={`px-4 py-3 text-[10px] uppercase tracking-[0.2em] ${status.tone}`}>
                        {status.label}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/admin/invites/${r.id}`} className="text-xs uppercase tracking-[0.2em] text-text-muted hover:text-accent">
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
