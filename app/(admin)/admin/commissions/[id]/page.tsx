import { notFound } from 'next/navigation';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { CommissionForm } from '@/components/admin/CommissionForm';
import { CommissionGallery } from '@/components/admin/CommissionGallery';
import { CommissionBlocks } from '@/components/admin/CommissionBlocks';
import { CommissionRelated } from '@/components/admin/CommissionRelated';
import { createClient } from '@/lib/supabase/server';
import {
  updateCommission,
  deleteCommission,
  duplicateCommission,
  addCommissionImage,
  deleteCommissionImage,
  setCommissionImagePosition,
  addCommissionBlock,
  updateCommissionBlock,
  deleteCommissionBlock,
  setCommissionBlockPosition,
  setCommissionRelated,
  type CommissionBlockRow,
} from '../actions';

export const metadata = { title: 'Edit commission' };

export default async function EditCommissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: row }, { data: gallery }, { data: blocks }, { data: allOthers }] = await Promise.all([
    supabase.from('commissions').select('*').eq('id', id).maybeSingle(),
    supabase.from('commission_images').select('id, url, position').eq('commission_id', id).order('position'),
    (supabase as any)
      .from('commission_blocks')
      .select('id, position, type, hidden, body_en, body_fr, image_url, image_url_2, alt_en, alt_fr')
      .eq('commission_id', id)
      .order('position'),
    supabase
      .from('commissions')
      .select('id, slug, title_en, watch_model, card_image, hero_image')
      .neq('id', id)
      .order('position', { ascending: true }),
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
          <>
            <form action={duplicateCommission.bind(null, id)}>
              <button
                type="submit"
                className="border border-divider px-4 py-2 text-xs uppercase tracking-[0.2em] text-text-muted hover:border-accent hover:text-accent transition-colors"
              >
                Duplicate
              </button>
            </form>
            {row.status === 'published' && row.slug && (
              <a
                href={`/en/commissions/${row.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="border border-accent px-4 py-2 text-xs uppercase tracking-[0.2em] text-accent hover:bg-accent hover:text-bg-primary transition-colors"
              >
                View live ↗
              </a>
            )}
          </>
        }
      />
      <main className="p-10 grid gap-12">
        <CommissionForm row={row} action={update} submitLabel="Save changes" onDelete={remove} />

        <section className="border-t border-divider pt-10 max-w-4xl">
          <CommissionBlocks
            commissionId={id}
            slug={row.slug ?? id}
            initial={(blocks ?? []) as CommissionBlockRow[]}
            context={{
              title_en: row.title_en ?? null,
              watch_model: row.watch_model ?? null,
              client_initials: row.client_initials ?? null,
            }}
            addAction={addCommissionBlock}
            updateAction={updateCommissionBlock}
            removeAction={deleteCommissionBlock}
            setPositionAction={setCommissionBlockPosition}
          />
        </section>

        <section className="border-t border-divider pt-10 max-w-4xl">
          <CommissionRelated
            commissionId={id}
            options={(allOthers ?? []) as Parameters<typeof CommissionRelated>[0]['options']}
            initial={((row as any).related_commission_ids ?? []) as string[]}
            setAction={setCommissionRelated}
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
