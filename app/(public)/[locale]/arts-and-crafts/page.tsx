import { getT } from '@/lib/i18n/t';
import { PageHeader } from '@/components/site/PageHeader';

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <Content locale={locale} />;
}

function Content({ locale }: { locale: string }) {
  const t = getT(locale, 'artsAndCrafts');
  return (
    <>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />
      <section className="mx-auto max-w-7xl px-6 pb-32">
        <p className="text-text-muted max-w-2xl">Content coming soon.</p>
      </section>
    </>
  );
}
