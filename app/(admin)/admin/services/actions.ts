'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const serviceSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'lowercase, digits and hyphens only'),
  icon_name: z.string().nullable().optional(),
  hero_image: z.string().nullable().optional(),
  position: z.coerce.number().int().default(0),
  status: z.enum(['draft', 'published', 'archived']).default('published'),
  title_en: z.string().min(1),
  title_fr: z.string().min(1),
  summary_en: z.string().nullable().optional(),
  summary_fr: z.string().nullable().optional(),
  body_en: z.string().nullable().optional(),
  body_fr: z.string().nullable().optional(),
});

function parse(form: FormData) {
  return serviceSchema.parse({
    slug: form.get('slug'),
    icon_name: form.get('icon_name') || null,
    hero_image: form.get('hero_image') || null,
    position: form.get('position') || 0,
    status: form.get('status') || 'published',
    title_en: form.get('title_en'),
    title_fr: form.get('title_fr'),
    summary_en: form.get('summary_en') || null,
    summary_fr: form.get('summary_fr') || null,
    body_en: form.get('body_en') || null,
    body_fr: form.get('body_fr') || null,
  });
}

export async function createService(form: FormData) {
  const data = parse(form);
  const supabase = await createClient();
  const { data: row, error } = await supabase.from('services').insert(data).select('id').single();
  if (error) throw new Error(error.message);
  revalidatePath('/admin/services');
  revalidatePath('/[locale]/services', 'page');
  redirect(`/admin/services/${row.id}`);
}

export async function updateService(id: string, form: FormData) {
  const data = parse(form);
  const supabase = await createClient();
  const { error } = await supabase.from('services').update(data).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/services');
  revalidatePath(`/admin/services/${id}`);
  revalidatePath('/[locale]/services', 'page');
}

export async function deleteService(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('services').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/services');
  revalidatePath('/[locale]/services', 'page');
  redirect('/admin/services');
}
