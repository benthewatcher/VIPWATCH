import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { publicMediaUrl } from '@/lib/utils/storage';
import { duplicateCommission } from './actions';

export const metadata = { title: 'Commissions' };

export default async function CommissionsAdmin() {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from('commissions')
    .select('id, slug, title_en, watch_model, status, position, is_featured, card_image, hero_image, updated_at')
    .order('position', { ascending: true })
    .order('updated_at', { ascending: false });

  return (
    <>
      <AdminHeader
        title="Commissions"
        actions={
          <Link
            href="/admin/commissions/new"
            className="border border-accent px-5 py-2 text-xs uppercase tracking-[0.2em] text-accent hover:bg-accent hover:text-bg-primary transition-colors"
          >
            New commission
          </Link>
        }
      />
      <main className="p-10">
        <div className="border border-divider">
          <table className="w-full text-sm">
            <thead className="bg-bg-secondary">
              <tr className="text-left text-xs uppercase tracking-[0.2em] text-text-muted">
                <th className="px-4 py-3 w-20" />
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Watch</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Featured</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {(rows ?? []).map((c) => {
                const img = publicMediaUrl(c.card_image ?? c.hero_image);
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
                    <td className="px-4 py-3 text-text-muted">{c.watch_model}</td>
                    <td className="px-4 py-3 text-xs uppercase tracking-[0.15em]">
                      <span className={c.status === 'published' ? 'text-accent' : 'text-text-muted'}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{c.is_featured ? '★' : ''}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-4">
                        {c.status === 'published' && c.slug && (
                          <a
                            href={`/en/commissions/${c.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs uppercase tracking-[0.2em] text-text-muted hover:text-accent"
                          >
                            View ↗
                          </a>
                        )}
                        <form action={duplicateCommission.bind(null, c.id)}>
                          <button
                            type="submit"
                            className="text-xs uppercase tracking-[0.2em] text-text-muted hover:text-accent"
                          >
                            Duplicate
                          </button>
                        </form>
                        <Link
                          href={`/admin/commissions/${c.id}`}
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
                  <td colSpan={7} className="px-4 py-12 text-center text-text-muted">
                    No commissions yet. Click <em>New commission</em> to add the first piece.
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
