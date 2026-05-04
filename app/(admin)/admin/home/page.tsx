import Link from 'next/link';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Field } from '@/components/admin/Field';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { createClient } from '@/lib/supabase/server';
import { updateHomeBlock, type HomeBlockKey } from './actions';

export const metadata = { title: 'Home page' };

const BLOCK_META: Record<
  HomeBlockKey,
  { label: string; intro: string; needsImage: boolean; needsCta: boolean }
> = {
  atelier_intro: {
    label: 'Atelier intro · "From the bench"',
    intro: 'Short editorial block introducing the atelier and Ben. Pairs with a portrait or workshop shot.',
    needsImage: true,
    needsCta: true,
  },
  process_teaser: {
    label: 'Process teaser',
    intro: 'Heading + intro for the homepage process snippet. The 3 steps are pulled from /admin/process.',
    needsImage: false,
    needsCta: true,
  },
  cta_strip: {
    label: 'CTA strip · "Begin a commission"',
    intro: 'Full-bleed call-to-action strip at the bottom of the homepage. Background image is recommended.',
    needsImage: true,
    needsCta: true,
  },
};

export default async function AdminHomePage() {
  const supabase = (await createClient()) as any;
  const { data: rows } = await supabase
    .from('home_blocks')
    .select('block_key, is_visible, eyebrow_en, eyebrow_fr, title_en, title_fr, body_en, body_fr, cta_label_en, cta_label_fr, cta_url, image');
  const byKey = new Map(((rows ?? []) as any[]).map((r) => [r.block_key, r]));

  const keys: HomeBlockKey[] = ['atelier_intro', 'process_teaser', 'cta_strip'];

  return (
    <>
      <AdminHeader title="Home page" />
      <main className="p-10 grid gap-12">
        <div className="bg-bg-secondary/30 border border-divider p-6 max-w-4xl">
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Other home content</p>
          <ul className="mt-3 grid gap-2 text-sm">
            <li>
              <Link href="/admin/pages/home" className="text-accent hover:underline">→ Hero · headline, image, CTA, SEO meta</Link>
            </li>
            <li>
              <Link href="/admin/commissions" className="text-accent hover:underline">→ Featured commissions (mark <em>Feature on home</em>)</Link>
            </li>
            <li>
              <Link href="/admin/collections" className="text-accent hover:underline">→ Featured collections</Link>
            </li>
            <li>
              <Link href="/admin/departments" className="text-accent hover:underline">→ Departments (image tiles)</Link>
            </li>
            <li>
              <Link href="/admin/testimonials" className="text-accent hover:underline">→ Testimonials with backdrop</Link>
            </li>
          </ul>
        </div>

        {keys.map((key) => {
          const row = byKey.get(key) ?? { block_key: key };
          const meta = BLOCK_META[key];
          const action = updateHomeBlock.bind(null, key);
          return (
            <section key={key} className="border border-divider p-8 max-w-4xl">
              <div className="flex items-start justify-between gap-6 mb-6">
                <div>
                  <h2 className="font-serif text-2xl">{meta.label}</h2>
                  <p className="text-xs text-text-muted mt-1">{meta.intro}</p>
                </div>
              </div>
              <form action={action} className="grid gap-6">
                <label className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-text-muted">
                  <input type="checkbox" name="is_visible" defaultChecked={row.is_visible ?? true} />
                  Visible on home
                </label>

                {meta.needsImage && (
                  <ImageUpload
                    name="image"
                    defaultValue={row.image ?? ''}
                    pathPrefix={`home_blocks/${key}`}
                    label="Image"
                  />
                )}

                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Eyebrow (small label)</p>
                  <div className="mt-2 grid gap-3 md:grid-cols-2">
                    <Field label="EN" name="eyebrow_en" defaultValue={row.eyebrow_en ?? ''} placeholder="From the bench" />
                    <Field label="AR" name="eyebrow_fr" defaultValue={row.eyebrow_fr ?? ''} dir="rtl" />
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Title</p>
                  <div className="mt-2 grid gap-3 md:grid-cols-2">
                    <Field label="EN" name="title_en" defaultValue={row.title_en ?? ''} />
                    <Field label="AR" name="title_fr" defaultValue={row.title_fr ?? ''} dir="rtl" />
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Body</p>
                  <div className="mt-2 grid gap-3 md:grid-cols-2">
                    <Field label="EN" name="body_en" defaultValue={row.body_en ?? ''} textarea rows={4} />
                    <Field label="AR" name="body_fr" defaultValue={row.body_fr ?? ''} textarea rows={4} dir="rtl" />
                  </div>
                </div>

                {meta.needsCta && (
                  <div className="grid gap-3 md:grid-cols-3">
                    <Field label="CTA label EN" name="cta_label_en" defaultValue={row.cta_label_en ?? ''} placeholder="Begin a commission" />
                    <Field label="CTA label AR" name="cta_label_fr" defaultValue={row.cta_label_fr ?? ''} dir="rtl" />
                    <Field label="CTA URL" name="cta_url" defaultValue={row.cta_url ?? ''} placeholder="/contact" />
                  </div>
                )}

                <div className="pt-4 border-t border-divider">
                  <button
                    type="submit"
                    className="border border-accent px-8 py-3 text-xs uppercase tracking-[0.25em] text-accent hover:bg-accent hover:text-bg-primary transition-colors"
                  >
                    Save block
                  </button>
                </div>
              </form>
            </section>
          );
        })}
      </main>
    </>
  );
}
