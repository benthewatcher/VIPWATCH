'use client';

import { useEffect, useRef } from 'react';
import { LookbookCard } from './LookbookCard';

type Commission = {
  id: string;
  slug: string;
  title: string;
  brand?: string | null;
  image?: string | null;
};

export function LookbookSection({
  name,
  project,
  description,
  videoUrl,
  posterUrl,
  posterUrlMobile,
  commissions,
  locale,
}: {
  name: string;
  project?: string | null;
  description?: string | null;
  videoUrl?: string | null;
  posterUrl?: string | null;
  posterUrlMobile?: string | null;
  commissions: Commission[];
  locale: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  // Pause off-screen videos to keep the page light.
  useEffect(() => {
    const v = videoRef.current;
    const el = sectionRef.current;
    if (!v || !el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          v.play().catch(() => {});
        } else {
          v.pause();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="relative h-[100svh] w-full overflow-hidden">
      {videoUrl ? (
        <video
          ref={videoRef}
          src={videoUrl}
          poster={posterUrl ?? undefined}
          muted
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : posterUrl || posterUrlMobile ? (
        <picture>
          {posterUrlMobile && (
            <source media="(max-width: 767px)" srcSet={posterUrlMobile} />
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={posterUrl ?? posterUrlMobile ?? ''}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        </picture>
      ) : (
        <div className="absolute inset-0 bg-bg-secondary" />
      )}

      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/80" />

      <div className="relative h-full flex flex-col">
        <div className="flex-1 flex items-end px-6 md:px-12 pb-6">
          <div className="text-white">
            {project && (
              <p className="text-[11px] uppercase tracking-[0.4em] text-white/80">{project}</p>
            )}
            <h2 className="font-serif text-5xl md:text-7xl lg:text-8xl tracking-tight leading-[0.95] mt-3">
              {name}
            </h2>
            {description && (
              <p className="mt-4 max-w-xl text-white/80 text-sm md:text-base">{description}</p>
            )}
          </div>
        </div>

        <div
          className="pb-10 overflow-x-auto snap-x snap-mandatory flex gap-5 px-6 md:px-12 [-ms-overflow-style:'none'] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          dir={locale === 'ar' ? 'rtl' : 'ltr'}
        >
          {commissions.length === 0 ? (
            <p className="text-white/70 text-sm">
              {locale === 'ar' ? 'قريبًا.' : 'Coming soon.'}
            </p>
          ) : (
            commissions.map((c) => (
              <LookbookCard
                key={c.id}
                id={c.id}
                slug={c.slug}
                title={c.title}
                brand={c.brand}
                image={c.image}
                locale={locale}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}
