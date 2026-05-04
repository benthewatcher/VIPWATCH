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

export async function getHomeBlocks() {
  const supabase = (await createClient()) as any;
  const { data } = await supabase
    .from('home_blocks')
    .select('block_key, is_visible, eyebrow_en, eyebrow_fr, title_en, title_fr, body_en, body_fr, cta_label_en, cta_label_fr, cta_url, image')
    .eq('is_visible', true);
  type Row = {
    block_key: 'atelier_intro' | 'cta_strip' | 'process_teaser';
    is_visible: boolean;
    eyebrow_en: string | null;
    eyebrow_fr: string | null;
    title_en: string | null;
    title_fr: string | null;
    body_en: string | null;
    body_fr: string | null;
    cta_label_en: string | null;
    cta_label_fr: string | null;
    cta_url: string | null;
    image: string | null;
  };
  const map = new Map<Row['block_key'], Row>();
  for (const r of (data ?? []) as Row[]) map.set(r.block_key, r);
  return map;
}

export async function getProcessSteps(limit = 3) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('process_steps')
    .select('id, number, title_en, title_fr, copy_en, copy_fr, position')
    .eq('status', 'published')
    .order('position', { ascending: true })
    .limit(limit);
  return (data ?? []) as Array<{
    id: string;
    number: string;
    title_en: string;
    title_fr: string;
    copy_en: string;
    copy_fr: string;
    position: number;
  }>;
}

export async function getDepartments() {
  const supabase = (await createClient()) as any;
  const { data } = await supabase
    .from('home_departments')
    .select('id, slug, title_en, title_fr, body_en, body_fr, image, link_url, link_label_en, link_label_fr, position')
    .eq('is_visible', true)
    .order('position', { ascending: true });
  return (data ?? []) as Array<{
    id: string;
    slug: string;
    title_en: string | null;
    title_fr: string | null;
    body_en: string | null;
    body_fr: string | null;
    image: string | null;
    link_url: string | null;
    link_label_en: string | null;
    link_label_fr: string | null;
    position: number;
  }>;
}

export async function getFeaturedTestimonials(limit = 6) {
  const supabase = (await createClient()) as any;
  const { data } = await supabase
    .from('testimonials')
    .select('id, client_name, client_role, quote_en, quote_fr, photo_url, backdrop_image, position')
    .eq('is_featured', true)
    .order('position', { ascending: true })
    .limit(limit);
  return (data ?? []) as Array<{
    id: string;
    client_name: string;
    client_role: string | null;
    quote_en: string;
    quote_fr: string | null;
    photo_url: string | null;
    backdrop_image: string | null;
    position: number;
  }>;
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
