import { createClient } from '@/lib/supabase/server';

export async function getHomePage() {
  const supabase = await createClient();
  const { data } = await supabase.from('pages').select('*').eq('key', 'home').maybeSingle();
  return data;
}

export async function getFeaturedCommissions(limit = 3) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('commissions')
    .select('id, slug, card_image, hero_image, title_en, title_fr, watch_model, brand_id')
    .eq('status', 'published')
    .eq('is_featured', true)
    .order('position', { ascending: true })
    .limit(limit);
  return data ?? [];
}

export async function getServicesForGrid(limit = 4) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('services')
    .select('id, slug, title_en, title_fr, position')
    .eq('status', 'published')
    .order('position', { ascending: true })
    .limit(limit);
  return data ?? [];
}

export async function getFeaturedCollections(limit = 2) {
  const supabase = (await createClient()) as any;
  const { data } = await supabase
    .from('commission_collections')
    .select('id, slug, name_en, name_fr, project_en, project_fr, cover_image, position')
    .eq('is_private', false)
    .eq('is_featured', true)
    .order('position', { ascending: true })
    .limit(limit);
  return (data ?? []) as Array<{
    id: string;
    slug: string;
    name_en: string | null;
    name_fr: string | null;
    project_en: string | null;
    project_fr: string | null;
    cover_image: string | null;
    position: number;
  }>;
}
