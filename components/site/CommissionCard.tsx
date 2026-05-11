import Link from 'next/link';
import { CommissionCardVisual } from './CommissionCardVisual';

export type CommissionCardProps = {
  slug: string;
  title: string;
  brand?: string | null;
  image?: string | null;
  locale: string;
};

export function CommissionCard({ slug, title, brand, image, locale }: CommissionCardProps) {
  return (
    <Link href={`/${locale}/commissions/${slug}`} className="group block">
      <CommissionCardVisual title={title} brand={brand} image={image} />
    </Link>
  );
}
