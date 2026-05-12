import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { Hero } from '@/components/site/Hero';
import { FadeUp } from '@/components/site/FadeUp';
import { publicMediaUrl } from '@/lib/utils/storage';
import { pickLocale } from '@/lib/i18n/pick';
import type { Locale } from '@/lib/i18n/config';

export const revalidate = 60;

export default async function CollectionsIndex({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const loc = locale as Locale;
  const supabase = (await createClient()) as any;
  const { data: rows } = await supabase
    .from('commission_collections')
    .select('id, slug, name_en, name_fr, project_en, project_fr, description_en, description_fr, cover_image, position')
    .eq('is_private', false)
    .order('position', { ascending: true });

  return (
    <>
      <Hero alt="">
        <FadeUp>
          <p className="text-xs uppercase tracking-[0.3em] text-accent">
            {loc === 'ar' ? 'المجموعات' : 'Collections'}
          </p>
          <h1 className="font-serif text-5xl md:text-7xl mt-4 max-w-4xl tracking-tight leading-[1.05]">
            {loc === 'ar' ? 'مجموعات منسّقة' : 'Curated collections'}
          </h1>
          <p className="mt-6 max-w-xl text-lg text-text-muted">
            {loc === 'ar'
              ? 'مجموعات مختارة من الأعمال، مرتبة حسب الرؤية والمشروع.'
              : 'Selected groupings of work, organised by vision and project.'}
          </p>
        </FadeUp>
      </Hero>

      <section className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        {(rows ?? []).length === 0 ? (
          <p className="text-text-muted">
            {loc === 'ar' ? 'لا توجد مجموعات بعد.' : 'No collections published yet.'}
          </p>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {(rows ?? []).map((c: any, i: number) => {
              const img = publicMediaUrl(c.cover_image);
              const name = pickLocale(c, 'name', loc) ?? '';
              const project = pickLocale(c, 'project', loc);
              return (
                <FadeUp key={c.id} delay={(i % 3) * 0.08}>
                  <Link href={`/${loc}/collections/${c.slug}`} className="group block">
                    <div className="relative aspect-[3/4] overflow-hidden bg-bg-secondary border border-divider">
                      {img && (
                        <Image
                          src={img}
                          alt={name}
                          fill
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      )}
                    </div>
                    <div className="mt-4">
                      {project && (
                        <p className="text-xs uppercase tracking-[0.2em] text-text-muted">{project}</p>
                      )}
                      <h2 className="font-serif text-2xl mt-1 group-hover:text-accent transition-colors">
                        {name}
                      </h2>
                    </div>
                  </Link>
                </FadeUp>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
