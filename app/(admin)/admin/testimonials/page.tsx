import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { publicMediaUrl } from '@/lib/utils/storage';

export const metadata = { title: 'Testimonials' };

export default async function TestimonialsAdmin() {
  const supabase = (await createClient()) as any;
  const { data: rows } = await supabase
    .from('testimonials')
    .select('id, client_name, client_role, quote_en, position, is_featured, backdrop_image')
    .order('position', { ascending: true });

  return (
    <>
      <AdminHeader
        title="Testimonials"
        actions={
          <Link
            href="/admin/testimonials/new"
            className="border border-accent px-5 py-2 text-xs uppercase tracking-[0.2em] text-accent hover:bg-accent hover:text-bg-primary transition-colors"
          >
            New testimonial
          </Link>
        }
      />
      <main className="p-10">
        <div className="border border-divider">
          <table className="w-full text-sm">
            <thead className="bg-bg-secondary">
              <tr className="text-left text-xs uppercase tracking-[0.2em] text-text-muted">
                <th className="px-4 py-3 w-20" />
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Quote</th>
                <th className="px-4 py-3">Position</th>
                <th className="px-4 py-3">Featured</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {((rows ?? []) as any[]).map((c) => {
                const img = publicMediaUrl(c.backdrop_image);
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
                    <td className="px-4 py-3">
                      <p className="font-serif text-base">{c.client_name}</p>
                      {c.client_role && <p className="text-xs text-text-muted">{c.client_role}</p>}
                    </td>
                    <td className="px-4 py-3 text-text-muted text-xs italic max-w-xl truncate">&ldquo;{c.quote_en}&rdquo;</td>
                    <td className="px-4 py-3 text-text-muted">{c.position}</td>
                    <td className="px-4 py-3">{c.is_featured ? '★' : ''}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/testimonials/${c.id}`}
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
                    No testimonials yet. Click <em>New testimonial</em> to add one.
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
