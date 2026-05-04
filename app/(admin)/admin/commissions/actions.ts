'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const commissionSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'lowercase, digits and hyphens only'),
  client_initials: z.string().nullable().optional(),
  watch_model: z.string().nullable().optional(),
  year_started: z.coerce.number().int().nullable().optional(),
  hero_image: z.string().nullable().optional(),
  hero_video: z.string().nullable().optional(),
  card_image: z.string().nullable().optional(),
  position: z.coerce.number().int().default(0),
  is_featured: z.coerce.boolean().default(false),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  title_en: z.string().min(1),
  // _fr columns are NOT NULL in the DB; default to '' until a migration relaxes them.
  title_fr: z.string().default(''),
  summary_en: z.string().nullable().optional(),
  summary_fr: z.string().default(''),
  body_en: z.string().nullable().optional(),
  body_fr: z.string().default(''),
});

function parse(form: FormData) {
  return commissionSchema.parse({
    slug: form.get('slug'),
    client_initials: form.get('client_initials') || null,
    watch_model: form.get('watch_model') || null,
    year_started: form.get('year_started') || null,
    hero_image: form.get('hero_image') || null,
    hero_video: form.get('hero_video') || null,
    card_image: form.get('card_image') || null,
    position: form.get('position') || 0,
    is_featured: form.get('is_featured') === 'on' || form.get('is_featured') === 'true',
    status: form.get('status') || 'draft',
    title_en: form.get('title_en'),
    // _fr columns are NOT NULL in the DB; default to '' until a migration relaxes them.
    title_fr: (form.get('title_fr') as string) || '',
    summary_en: form.get('summary_en') || null,
    summary_fr: (form.get('summary_fr') as string) || '',
    body_en: form.get('body_en') || null,
    body_fr: (form.get('body_fr') as string) || '',
  });
}

export async function createCommission(form: FormData) {
  const data = parse(form);
  const payload = {
    ...data,
    title_fr: data.title_fr ?? '',
    summary_fr: data.summary_fr ?? '',
    body_fr: data.body_fr ?? '',
    published_at: data.status === 'published' ? new Date().toISOString() : null,
  };
  const supabase = await createClient();
  const { data: row, error } = await supabase.from('commissions').insert(payload).select('id').single();
  if (error) throw new Error(error.message);
  revalidatePath('/admin/commissions');
  revalidatePath('/[locale]/commissions', 'page');
  revalidatePath('/[locale]', 'page');
  redirect(`/admin/commissions/${row.id}`);
}

export async function updateCommission(id: string, form: FormData) {
  const data = parse(form);
  const supabase = await createClient();

  // If transitioning to published, set published_at if missing.
  const { data: existing } = await supabase
    .from('commissions')
    .select('status, published_at')
    .eq('id', id)
    .single();

  const update = {
    ...data,
    title_fr: data.title_fr ?? '',
    summary_fr: data.summary_fr ?? '',
    body_fr: data.body_fr ?? '',
    published_at:
      data.status === 'published' && !existing?.published_at
        ? new Date().toISOString()
        : existing?.published_at ?? null,
  };

  const { error } = await supabase.from('commissions').update(update).eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath('/admin/commissions');
  revalidatePath(`/admin/commissions/${id}`);
  revalidatePath('/[locale]/commissions', 'page');
  revalidatePath('/[locale]/commissions/[slug]', 'page');
  revalidatePath('/[locale]', 'page');
}

export async function deleteCommission(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('commissions').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/commissions');
  revalidatePath('/[locale]/commissions', 'page');
  redirect('/admin/commissions');
}

export async function duplicateCommission(id: string) {
  const supabase = await createClient();
  const { data: src, error: srcErr } = await supabase
    .from('commissions')
    .select('*')
    .eq('id', id)
    .single();
  if (srcErr || !src) throw new Error(srcErr?.message ?? 'Source commission not found');

  // Build a unique slug by suffixing -copy, -copy-2, etc.
  const baseSlug = `${src.slug}-copy`;
  let candidate = baseSlug;
  for (let i = 2; i < 100; i++) {
    const { data: existing } = await supabase
      .from('commissions')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle();
    if (!existing) break;
    candidate = `${baseSlug}-${i}`;
  }

  const {
    id: _id,
    created_at: _createdAt,
    updated_at: _updatedAt,
    published_at: _publishedAt,
    slug: _slug,
    status: _status,
    is_featured: _isFeatured,
    title_en,
    ...rest
  } = src as Record<string, unknown> & { title_en?: string | null };

  const { data: inserted, error: insErr } = await (supabase as any)
    .from('commissions')
    .insert({
      ...rest,
      slug: candidate,
      title_en: title_en ? `${title_en} (copy)` : 'Untitled (copy)',
      status: 'draft',
      is_featured: false,
      published_at: null,
    })
    .select('id')
    .single();
  if (insErr || !inserted) throw new Error(insErr?.message ?? 'Failed to duplicate commission');

  // Copy blocks (commission_blocks isn't in generated types yet)
  const sb = supabase as any;
  const { data: srcBlocks } = await sb
    .from('commission_blocks')
    .select('position, type, body_en, body_fr, image_url, image_url_2, alt_en, alt_fr')
    .eq('commission_id', id)
    .order('position');
  if (srcBlocks && srcBlocks.length > 0) {
    await sb
      .from('commission_blocks')
      .insert(srcBlocks.map((b: Record<string, unknown>) => ({ ...b, commission_id: inserted.id })));
  }

  revalidatePath('/admin/commissions');
  redirect(`/admin/commissions/${inserted.id}`);
}

