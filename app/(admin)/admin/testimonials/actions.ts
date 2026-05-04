'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const schema = z.object({
  client_name: z.string().min(1),
  client_role: z.string().nullable().optional(),
  photo_url: z.string().nullable().optional(),
  backdrop_image: z.string().nullable().optional(),
  quote_en: z.string().min(1),
  quote_fr: z.string().default(''),
  position: z.coerce.number().int().default(0),
  is_featured: z.coerce.boolean().default(true),
});

function parse(form: FormData) {
  return schema.parse({
    client_name: form.get('client_name'),
    client_role: form.get('client_role') || null,
    photo_url: form.get('photo_url') || null,
    backdrop_image: form.get('backdrop_image') || null,
    quote_en: form.get('quote_en'),
    quote_fr: (form.get('quote_fr') as string) || '',
    position: form.get('position') || 0,
    is_featured: form.get('is_featured') === 'on' || form.get('is_featured') === 'true',
  });
}

export async function createTestimonial(form: FormData) {
  const data = parse(form);
  const supabase = (await createClient()) as any;
  const { data: row, error } = await supabase
    .from('testimonials')
    .insert({ ...data, quote_fr: data.quote_fr ?? '' })
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  revalidatePath('/admin/testimonials');
  revalidatePath('/[locale]', 'page');
  redirect(`/admin/testimonials/${row.id}`);
}

export async function updateTestimonial(id: string, form: FormData) {
  const data = parse(form);
  const supabase = (await createClient()) as any;
  const { error } = await supabase
    .from('testimonials')
    .update({ ...data, quote_fr: data.quote_fr ?? '' })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/testimonials');
  revalidatePath(`/admin/testimonials/${id}`);
  revalidatePath('/[locale]', 'page');
}

export async function deleteTestimonial(id: string) {
  const supabase = (await createClient()) as any;
  const { error } = await supabase.from('testimonials').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/testimonials');
  revalidatePath('/[locale]', 'page');
  redirect('/admin/testimonials');
}
