import type { Metadata } from 'next';
import { WishlistView } from '@/components/site/lookbook/WishlistView';
import type { Locale } from '@/lib/i18n/config';

export const dynamic = 'force-static';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === 'ar' ? 'قائمة الرغبات' : 'Wishlist',
    robots: { index: false, follow: false },
  };
}

export default async function WishlistPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <WishlistView locale={locale as Locale} />;
}
