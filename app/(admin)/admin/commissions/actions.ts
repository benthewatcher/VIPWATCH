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
