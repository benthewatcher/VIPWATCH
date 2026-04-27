import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { AdminHeader } from '@/components/admin/AdminHeader';

export const metadata = { title: 'Process steps' };

export default async function ProcessAdmin() {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from('process_steps')
    .select('id, number, title_en, title_fr, status, position')
    .order('position');

  return (
    <>
      <AdminHeader
        title="Process steps"
        actions={
          <Link
            href="/admin/process/new"
            className="border border-accent px-5 py-2 text-xs uppercase tracking-[0.2em] text-accent hover:bg-accent hover:text-bg-primary transition-colors"
          >
            New step
          </Link>
        }
      />
      <main className="p-10">
        <div className="border border-divider">
          <table className="w-full text-sm">
            <thead className="bg-bg-secondary">
              <tr className="text-left text-xs uppercase tracking-[0.2em] text-text-muted">
                <th className="px-4 py-3 w-16">#</th>
                <th className="px-4 py-3 w-20">Number</th>
                <th className="px-4 py-3">Title (EN)</th>
                <th className="px-4 py-3">Title (FR)</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {(rows ?? []).map((s) => (
                <tr key={s.id} className="hover:bg-bg-secondary/50">
                  <td className="px-4 py-3 text-text-muted">{s.position}</td>
                  <td className="px-4 py-3 font-serif text-xl">{s.number}</td>
                  <td className="px-4 py-3 font-serif text-base">{s.title_en}</td>
                  <td className="px-4 py-3 text-text-muted">{s.title_fr}</td>
                  <td className="px-4 py-3 text-xs uppercase tracking-[0.15em]">
                    <span className={s.status === 'published' ? 'text-accent' : 'text-text-muted'}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/process/${s.id}`}
                      className="text-xs uppercase tracking-[0.2em] text-text-muted hover:text-accent"
                    >
                      Edit →
                    </Link>
                  </td>
                </tr>
              ))}
              {(!rows || rows.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-text-muted">
                    No process steps yet. Run <code className="text-accent">0006_process_steps.sql</code> to seed the default 6, or click <em>New step</em>.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
