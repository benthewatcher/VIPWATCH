import { notFound } from 'next/navigation';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { CommissionForm } from '@/components/admin/CommissionForm';
import { CommissionGallery } from '@/components/admin/CommissionGallery';
import { createClient } from '@/lib/supabase/server';
import {
  updateCommission,
  deleteCommission,
  addCommissionImage,
  deleteCommissionImage,
} from '../actions';

export const metadata = { title: 'Edit commission' };

export default async function EditCommissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: row }, { data: gallery }] = await Promise.all([
    supabase.from('commissions').select('*').eq('id', id).maybeSingle(),
    supabase.from('commission_images').select('id, url, position').eq('commission_id', id).order('position'),
  ]);

  if (!row) notFound();

  const update = updateCommission.bind(null, id);
  const remove = deleteCommission.bind(null, id);

  return (
    <>
      <AdminHeader title={row.title_en ?? 'Edit commission'} back={{ href: '/admin/commissions', label: 'Commissions' }} />
      <main className="p-10 grid gap-12">
        <CommissionForm row={row} action={update} submitLabel="Save changes" onDelete={remove} />

        <section className="border-t border-divider pt-10 max-w-4xl">
          <CommissionGallery
            commissionId={id}
            slug={row.slug ?? id}
            initial={(gallery ?? []).map((g) => ({ id: g.id, url: g.url, position: g.position }))}
            addAction={addCommissionImage}
            removeAction={deleteCommissionImage}
          />
        </section>
      </main>
    </>
  );
}
