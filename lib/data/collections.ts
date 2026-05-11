import { createClient } from '@/lib/supabase/server';

export type LookbookCommission = {
  id: string;
  slug: string;
  title_en: string | null;
  title_fr: string | null;
  watch_model: string | null;
  hero_image: string | null;
  card_image: string | null;
};

export type LookbookCollection = {
  id: string;
  slug: string;
  name_en: string;
  name_fr: string | null;
  project_en: string | null;
  project_fr: string | null;
  description_en: string | null;
  description_fr: string | null;
  cover_image: string | null;
  cover_image_mobile: string | null;
  hero_video: string | null;
  commissions: LookbookCommission[];
};

export async function getLookbookCollections(): Promise<LookbookCollection[]> {
  const supabase = (await createClient()) as any;

  const { data: rows } = await supabase
    .from('commission_collections')
    .select(
      'id, slug, name_en, name_fr, project_en, project_fr, description_en, description_fr, cover_image, cover_image_mobile, hero_video, lookbook_position, position',
    )
    .eq('is_private', false)
    .order('lookbook_position', { ascending: true })
    .order('position', { ascending: true });

  const collections = (rows ?? []) as Array<LookbookCollection & { lookbook_position?: number; position?: number }>;
  if (collections.length === 0) return [];

  const { data: pivot } = await supabase
    .from('collection_commissions')
    .select('collection_id, commission_id, position')
    .in(
      'collection_id',
      collections.map((c) => c.id),
    )
    .order('position', { ascending: true });

  const pivotRows = (pivot ?? []) as Array<{ collection_id: string; commission_id: string; position: number }>;
  const ids = Array.from(new Set(pivotRows.map((p) => p.commission_id)));

  let byId = new Map<string, LookbookCommission>();
  if (ids.length > 0) {
    const { data: comms } = await supabase
      .from('commissions')
      .select('id, slug, title_en, title_fr, watch_model, hero_image, card_image')
      .eq('status', 'published')
      .in('id', ids);
    byId = new Map(((comms ?? []) as LookbookCommission[]).map((c) => [c.id, c]));
  }

  return collections.map((c) => ({
    ...c,
    commissions: pivotRows
      .filter((p) => p.collection_id === c.id)
      .map((p) => byId.get(p.commission_id))
      .filter((c): c is LookbookCommission => Boolean(c)),
  }));
}

/**
 * Every published commission that lives in at least one non-private
 * collection — flat, de-duplicated. Used by the colour-coded collage page.
 */
export async function getCollectionWatches(): Promise<LookbookCommission[]> {
  const supabase = (await createClient()) as any;

  const { data: cols } = await supabase
    .from('commission_collections')
    .select('id')
    .eq('is_private', false);
  const collectionIds = ((cols ?? []) as Array<{ id: string }>).map((c) => c.id);
  if (collectionIds.length === 0) return [];

  const { data: pivot } = await supabase
    .from('collection_commissions')
    .select('commission_id')
    .in('collection_id', collectionIds);
  const ids = Array.from(
    new Set(((pivot ?? []) as Array<{ commission_id: string }>).map((p) => p.commission_id)),
  );
  if (ids.length === 0) return [];

  const { data: comms } = await supabase
    .from('commissions')
    .select('id, slug, title_en, title_fr, watch_model, hero_image, card_image')
    .eq('status', 'published')
    .in('id', ids);

  return (comms ?? []) as LookbookCommission[];
}

