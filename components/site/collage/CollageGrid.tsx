import Link from 'next/link';

export type CollageItem = {
  id: string;
  slug: string;
  title: string;
  image: string;
};

export function CollageGrid({ items, locale }: { items: CollageItem[]; locale: string }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-[2px] bg-divider">
      {items.map((s) => (
        <Link
          key={s.id}
          href={`/${locale}/commissions/${s.slug}`}
          className="group relative aspect-square overflow-hidden bg-bg-secondary"
          title={s.title}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/_next/image?url=${encodeURIComponent(s.image)}&w=640&q=70`}
            alt={s.title}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute bottom-0 left-0 right-0 p-2 text-[10px] text-white uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity">
            {s.title}
          </div>
        </Link>
      ))}
    </div>
  );
}
