import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { publicMediaUrl } from '@/lib/utils/storage';

export const metadata = { title: 'Departments' };

export default async function DepartmentsAdmin() {
  const supabase = (await createClient()) as any;
  const { data: rows } = await supabase
    .from('home_departments')
    .select('id, slug, title_en, position, is_visible, image')
    .order('position', { ascending: true });

  return (
    <>
      <AdminHeader
        title="Departments"
        actions={
          <Link
            href="/admin/departments/new"
            className="border border-accent px-5 py-2 text-xs uppercase tracking-[0.2em] text-accent hover:bg-accent hover:text-bg-primary transition-colors"
          >
            New department
          </Link>
        }
      />
      <main className="p-10">
        <p className="text-xs text-text-muted mb-4">
          Department blocks render as full-bleed image tiles on the homepage. Use them for high-level service categories.
        </p>
        <div className="border border-divider">
          <table className="w-full text-sm">
            <thead className="bg-bg-secondary">
              <tr className="text-left text-xs uppercase tracking-[0.2em] text-text-muted">
                <th className="px-4 py-3 w-20" />
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Position</th>
                <th className="px-4 py-3">Visible</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {((rows ?? []) as any[]).map((c) => {
                const img = publicMediaUrl(c.image);
                return (
                  <tr key={c.id} className="hover:bg-bg-secondary/50">
                    <td className="px-4 py-3">
                      <div className="w-12 h-12 bg-bg-secondary border border-divider overflow-hidden">
                        {img && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-serif text-base">{c.title_en}</td>
                    <td className="px-4 py-3 font-mono text-xs text-text-muted">{c.slug}</td>
                    <td className="px-4 py-3 text-text-muted">{c.position}</td>
                    <td className="px-4 py-3 text-xs uppercase tracking-[0.15em]">
                      <span className={c.is_visible ? 'text-accent' : 'text-text-muted'}>
                        {c.is_visible ? 'visible' : 'hidden'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/departments/${c.id}`}
                        className="text-xs uppercase tracking-[0.2em] text-text-muted hover:text-accent"
                      >
                        Edit →
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {(!rows || rows.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-text-muted">
                    No departments yet. Click <em>New department</em> to add the first.
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
