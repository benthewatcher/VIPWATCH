import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { publicMediaUrl } from '@/lib/utils/storage';

export const metadata = { title: 'Collections' };

export default async function CollectionsAdmin() {
  const supabase = (await createClient()) as any;
  const { data: rows } = await supabase
    .from('commission_collections')
    .select('id, slug, name_en, project_en, is_private, is_featured, position, cover_image, updated_at')
    .order('position', { ascending: true })
    .order('updated_at', { ascending: false });

  // Counts of commissions per collection
  const ids = (rows ?? []).map((r: { id: string }) => r.id);
  let counts: Record<string, number> = {};
  if (ids.length > 0) {
    const { data: pivot } = await supabase
      .from('collection_commissions')
      .select('collection_id')
      .in('collection_id', ids);
    for (const r of pivot ?? []) {
      counts[r.collection_id] = (counts[r.collection_id] ?? 0) + 1;
    }
  }

  return (
    <>
      <AdminHeader
        title="Collections"
        actions={
          <Link
            href="/admin/collections/new"
            className="border border-accent px-5 py-2 text-xs uppercase tracking-[0.2em] text-accent hover:bg-accent hover:text-bg-primary transition-colors"
          >
            New collection
          </Link>
        }
      />
      <main className="p-10">
        <div className="border border-divider">
          <table className="w-full text-sm">
            <thead className="bg-bg-secondary">
              <tr className="text-left text-xs uppercase tracking-[0.2em] text-text-muted">
                <th className="px-4 py-3 w-20" />
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Visibility</th>
                <th className="px-4 py-3">Featured</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {(rows ?? []).map((c: any) => {
                const img = publicMediaUrl(c.cover_image);
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
                    <td className="px-4 py-3 font-serif text-base">{c.name_en}</td>
                    <td className="px-4 py-3 text-text-muted">{c.project_en}</td>
                    <td className="px-4 py-3 font-mono text-xs text-text-muted">{c.slug}</td>
                    <td className="px-4 py-3 text-text-muted">{counts[c.id] ?? 0}</td>
                    <td className="px-4 py-3 text-xs uppercase tracking-[0.15em]">
                      <span className={c.is_private ? 'text-text-muted' : 'text-accent'}>
                        {c.is_private ? 'private' : 'public'}
                      </span>
                    </td>
                    <td className="px-4 py-3">{c.is_featured ? '★' : ''}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-4">
                        {!c.is_private && c.slug && (
                          <a
                            href={`/en/collections/${c.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs uppercase tracking-[0.2em] text-text-muted hover:text-accent"
                          >
                            View ↗
                          </a>
                        )}
                        <Link
                          href={`/admin/collections/${c.id}`}
                          className="text-xs uppercase tracking-[0.2em] text-text-muted hover:text-accent"
                        >
                          Edit →
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {(!rows || rows.length === 0) && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-text-muted">
                    No collections yet. Click <em>New collection</em> to create one.
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
