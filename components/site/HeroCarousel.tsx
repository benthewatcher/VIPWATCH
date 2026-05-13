'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export type HeroSlide = {
  id: string;
  href: string;
  title: string;
  eyebrow?: string | null;
  ctaLabel?: string;
  image: string;
  imageMobile?: string | null;
};

/**
 * Full-bleed scrollable hero. Slides auto-advance every 6s; the timer pauses
 * on hover, on interaction, and when the page is hidden. Falls back to a
 * single static slide when only one is passed.
 */
export function HeroCarousel({
  slides,
  intervalMs = 6000,
}: {
  slides: HeroSlide[];
  intervalMs?: number;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const go = useCallback(
    (delta: number) => {
      setIndex((i) => (i + delta + slides.length) % slides.length);
    },
    [slides.length],
  );

  // auto-advance
  useEffect(() => {
    if (slides.length < 2 || paused) return;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, intervalMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [slides.length, paused, intervalMs]);

  // pause when tab hidden
  useEffect(() => {
    function onVis() {
      setPaused(document.hidden);
    }
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  if (slides.length === 0) return null;

  return (
    <section
      className="relative isolate h-[100svh] min-h-[640px] overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
    >
      {/* slides */}
      {slides.map((slide, i) => {
        const active = i === index;
        const distance = Math.abs(i - index);
        // only render the active + neighbour slides as actual <Image>s
        // to keep first-paint light when there are many collections
        const shouldRender = distance <= 1;
        return (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-[1200ms] ease-out ${
              active ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
            aria-hidden={!active}
          >
            {shouldRender && (
              <>
                {slide.imageMobile && (
                  <Image
                    src={slide.imageMobile}
                    alt={slide.title}
                    fill
                    priority={i === 0}
                    quality={88}
                    className="object-cover md:hidden"
                    sizes="100vw"
                  />
                )}
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  priority={i === 0}
                  quality={88}
                  className={`object-cover ${slide.imageMobile ? 'hidden md:block' : ''}`}
                  sizes="100vw"
                />
              </>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/90 via-bg-primary/40 to-bg-primary/20" />
            <div className="relative h-full mx-auto max-w-7xl px-6 py-32 lg:py-40 flex flex-col justify-end">
              {slide.eyebrow && (
                <p className="text-xs uppercase tracking-[0.4em] text-accent">{slide.eyebrow}</p>
              )}
              <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl mt-4 max-w-4xl tracking-tight leading-[1.05]">
                {slide.title}
              </h1>
              <Link
                href={slide.href}
                className="inline-block self-start mt-10 border border-accent px-8 py-3 text-xs uppercase tracking-[0.25em] text-accent hover:bg-accent hover:text-bg-primary transition-colors"
              >
                {slide.ctaLabel ?? 'Explore collection'}
              </Link>
            </div>
          </div>
        );
      })}

      {/* arrows */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => go(-1)}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 grid place-items-center w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 text-white hover:bg-black/60 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => go(1)}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 grid place-items-center w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 text-white hover:bg-black/60 transition-colors"
          >
            <ChevronRight size={18} />
          </button>

          {/* dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? 'w-10 bg-accent' : 'w-4 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
