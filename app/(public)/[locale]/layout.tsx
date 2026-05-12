import { notFound } from 'next/navigation';
import { locales, type Locale, localeDirs } from '@/lib/i18n/config';
import { Nav } from '@/components/site/Nav';
import { Footer } from '@/components/site/Footer';
import { WhatsAppButton } from '@/components/site/WhatsAppButton';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!(locales as readonly string[]).includes(locale)) notFound();
  const typed = locale as Locale;

  return (
    <div dir={localeDirs[typed]}>
      <Nav locale={typed} />
      <main className="flex-1">{children}</main>
      <Footer locale={typed} />
      <WhatsAppButton locale={typed} />
    </div>
  );
}
