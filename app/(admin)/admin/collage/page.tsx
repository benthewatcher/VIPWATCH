import { AdminHeader } from '@/components/admin/AdminHeader';
import { CollageEditor, type Tile } from '@/components/admin/CollageEditor';
import { getCollectionImages } from '@/lib/data/collections';
import { createClient } from '@/lib/supabase/server';
import { publicMediaUrl } from '@/lib/utils/storage';
import { saveCollageLayout } from './actions';

export const metadata = { title: 'Collage layout' };
export const dynamic = 'force-dynamic';

export default async function CollagePage() {
  const supabase = (await createClient()) as any;
  const images = await getCollectionImages();

  const { data: order } = await supabase
    .from('collage_tiles')
    .select('image_path, position')
    .order('position', { ascending: true });

  const orderMap = new Map(
    ((order ?? []) as Array<{ image_path: string; position: number }>).map((r) => [r.image_path, r.position]),
  );

  const tiles: Tile[] = images.map((img) => ({
    path: img.url,
    url: publicMediaUrl(img.url) ?? '',
    title: img.title_en ?? img.slug,
    slug: img.slug,
    kind: img.kind,
    savedPosition: orderMap.get(img.url) ?? null,
  }));

  // Stable initial order: saved positions first, then unseen images.
  tiles.sort((a, b) => {
    if (a.savedPosition !== null && b.savedPosition !== null) return a.savedPosition - b.savedPosition;
    if (a.savedPosition !== null) return -1;
    if (b.savedPosition !== null) return 1;
    return 0;
  });

  return (
    <>
      <AdminHeader title="Collage layout" back={{ href: '/admin', label: 'Admin' }} />
      <div className="px-10 py-8">
        <p className="text-sm text-text-muted max-w-2xl mb-6">
          Every image from every commission in a non-private collection appears below. Use
          <strong className="text-text-primary"> Auto-sort by colour</strong> to seed a rainbow
          order, then drag tiles to fine-tune. The public /collage page renders in exactly this
          order.
        </p>
        <CollageEditor initial={tiles} save={saveCollageLayout} />
      </div>
    </>
  );
}
