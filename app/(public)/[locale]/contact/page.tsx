import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/site/PageHeader';
import { EnquiryForm } from '@/components/site/EnquiryForm';

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <Content />;
}

function Content() {
  const t = useTranslations('contact');
  return (
    <>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />
      <section className="mx-auto max-w-3xl px-6 pb-32">
        <EnquiryForm />
      </section>
    </>
  );
}
