import { notFound } from 'next/navigation';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { CommissionForm } from '@/components/admin/CommissionForm';
import { CommissionGallery } from '@/components/admin/CommissionGallery';
import { CommissionBlocks } from '@/components/admin/CommissionBlocks';
import { createClient } from '@/lib/supabase/server';
import {
  updateCommission,
  deleteCommission,
  addCommissionImage,
  deleteCommissionImage,
  setCommissionImagePosition,
  addCommissionBlock,
  updateCommissionBlock,
  deleteCommissionBlock,
  setCommissionBlockPosition,
  type CommissionBlockRow,
} from '../actions';

export const metadata = { title: 'Edit commission' };

export default async function EditCommissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: row }, { data: gallery }, { data: blocks }] = await Promise.all([
    supabase.from('commissions').select('*').eq('id', id).maybeSingle(),
    supabase.from('commission_images').select('id, url, position').eq('commission_id', id).order('position'),
    (supabase as any)
      .from('commission_blocks')
      .select('id, position, type, body_en, body_fr, image_url, image_url_2, alt_en, alt_fr')
      .eq('commission_id', id)
      .order('position'),
  ]);

  if (!row) notFound();

  const update = updateCommission.bind(null, id);
  const remove = deleteCommission.bind(null, id);

  return (
    <>
      <AdminHeader
        title={row.title_en ?? 'Edit commission'}
        back={{ href: '/admin/commissions', label: 'Commissions' }}
        actions={
          row.status === 'published' && row.slug ? (
            <a
              href={`/en/commissions/${row.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-accent px-4 py-2 text-xs uppercase tracking-[0.2em] text-accent hover:bg-accent hover:text-bg-primary transition-colors"
            >
              View live ↗
            </a>
          ) : null
        }
      />
      <main className="p-10 grid gap-12">
        <CommissionForm row={row} action={update} submitLabel="Save changes" onDelete={remove} />

        <section className="border-t border-divider pt-10 max-w-4xl">
          <CommissionBlocks
            commissionId={id}
            slug={row.slug ?? id}
            initial={(blocks ?? []) as CommissionBlockRow[]}
            addAction={addCommissionBlock}
            updateAction={updateCommissionBlock}
            removeAction={deleteCommissionBlock}
            setPositionAction={setCommissionBlockPosition}
          />
        </section>

        <section className="border-t border-divider pt-10 max-w-4xl">
          <CommissionGallery
            commissionId={id}
            slug={row.slug ?? id}
            initial={(gallery ?? []).map((g) => ({ id: g.id, url: g.url, position: g.position }))}
            addAction={addCommissionImage}
            removeAction={deleteCommissionImage}
            setPositionAction={setCommissionImagePosition}
          />
        </section>
      </main>
    </>
  );
}
