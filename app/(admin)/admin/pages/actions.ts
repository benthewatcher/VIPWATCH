'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const pageSchema = z.object({
  key: z.string().min(1),
  hero_image: z.string().nullable().optional(),
  hero_image_mobile: z.string().nullable().optional(),
  hero_video: z.string().nullable().optional(),
  hero_heading_en: z.string().nullable().optional(),
  hero_heading_fr: z.string().nullable().optional(),
  hero_cta_label_en: z.string().nullable().optional(),
  hero_cta_label_fr: z.string().nullable().optional(),
  hero_cta_href: z.string().nullable().optional(),
  body_en: z.string().nullable().optional(),
  body_fr: z.string().nullable().optional(),
  meta_title_en: z.string().nullable().optional(),
  meta_title_fr: z.string().nullable().optional(),
  meta_description_en: z.string().nullable().optional(),
  meta_description_fr: z.string().nullable().optional(),
});

export async function updatePage(key: string, form: FormData) {
  const data = pageSchema.parse({
    key,
    hero_image: form.get('hero_image') || null,
    hero_image_mobile: form.get('hero_image_mobile') || null,
    hero_video: form.get('hero_video') || null,
    hero_heading_en: form.get('hero_heading_en') || null,
    hero_heading_fr: form.get('hero_heading_fr') || null,
    hero_cta_label_en: form.get('hero_cta_label_en') || null,
    hero_cta_label_fr: form.get('hero_cta_label_fr') || null,
    hero_cta_href: form.get('hero_cta_href') || null,
    body_en: form.get('body_en') || null,
    body_fr: form.get('body_fr') || null,
    meta_title_en: form.get('meta_title_en') || null,
    meta_title_fr: form.get('meta_title_fr') || null,
    meta_description_en: form.get('meta_description_en') || null,
    meta_description_fr: form.get('meta_description_fr') || null,
  });

  const supabase = (await createClient()) as any;
  const { error } = await supabase.from('pages').upsert(data, { onConflict: 'key' });
  if (error) throw new Error(error.message);

  revalidatePath('/admin/pages');
  revalidatePath(`/admin/pages/${key}`);
  // Best-effort revalidate the public page
  if (key === 'home') revalidatePath('/[locale]', 'page');
  else revalidatePath(`/[locale]/${key}`, 'page');
}
