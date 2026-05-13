import { ContactView } from '@/components/site/ContactView';
import { createClient } from '@/lib/supabase/server';
import { pickLocale } from '@/lib/i18n/pick';
import type { Locale } from '@/lib/i18n/config';

export const revalidate = 60;

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = (await createClient()) as any;
  const { data } = await supabase
    .from('pages')
    .select('hero_heading_en, hero_heading_fr, body_en, body_fr, success_title_en, success_title_fr, success_body_en, success_body_fr')
    .eq('key', 'contact')
    .maybeSingle();

  const loc = locale as Locale;
  const titleOverride = pickLocale(data, 'hero_heading', loc);
  const subtitleOverride = pickLocale(data, 'body', loc);
  const successTitleOverride = pickLocale(data, 'success_title', loc);
  const successBodyOverride = pickLocale(data, 'success_body', loc);

  return (
    <ContactView
      locale={locale}
      titleOverride={titleOverride ?? null}
      subtitleOverride={subtitleOverride ?? null}
      successTitleOverride={successTitleOverride ?? null}
      successBodyOverride={successBodyOverride ?? null}
    />
  );
}
