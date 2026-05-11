import Image from 'next/image';

export function CommissionCardVisual({
  title,
  brand,
  image,
  sizes = '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw',
}: {
  title: string;
  brand?: string | null;
  image?: string | null;
  sizes?: string;
}) {
  return (
    <>
      <div className="relative aspect-[3/4] overflow-hidden bg-bg-secondary border border-divider">
        {image ? (
          <Image
            src={image}
            alt={title}
            fill
            sizes={sizes}
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-text-muted">
            <span className="font-serif text-4xl">{title.slice(0, 1)}</span>
          </div>
        )}
      </div>
      <div className="mt-4">
        <h3 className="font-serif text-2xl group-hover:text-accent transition-colors">
          {title}
        </h3>
      </div>
    </>
  );
}
