'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function saveCollageLayout(orderedPaths: string[]) {
  const supabase = (await createClient()) as any;

  // Upsert every path with its new position.
  const rows = orderedPaths.map((image_path, position) => ({
    image_path,
    position,
    updated_at: new Date().toISOString(),
  }));

  // Replace all: wipe then insert. The table is small (one row per collage
  // image), so a full rewrite is simplest and avoids merging issues.
  const { error: delErr } = await supabase.from('collage_tiles').delete().neq('image_path', '');
  if (delErr) throw new Error(delErr.message);

  if (rows.length > 0) {
    const { error } = await supabase.from('collage_tiles').insert(rows);
    if (error) throw new Error(error.message);
  }

  revalidatePath('/[locale]/collage', 'page');
}
