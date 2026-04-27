import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/site/PageHeader';

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <Content />;
}

function Content() {
  const t = useTranslations('blog');
  return (
    <>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />
      <section className="mx-auto max-w-7xl px-6 pb-32">
        <p className="text-text-muted max-w-2xl">Content coming soon.</p>
      </section>
    </>
  );
}
