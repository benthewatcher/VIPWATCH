'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type HomeBlockKey = 'atelier_intro' | 'cta_strip' | 'process_teaser';

export async function updateHomeBlock(blockKey: HomeBlockKey, form: FormData) {
  const patch = {
    is_visible: form.get('is_visible') === 'on' || form.get('is_visible') === 'true',
    eyebrow_en: (form.get('eyebrow_en') as string) || null,
    eyebrow_fr: (form.get('eyebrow_fr') as string) || null,
    title_en: (form.get('title_en') as string) || null,
    title_fr: (form.get('title_fr') as string) || null,
    body_en: (form.get('body_en') as string) || null,
    body_fr: (form.get('body_fr') as string) || null,
    cta_label_en: (form.get('cta_label_en') as string) || null,
    cta_label_fr: (form.get('cta_label_fr') as string) || null,
    cta_url: (form.get('cta_url') as string) || null,
    image: (form.get('image') as string) || null,
    updated_at: new Date().toISOString(),
  };
  const supabase = (await createClient()) as any;
  const { error } = await supabase
    .from('home_blocks')
    .update(patch)
    .eq('block_key', blockKey);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/home');
  revalidatePath('/[locale]', 'page');
}
