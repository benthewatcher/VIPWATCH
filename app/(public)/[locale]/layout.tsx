import { NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';
import { locales, type Locale, localeDirs } from '@/lib/i18n/config';
import { Nav } from '@/components/site/Nav';
import { Footer } from '@/components/site/Footer';
import en from '@/messages/en.json';
import ar from '@/messages/ar.json';

const messagesByLocale = { en, ar } as const;

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
  const messages = messagesByLocale[typed];

  return (
    <NextIntlClientProvider messages={messages} locale={typed}>
      <div dir={localeDirs[typed]}>
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </NextIntlClientProvider>
  );
}
