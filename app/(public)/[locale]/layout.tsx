import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { locales, type Locale, localeDirs } from '@/lib/i18n/config';
import { Nav } from '@/components/site/Nav';
import { Footer } from '@/components/site/Footer';
import { WhatsAppButton } from '@/components/site/WhatsAppButton';
import { BeginCommissionCTA } from '@/components/site/BeginCommissionCTA';
import { VisitorBanner } from '@/components/site/VisitorBanner';
import { PageviewTracker } from '@/components/site/PageviewTracker';
import { Suspense } from 'react';

// Pages with their own foot CTA — skip the global "Begin a commission" strip
// to avoid duplicate CTAs at the bottom of the page.
const PAGES_WITHOUT_GLOBAL_CTA = new Set<string>(['process']);

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

  const pathname = (await headers()).get('x-pathname') ?? '';
  // e.g. "/en/process" → "process"
  const pageSlug = pathname.replace(/^\/[a-z]{2}\/?/, '').split('/')[0];
  const showGlobalCTA = !PAGES_WITHOUT_GLOBAL_CTA.has(pageSlug);

  return (
    <div dir={localeDirs[typed]}>
      <Nav locale={typed} />
      <main className="flex-1">{children}</main>
      {showGlobalCTA && <BeginCommissionCTA locale={typed} />}
      <Footer locale={typed} />
      <WhatsAppButton locale={typed} />
      <VisitorBanner />
      <Suspense fallback={null}>
        <PageviewTracker />
      </Suspense>
    </div>
  );
}
