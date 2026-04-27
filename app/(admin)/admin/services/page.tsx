import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { AdminHeader } from '@/components/admin/AdminHeader';

export const metadata = { title: 'Services' };

export default async function ServicesAdmin() {
  const supabase = await createClient();
  const { data: services } = await supabase
    .from('services')
    .select('id, slug, title_en, title_fr, status, position, icon_name')
    .order('position', { ascending: true });

  return (
    <>
      <AdminHeader
        title="Services"
        actions={
          <Link
            href="/admin/services/new"
            className="border border-accent px-5 py-2 text-xs uppercase tracking-[0.2em] text-accent hover:bg-accent hover:text-bg-primary transition-colors"
          >
            New service
          </Link>
        }
      />
      <main className="p-10">
        <div className="border border-divider">
          <table className="w-full text-sm">
            <thead className="bg-bg-secondary">
              <tr className="text-left text-xs uppercase tracking-[0.2em] text-text-muted">
                <th className="px-4 py-3 w-16">#</th>
                <th className="px-4 py-3">Title (EN)</th>
                <th className="px-4 py-3">Title (FR)</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {(services ?? []).map((s) => (
                <tr key={s.id} className="hover:bg-bg-secondary/50">
                  <td className="px-4 py-3 text-text-muted">{s.position}</td>
                  <td className="px-4 py-3 font-serif text-base">{s.title_en}</td>
                  <td className="px-4 py-3 text-text-muted">{s.title_fr}</td>
                  <td className="px-4 py-3 font-mono text-xs text-text-muted">{s.slug}</td>
                  <td className="px-4 py-3 text-xs uppercase tracking-[0.15em]">
                    <span className={s.status === 'published' ? 'text-accent' : 'text-text-muted'}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/services/${s.id}`} className="text-xs uppercase tracking-[0.2em] text-text-muted hover:text-accent">
                      Edit →
                    </Link>
                  </td>
                </tr>
              ))}
              {(!services || services.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-text-muted">
                    No services yet. Run <code className="text-accent">0004_seed_services.sql</code> or click <em>New service</em>.
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