// Gallery image actions
export async function addCommissionImage(commissionId: string, url: string) {
  const supabase = await createClient();
  const { data: max } = await supabase
    .from('commission_images')
    .select('position')
    .eq('commission_id', commissionId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextPosition = (max?.position ?? -1) + 1;
  const { data, error } = await supabase
    .from('commission_images')
    .insert({ commission_id: commissionId, url, position: nextPosition })
    .select('id, url, position')
    .single();
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/commissions/${commissionId}`);
  revalidatePath('/[locale]/commissions/[slug]', 'page');
  return data;
}

export async function deleteCommissionImage(commissionId: string, imageId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('commission_images').delete().eq('id', imageId);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/commissions/${commissionId}`);
  revalidatePath('/[locale]/commissions/[slug]', 'page');
}

export async function setCommissionImagePosition(
  commissionId: string,
  imageId: string,
  position: number,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('commission_images')
    .update({ position })
    .eq('id', imageId);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/commissions/${commissionId}`);
  revalidatePath('/[locale]/commissions/[slug]', 'page');
}

// Block actions (paragraph + image content blocks)
export type CommissionBlockType = 'paragraph' | 'image' | 'image_pair';

export type CommissionBlockRow = {
  id: string;
  position: number;
  type: CommissionBlockType;
  hidden: boolean;
  body_en: string | null;
  body_fr: string | null;
  image_url: string | null;
  image_url_2: string | null;
  alt_en: string | null;
  alt_fr: string | null;
};

// commission_blocks isn't in generated supabase types yet; cast to any until regenerated.
export async function addCommissionBlock(
  commissionId: string,
  type: CommissionBlockType,
): Promise<CommissionBlockRow> {
  const supabase = (await createClient()) as any;
  const { data: max } = await supabase
    .from('commission_blocks')
    .select('position')
    .eq('commission_id', commissionId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextPosition = ((max as { position?: number } | null)?.position ?? -1) + 1;
  const { data, error } = await supabase
    .from('commission_blocks')
    .insert({ commission_id: commissionId, type, position: nextPosition })
    .select('id, position, type, hidden, body_en, body_fr, image_url, image_url_2, alt_en, alt_fr')
    .single();
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/commissions/${commissionId}`);
  revalidatePath('/[locale]/commissions/[slug]', 'page');
  return data as CommissionBlockRow;
}

export async function updateCommissionBlock(
  commissionId: string,
  blockId: string,
  patch: Partial<Omit<CommissionBlockRow, 'id' | 'position' | 'type'>>,
) {
  const supabase = (await createClient()) as any;
  const { error } = await supabase
    .from('commission_blocks')
    .update(patch)
    .eq('id', blockId);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/commissions/${commissionId}`);
  revalidatePath('/[locale]/commissions/[slug]', 'page');
}

export async function deleteCommissionBlock(commissionId: string, blockId: string) {
  const supabase = (await createClient()) as any;
  const { error } = await supabase.from('commission_blocks').delete().eq('id', blockId);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/commissions/${commissionId}`);
  revalidatePath('/[locale]/commissions/[slug]', 'page');
}

export async function setCommissionRelated(commissionId: string, relatedIds: string[]) {
  const supabase = (await createClient()) as any;
  const { error } = await supabase
    .from('commissions')
    .update({ related_commission_ids: relatedIds })
    .eq('id', commissionId);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/commissions/${commissionId}`);
  revalidatePath('/[locale]/commissions/[slug]', 'page');
}

export async function setCommissionBlockPosition(
  commissionId: string,
  blockId: string,
  position: number,
) {
  const supabase = (await createClient()) as any;
  const { error } = await supabase
    .from('commission_blocks')
    .update({ position })
    .eq('id', blockId);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/commissions/${commissionId}`);
  revalidatePath('/[locale]/commissions/[slug]', 'page');
}
