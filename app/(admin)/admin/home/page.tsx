import Link from 'next/link';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Field } from '@/components/admin/Field';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { HomeBlockForm } from '@/components/admin/HomeBlockForm';
import { createClient } from '@/lib/supabase/server';
import { publicMediaUrl } from '@/lib/utils/storage';
import { getCollectionsForHeroCarousel } from '@/lib/queries/home';
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

  const heroSlides = await getCollectionsForHeroCarousel();

  const keys: HomeBlockKey[] = ['atelier_intro', 'process_teaser', 'cta_strip'];

  return (
    <>
      <AdminHeader title="Home page" />
      <main className="p-10 grid gap-12">
        <section className="border border-divider p-8 max-w-5xl">
          <div className="flex items-start justify-between gap-6 mb-6">
            <div>
              <h2 className="font-serif text-2xl">Hero carousel</h2>
              <p className="text-xs text-text-muted mt-1 max-w-xl">
                The home page hero auto-populates one slide per non-private collection,
                in lookbook order. To change an image, eyebrow, title, or order, edit the
                collection itself — there's nothing else to set here.
              </p>
            </div>
            <Link
              href="/admin/collections"
              className="text-xs uppercase tracking-[0.2em] text-accent hover:underline whitespace-nowrap"
            >
              Manage collections →
            </Link>
          </div>

          {heroSlides.length === 0 ? (
            <p className="text-sm text-text-muted">
              No public collections yet. Once you publish one with a cover image, it appears here.
            </p>
          ) : (
            <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {heroSlides.map((c, i) => {
                const url = publicMediaUrl(c.cover_image);
                return (
                  <li key={c.id}>
                    <Link
                      href={`/admin/collections/${c.id}`}
                      className="group block relative aspect-[16/10] overflow-hidden bg-bg-secondary border border-divider hover:border-accent transition-colors"
                    >
                      {url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={url}
                          alt={c.name_en ?? ''}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-3 flex items-end justify-between gap-2 text-white">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.3em] text-accent">{String(i + 1).padStart(2, '0')}</p>
                          <p className="font-serif text-xl leading-tight">{c.name_en ?? c.slug}</p>
                        </div>
                        <span className="text-[10px] uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity">
                          Edit →
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

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
              <HomeBlockForm action={action}>
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
                    hint={
                      key === 'cta_strip'
                        ? '2400×1200 px · 2:1 landscape · used as faded background'
                        : '1200×1500 px · 4:5 portrait · paired beside text'
                    }
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
              </HomeBlockForm>
            </section>
          );
        })}
      </main>
    </>
  );
}
