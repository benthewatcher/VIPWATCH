import { getT } from '@/lib/i18n/t';
import { PageHeader } from '@/components/site/PageHeader';
import { Accordion } from '@/components/site/Accordion';

export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <Content locale={locale} />;
}

const placeholder = [
  {
    id: '1',
    question: 'How long does a commission take?',
    answer:
      'Most commissions take between four and eight months from confirmed brief to delivery, depending on complexity. We give a precise window after the design phase.',
  },
  {
    id: '2',
    question: 'Do you work on watches I do not yet own?',
    answer:
      'No. Every commission starts from a piece you already own. We do not buy or sell watches.',
  },
  {
    id: '3',
    question: 'Is the manufacturer warranty preserved?',
    answer:
      'No personalised piece retains its original manufacturer warranty. We provide our own international warranty on every modification we perform.',
  },
];

function Content({ locale }: { locale: string }) {
  const t = getT(locale, 'faq');
  return (
    <>
      <PageHeader title={t('title')} />
      <section className="mx-auto max-w-3xl px-6 pb-32">
        <Accordion items={placeholder} />
      </section>
    </>
  );
}
