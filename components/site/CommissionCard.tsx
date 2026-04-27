import Image from 'next/image';
import { Link } from '@/lib/i18n/routing';

export type CommissionCardProps = {
  slug: string;
  title: string;
  brand?: string | null;
  image?: string | null;
};

export function CommissionCard({ slug, title, brand, image }: CommissionCardProps) {
  return (
    <Link href={`/commissions/${slug}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden bg-bg-secondary border border-divider">
        {image ? (
          <Image
            src={image}
            alt={title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-text-muted">
            <span className="font-serif text-4xl">{title.slice(0, 1)}</span>
          </div>
        )}
      </div>
      <div className="mt-4">
        {brand && (
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">{brand}</p>
        )}
        <h3 className="font-serif text-2xl mt-1 group-hover:text-accent transition-colors">
          {title}
        </h3>
      </div>
    </Link>
  );
}
