import { AdminHeader } from '@/components/admin/AdminHeader';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Enquiries' };
export const dynamic = 'force-dynamic';

type Row = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  country: string | null;
  watch_brand: string | null;
  watch_model: string | null;
  message: string;
  status: string;
  created_at: string;
};

export default async function EnquiriesPage() {
  const supabase = (await createClient()) as any;
  const { data } = await supabase
    .from('enquiries')
    .select('id, name, email, phone, country, watch_brand, watch_model, message, status, created_at')
    .order('created_at', { ascending: false })
    .limit(200);
  const rows = (data ?? []) as Row[];

  return (
    <>
      <AdminHeader title="Enquiries" />
      <main className="p-10">
        {rows.length === 0 ? (
          <p className="text-text-muted text-sm">No enquiries yet.</p>
        ) : (
          <div className="border border-divider overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-secondary text-text-muted text-[11px] uppercase tracking-[0.2em]">
                <tr>
                  <th className="px-4 py-3 text-left">Received</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Watch</th>
                  <th className="px-4 py-3 text-left">Message</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-divider align-top">
                    <td className="px-4 py-3 text-text-muted whitespace-nowrap">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div>{r.name}</div>
                      {r.country && <div className="text-[10px] text-text-muted">{r.country}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <a href={`mailto:${r.email}`} className="text-accent hover:underline">{r.email}</a>
                      {r.phone && <div className="text-[10px] text-text-muted mt-1">{r.phone}</div>}
                    </td>
                    <td className="px-4 py-3 text-text-muted">
                      {[r.watch_brand, r.watch_model].filter(Boolean).join(' ') || '—'}
                    </td>
                    <td className="px-4 py-3 max-w-md whitespace-pre-line">{r.message}</td>
                    <td className="px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-text-muted">{r.status}</td>
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
