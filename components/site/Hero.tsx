'use client';

import { motion, useReducedMotion } from 'motion/react';
import Image from 'next/image';
import { type ReactNode } from 'react';

export function Hero({
  image,
  imageMobile,
  video,
  alt = '',
  children,
  align = 'left',
}: {
  image?: string;
  imageMobile?: string;
  video?: string;
  alt?: string;
  children: ReactNode;
  align?: 'left' | 'center';
}) {
  const reduced = useReducedMotion();

  return (
    <section className="relative isolate min-h-[90vh] overflow-hidden flex items-end">
      <div className="absolute inset-0 -z-10">
        {video ? (
          <video
            src={video}
            autoPlay
            muted
            loop
            playsInline
            className="h-full w-full object-cover"
          />
        ) : image || imageMobile ? (
          <motion.div
            className="absolute inset-0"
            initial={reduced ? false : { scale: 1.1 }}
            animate={reduced ? undefined : { scale: 1 }}
            transition={{ duration: 6, ease: [0.22, 1, 0.36, 1] }}
          >
            {imageMobile && (
              <Image
                src={imageMobile}
                alt={alt}
                fill
                priority
                quality={95}
                className="object-cover md:hidden"
                sizes="100vw"
              />
            )}
            {image && (
              <Image
                src={image}
                alt={alt}
                fill
                priority
                quality={95}
                className={`object-cover ${imageMobile ? 'hidden md:block' : ''}`}
                sizes="100vw"
              />
            )}
          </motion.div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-bg-primary via-bg-secondary to-bg-primary" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/90 via-bg-primary/40 to-bg-primary/30" />
      </div>

      <div
        className={
          'relative mx-auto w-full max-w-7xl px-6 py-32 lg:py-40 ' +
          (align === 'center' ? 'text-center' : '')
        }
      >
        {children}
      </div>
    </section>
  );
}
