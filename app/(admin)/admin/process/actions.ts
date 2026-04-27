'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const stepSchema = z.object({
  number: z.string().min(1).max(8),
  position: z.coerce.number().int().default(0),
  status: z.enum(['draft', 'published', 'archived']).default('published'),
  title_en: z.string().min(1),
  title_fr: z.string().min(1),
  copy_en: z.string().min(1),
  copy_fr: z.string().min(1),
});

function parse(form: FormData) {
  return stepSchema.parse({
    number: form.get('number'),
    position: form.get('position') || 0,
    status: form.get('status') || 'published',
    title_en: form.get('title_en'),
    title_fr: form.get('title_fr'),
    copy_en: form.get('copy_en'),
    copy_fr: form.get('copy_fr'),
  });
}

export async function createProcessStep(form: FormData) {
  const data = parse(form);
  const supabase = await createClient();
  const { data: row, error } = await supabase.from('process_steps').insert(data).select('id').single();
  if (error) throw new Error(error.message);
  revalidatePath('/admin/process');
  revalidatePath('/[locale]/process', 'page');
  redirect(`/admin/process/${row.id}`);
}

export async function updateProcessStep(id: string, form: FormData) {
  const data = parse(form);
  const supabase = await createClient();
  const { error } = await supabase.from('process_steps').update(data).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/process');
  revalidatePath(`/admin/process/${id}`);
  revalidatePath('/[locale]/process', 'page');
}

export async function deleteProcessStep(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('process_steps').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/process');
  revalidatePath('/[locale]/process', 'page');
  redirect('/admin/process');
}
