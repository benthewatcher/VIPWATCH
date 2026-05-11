import Link from 'next/link';
import { CommissionCardVisual } from '../CommissionCardVisual';
import { LikeButton } from './LikeButton';

export function LookbookCard({
  id,
  slug,
  title,
  brand,
  image,
  locale,
}: {
  id: string;
  slug: string;
  title: string;
  brand?: string | null;
  image?: string | null;
  locale: string;
}) {
  return (
    <div className="relative snap-start shrink-0 w-[78vw] sm:w-[42vw] md:w-[28vw] lg:w-[22vw]">
      <LikeButton commissionId={id} />
      <Link href={`/${locale}/commissions/${slug}`} className="group block">
        <CommissionCardVisual
          title={title}
          brand={brand}
          image={image}
          sizes="(min-width: 1024px) 22vw, (min-width: 640px) 42vw, 78vw"
        />
      </Link>
    </div>
  );
}
