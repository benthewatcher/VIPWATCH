import { AdminHeader } from '@/components/admin/AdminHeader';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Newsletter subscribers' };
export const dynamic = 'force-dynamic';

type Row = {
  id: string;
  email: string;
  locale: string;
  source: string | null;
  subscribed_at: string;
  unsubscribed_at: string | null;
  resend_contact_id: string | null;
};

export default async function NewsletterPage() {
  const supabase = (await createClient()) as any;
  const { data } = await supabase
    .from('newsletter_subscribers')
    .select('id, email, locale, source, subscribed_at, unsubscribed_at, resend_contact_id')
    .order('subscribed_at', { ascending: false })
    .limit(500);
  const rows = (data ?? []) as Row[];
  const active = rows.filter((r) => !r.unsubscribed_at);

  return (
    <>
      <AdminHeader title="Newsletter subscribers" />
      <main className="p-10">
        <p className="text-xs uppercase tracking-[0.2em] text-text-muted mb-6">
          {active.length} active · {rows.length - active.length} unsubscribed · {rows.length} total
        </p>

        {rows.length === 0 ? (
          <p className="text-text-muted text-sm">No subscribers yet.</p>
        ) : (
          <div className="border border-divider overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-secondary text-text-muted text-[11px] uppercase tracking-[0.2em]">
                <tr>
                  <th className="px-4 py-3 text-left">Subscribed</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Source</th>
                  <th className="px-4 py-3 text-left">Locale</th>
                  <th className="px-4 py-3 text-left">Resend</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-divider">
                    <td className="px-4 py-3 text-text-muted whitespace-nowrap">
                      {new Date(r.subscribed_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">{r.email}</td>
                    <td className="px-4 py-3 text-text-muted">{r.source ?? '—'}</td>
                    <td className="px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-text-muted">{r.locale}</td>
                    <td className="px-4 py-3 text-[10px] text-text-muted truncate max-w-[140px]">
                      {r.resend_contact_id ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-[10px] uppercase tracking-[0.2em]">
                      {r.unsubscribed_at ? (
                        <span className="text-text-muted">Unsubscribed</span>
                      ) : (
                        <span className="text-accent">Active</span>
                      )}
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
