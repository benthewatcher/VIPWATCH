import { AdminHeader } from '@/components/admin/AdminHeader';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Team' };
export const dynamic = 'force-dynamic';

type Row = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
};

export default async function TeamPage() {
  const supabase = (await createClient()) as any;
  const { data } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, created_at')
    .order('created_at', { ascending: true });
  const rows = (data ?? []) as Row[];

  return (
    <>
      <AdminHeader title="Team" />
      <main className="p-10">
        <p className="text-xs text-text-muted mb-6 max-w-xl">
          Anyone with a row here can sign in to /admin. To add a new admin, invite them via
          Supabase → Authentication → Users, then add their row to the
          <code className="px-1.5 py-0.5 bg-bg-secondary border border-divider mx-1 text-xs">profiles</code>
          table with role <code>owner</code> or <code>editor</code>.
        </p>

        {rows.length === 0 ? (
          <p className="text-text-muted text-sm">No team members yet.</p>
        ) : (
          <div className="border border-divider">
            <table className="w-full text-sm">
              <thead className="bg-bg-secondary text-text-muted text-[11px] uppercase tracking-[0.2em]">
                <tr>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-left">Added</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-divider">
                    <td className="px-4 py-3">{r.email}</td>
                    <td className="px-4 py-3 text-text-muted">{r.full_name ?? '—'}</td>
                    <td className="px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-accent">{r.role}</td>
                    <td className="px-4 py-3 text-text-muted whitespace-nowrap">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
