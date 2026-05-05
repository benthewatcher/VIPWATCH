import { notFound } from 'next/navigation';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Field, BilingualField } from '@/components/admin/Field';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { createClient } from '@/lib/supabase/server';
import { updatePage } from '../actions';

const ALLOWED = new Set(['home', 'atelier', 'arts-and-crafts', 'warranty', 'process-intro']);

export default async function EditPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (!ALLOWED.has(key)) notFound();

  const supabase = await createClient();
  const { data: row } = await supabase.from('pages').select('*').eq('key', key).maybeSingle();
  // If row is missing, render an empty form — upsert will create it.
  const r = (row ?? { key }) as Record<string, unknown>;
  const action = updatePage.bind(null, key);

  return (
    <>
      <AdminHeader title={key === 'home' ? 'Home page' : key.replace(/-/g, ' ')} back={{ href: '/admin/pages', label: 'Pages' }} />
      <main className="p-10">
        <form action={action} className="grid gap-8 max-w-4xl">
          <div className="grid md:grid-cols-2 gap-6">
            <ImageUpload
              name="hero_image"
              defaultValue={(r.hero_image as string) ?? ''}
              pathPrefix={`pages/${key}`}
              label="Hero image (desktop)"
              hint="2400×1500 px · 16:10 landscape · JPG ≤ 2 MB"
            />
            <ImageUpload
              name="hero_image_mobile"
              defaultValue={(r.hero_image_mobile as string) ?? ''}
              pathPrefix={`pages/${key}`}
              label="Hero image (mobile)"
              hint="1080×1350 px · 4:5 portrait · falls back to desktop if blank"
            />
          </div>

          <Field label="Hero video URL (optional)" name="hero_video" defaultValue={(r.hero_video as string) ?? ''} placeholder="https://… .mp4" />

          <BilingualField label="Hero heading" field="hero_heading" row={r} />

          <div className="grid md:grid-cols-2 gap-6">
            <BilingualField label="CTA label" field="hero_cta_label" row={r} />
            <Field label="CTA link" name="hero_cta_href" defaultValue={(r.hero_cta_href as string) ?? ''} placeholder="/contact" />
          </div>

          <BilingualField label="Body / intro copy" field="body" row={r} textarea rows={6} />

          <details className="border-t border-divider pt-6">
            <summary className="cursor-pointer text-xs uppercase tracking-[0.2em] text-text-muted">SEO metadata</summary>
            <div className="mt-6 grid gap-6">
              <BilingualField label="Meta title" field="meta_title" row={r} />
              <BilingualField label="Meta description" field="meta_description" row={r} textarea rows={2} />
            </div>
          </details>

          <div className="pt-4 border-t border-divider">
            <button
              type="submit"
              className="border border-accent px-8 py-3 text-xs uppercase tracking-[0.25em] text-accent hover:bg-accent hover:text-bg-primary transition-colors"
            >
              Save page
            </button>
          </div>
        </form>
      </main>
    </>
  );
}
