import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { SortableCommissionsTable } from '@/components/admin/SortableCommissionsTable';
import { duplicateCommission, reorderCommissions } from './actions';

export const metadata = { title: 'Commissions' };

export default async function CommissionsAdmin() {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from('commissions')
    .select('id, slug, title_en, watch_model, status, position, is_featured, card_image, hero_image, updated_at')
    .order('position', { ascending: true })
    .order('updated_at', { ascending: false });

  const initial = ((rows ?? []) as Array<{
    id: string;
    slug: string | null;
    title_en: string | null;
    watch_model: string | null;
    status: string;
    is_featured: boolean | null;
    card_image: string | null;
    hero_image: string | null;
  }>).map((r) => ({
    id: r.id,
    slug: r.slug,
    title_en: r.title_en,
    watch_model: r.watch_model,
    status: r.status,
    is_featured: r.is_featured,
    card_image: r.card_image,
    hero_image: r.hero_image,
  }));

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
        <SortableCommissionsTable
          initial={initial}
          reorderAction={reorderCommissions}
          duplicateAction={duplicateCommission}
        />
      </main>
    </>
  );
}
