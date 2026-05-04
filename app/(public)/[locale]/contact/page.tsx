import { getT } from '@/lib/i18n/t';
import { PageHeader } from '@/components/site/PageHeader';
import { EnquiryForm } from '@/components/site/EnquiryForm';

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <Content locale={locale} />;
}

function Content({ locale }: { locale: string }) {
  const t = getT(locale, 'contact');
  return (
    <>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />
      <section className="mx-auto max-w-3xl px-6 pb-32">
        <EnquiryForm />
      </section>
    </>
  );
}
