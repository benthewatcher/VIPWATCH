import { notFound } from 'next/navigation';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { CollectionForm } from '@/components/admin/CollectionForm';
import { CollectionCommissions } from '@/components/admin/CollectionCommissions';
import { createClient } from '@/lib/supabase/server';
import {
  updateCollection,
  deleteCollection,
  addCommissionToCollection,
  removeCommissionFromCollection,
  setCollectionCommissionPosition,
} from '../actions';

export const metadata = { title: 'Edit collection' };

export default async function EditCollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = (await createClient()) as any;

  const [{ data: row }, { data: pivot }, { data: allCommissions }] = await Promise.all([
    supabase.from('commission_collections').select('*').eq('id', id).maybeSingle(),
    supabase
      .from('collection_commissions')
      .select('commission_id, position')
      .eq('collection_id', id)
      .order('position'),
    supabase
      .from('commissions')
      .select('id, slug, title_en, watch_model, card_image, hero_image')
      .order('position', { ascending: true }),
  ]);

  if (!row) notFound();

  const allMap = new Map(
    ((allCommissions ?? []) as Array<{
      id: string;
      slug: string;
      title_en: string | null;
      watch_model: string | null;
      card_image: string | null;
      hero_image: string | null;
    }>).map((c) => [c.id, c]),
  );
  const members = ((pivot ?? []) as Array<{ commission_id: string; position: number }>)
    .map((p) => {
      const c = allMap.get(p.commission_id);
      return c ? { ...c, position: p.position } : null;
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x));

  const update = updateCollection.bind(null, id);
  const remove = deleteCollection.bind(null, id);

  return (
    <>
      <AdminHeader
        title={row.name_en ?? 'Edit collection'}
        back={{ href: '/admin/collections', label: 'Collections' }}
        actions={
          !row.is_private && row.slug ? (
            <a
              href={`/en/collections/${row.slug}`}
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
        <CollectionForm row={row} action={update} submitLabel="Save changes" onDelete={remove} />

        <section className="border-t border-divider pt-10 max-w-4xl">
          <CollectionCommissions
            collectionId={id}
            options={(allCommissions ?? []) as Parameters<typeof CollectionCommissions>[0]['options']}
            initial={members}
            addAction={addCommissionToCollection}
            removeAction={removeCommissionFromCollection}
            setPositionAction={setCollectionCommissionPosition}
          />
        </section>
      </main>
    </>
  );
}
