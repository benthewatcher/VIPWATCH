'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const schema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'lowercase, digits and hyphens only'),
  title_en: z.string().min(1),
  title_fr: z.string().default(''),
  body_en: z.string().nullable().optional(),
  body_fr: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  link_url: z.string().nullable().optional(),
  link_label_en: z.string().nullable().optional(),
  link_label_fr: z.string().nullable().optional(),
  position: z.coerce.number().int().default(0),
  is_visible: z.coerce.boolean().default(true),
});

function parse(form: FormData) {
  return schema.parse({
    slug: form.get('slug'),
    title_en: form.get('title_en'),
    title_fr: (form.get('title_fr') as string) || '',
    body_en: form.get('body_en') || null,
    body_fr: form.get('body_fr') || null,
    image: form.get('image') || null,
    link_url: form.get('link_url') || null,
    link_label_en: form.get('link_label_en') || null,
    link_label_fr: form.get('link_label_fr') || null,
    position: form.get('position') || 0,
    is_visible: form.get('is_visible') === 'on' || form.get('is_visible') === 'true',
  });
}

export async function createDepartment(form: FormData) {
  const data = parse(form);
  const supabase = (await createClient()) as any;
  const { data: row, error } = await supabase
    .from('home_departments')
    .insert({ ...data, title_fr: data.title_fr ?? '' })
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  revalidatePath('/admin/departments');
  revalidatePath('/[locale]', 'page');
  redirect(`/admin/departments/${row.id}`);
}

export async function updateDepartment(id: string, form: FormData) {
  const data = parse(form);
  const supabase = (await createClient()) as any;
  const { error } = await supabase
    .from('home_departments')
    .update({ ...data, title_fr: data.title_fr ?? '', updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/departments');
  revalidatePath(`/admin/departments/${id}`);
  revalidatePath('/[locale]', 'page');
}

export async function deleteDepartment(id: string) {
  const supabase = (await createClient()) as any;
  const { error } = await supabase.from('home_departments').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/departments');
  revalidatePath('/[locale]', 'page');
  redirect('/admin/departments');
}
