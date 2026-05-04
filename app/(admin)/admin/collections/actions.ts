'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const collectionSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'lowercase, digits and hyphens only'),
  name_en: z.string().min(1),
  name_fr: z.string().default(''),
  project_en: z.string().nullable().optional(),
  project_fr: z.string().nullable().optional(),
  description_en: z.string().nullable().optional(),
  description_fr: z.string().nullable().optional(),
  cover_image: z.string().nullable().optional(),
  is_private: z.coerce.boolean().default(false),
  is_featured: z.coerce.boolean().default(false),
  position: z.coerce.number().int().default(0),
});

function parse(form: FormData) {
  return collectionSchema.parse({
    slug: form.get('slug'),
    name_en: form.get('name_en'),
    name_fr: (form.get('name_fr') as string) || '',
    project_en: form.get('project_en') || null,
    project_fr: form.get('project_fr') || null,
    description_en: form.get('description_en') || null,
    description_fr: form.get('description_fr') || null,
    cover_image: form.get('cover_image') || null,
    is_private: form.get('is_private') === 'on' || form.get('is_private') === 'true',
    is_featured: form.get('is_featured') === 'on' || form.get('is_featured') === 'true',
    position: form.get('position') || 0,
  });
}

export async function createCollection(form: FormData) {
  const data = parse(form);
  const supabase = (await createClient()) as any;
  const { data: row, error } = await supabase
    .from('commission_collections')
    .insert({ ...data, name_fr: data.name_fr ?? '' })
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  revalidatePath('/admin/collections');
  revalidatePath('/[locale]/collections', 'page');
  redirect(`/admin/collections/${row.id}`);
}

export async function updateCollection(id: string, form: FormData) {
  const data = parse(form);
  const supabase = (await createClient()) as any;
  const { error } = await supabase
    .from('commission_collections')
    .update({ ...data, name_fr: data.name_fr ?? '', updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/collections');
  revalidatePath(`/admin/collections/${id}`);
  revalidatePath('/[locale]/collections', 'page');
  revalidatePath('/[locale]/collections/[slug]', 'page');
  revalidatePath('/[locale]', 'page');
}

export async function deleteCollection(id: string) {
  const supabase = (await createClient()) as any;
  const { error } = await supabase.from('commission_collections').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/collections');
  revalidatePath('/[locale]/collections', 'page');
  redirect('/admin/collections');
}

// --- pivot management ---

export async function addCommissionToCollection(collectionId: string, commissionId: string) {
  const supabase = (await createClient()) as any;
  const { data: max } = await supabase
    .from('collection_commissions')
    .select('position')
    .eq('collection_id', collectionId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextPosition = ((max as { position?: number } | null)?.position ?? -1) + 1;
  const { error } = await supabase
    .from('collection_commissions')
    .insert({ collection_id: collectionId, commission_id: commissionId, position: nextPosition });
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/collections/${collectionId}`);
  revalidatePath('/[locale]/collections/[slug]', 'page');
}

export async function removeCommissionFromCollection(collectionId: string, commissionId: string) {
  const supabase = (await createClient()) as any;
  const { error } = await supabase
    .from('collection_commissions')
    .delete()
    .eq('collection_id', collectionId)
    .eq('commission_id', commissionId);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/collections/${collectionId}`);
  revalidatePath('/[locale]/collections/[slug]', 'page');
}

export async function setCollectionCommissionPosition(
  collectionId: string,
  commissionId: string,
  position: number,
) {
  const supabase = (await createClient()) as any;
  const { error } = await supabase
    .from('collection_commissions')
    .update({ position })
    .eq('collection_id', collectionId)
    .eq('commission_id', commissionId);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/collections/${collectionId}`);
  revalidatePath('/[locale]/collections/[slug]', 'page');
}

export async function setCollectionPosition(collectionId: string, position: number) {
  const supabase = (await createClient()) as any;
  const { error } = await supabase
    .from('commission_collections')
    .update({ position })
    .eq('id', collectionId);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/collections');
  revalidatePath('/[locale]/collections', 'page');
  revalidatePath('/[locale]', 'page');
}
