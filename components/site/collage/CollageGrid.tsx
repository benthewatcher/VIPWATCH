'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';

export type CollageItem = {
  id: string;
  slug: string;
  title: string;
  image: string;
};

type Sampled = CollageItem & { hue: number; sat: number; light: number; ready: boolean };

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h *= 60;
  }
  return { h, s, l };
}

async function sampleColor(src: string): Promise<{ h: number; s: number; l: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';
    img.onload = () => {
      try {
        const size = 24;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;
        let r = 0;
        let g = 0;
        let b = 0;
        let n = 0;
        for (let i = 0; i < data.length; i += 4) {
          const pr = data[i];
          const pg = data[i + 1];
          const pb = data[i + 2];
          const pa = data[i + 3];
          if (pa < 200) continue;
          const max = Math.max(pr, pg, pb);
          const min = Math.min(pr, pg, pb);
          // skip near-black and near-white pixels — they mute the average.
          if (max < 30 || min > 225) continue;
          // skip greys (very low chroma)
          if (max - min < 18) continue;
          r += pr;
          g += pg;
          b += pb;
          n++;
        }
        if (n === 0) {
          // fall back to plain average so the tile still gets placed
          for (let i = 0; i < data.length; i += 4) {
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
            n++;
          }
        }
        resolve(rgbToHsl(r / n, g / n, b / n));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

const BANDS: Array<{ name: string; min: number; max: number }> = [
  { name: 'Red', min: 345, max: 360 },
  { name: 'Red', min: 0, max: 15 },
  { name: 'Orange', min: 15, max: 45 },
  { name: 'Gold', min: 45, max: 65 },
  { name: 'Yellow', min: 65, max: 80 },
  { name: 'Green', min: 80, max: 165 },
  { name: 'Teal', min: 165, max: 195 },
  { name: 'Blue', min: 195, max: 255 },
  { name: 'Violet', min: 255, max: 290 },
  { name: 'Magenta', min: 290, max: 345 },
];

function bandIndex(hue: number) {
  for (let i = 0; i < BANDS.length; i++) {
    if (hue >= BANDS[i].min && hue < BANDS[i].max) return i;
  }
  return BANDS.length - 1;
}

export function CollageGrid({ items, locale }: { items: CollageItem[]; locale: string }) {
  const [sampled, setSampled] = useState<Sampled[]>(() =>
    items.map((i) => ({ ...i, hue: 0, sat: 0, light: 0, ready: false })),
  );
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    let cancelled = false;
    (async () => {
      const next = await Promise.all(
        items.map(async (item, idx) => {
          const c = await sampleColor(item.image);
          if (!c) {
            return { ...item, hue: 0, sat: 0, light: 0, ready: false } satisfies Sampled;
          }
          // small deterministic jitter so identical hues don't all stack
          return {
            ...item,
            hue: (c.h + idx * 0.0001) % 360,
            sat: c.s,
            light: c.l,
            ready: true,
          } satisfies Sampled;
        }),
      );
      if (!cancelled) setSampled(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [items]);

  const sorted = useMemo(() => {
    const ready = sampled.filter((s) => s.ready);
    const fallback = sampled.filter((s) => !s.ready);
    ready.sort((a, b) => {
      const bi = bandIndex(a.hue) - bandIndex(b.hue);
      if (bi !== 0) return bi;
      if (a.hue !== b.hue) return a.hue - b.hue;
      return b.sat - a.sat;
    });
    return [...ready, ...fallback];
  }, [sampled]);

  const grouped = useMemo(() => {
    const groups = new Map<string, Sampled[]>();
    for (const s of sorted) {
      if (!s.ready) continue;
      const key = BANDS[bandIndex(s.hue)].name;
      const arr = groups.get(key) ?? [];
      arr.push(s);
      groups.set(key, arr);
    }
    return groups;
  }, [sorted]);

  const readyCount = sampled.filter((s) => s.ready).length;
  const progress = items.length === 0 ? 1 : readyCount / items.length;

  return (
    <div>
      <div className="sticky top-[72px] z-30 backdrop-blur supports-[backdrop-filter]:bg-bg-primary/70 border-b border-divider">
        <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-text-muted">
          <span>
            {readyCount} / {items.length} {locale === 'ar' ? 'محلَّلة' : 'tuned'}
          </span>
          <div className="flex-1 mx-6 h-px bg-divider relative overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-accent transition-all duration-500"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <span>{Array.from(grouped.keys()).join(' · ')}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-[2px] bg-divider">
        {sorted.map((s) => (
          <Link
            key={s.id}
            href={`/${locale}/commissions/${s.slug}`}
            className="group relative aspect-square overflow-hidden bg-bg-secondary"
            title={s.title}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={s.image}
              alt={s.title}
              loading="lazy"
              crossOrigin="anonymous"
              referrerPolicy="no-referrer"
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${
                s.ready ? 'opacity-100' : 'opacity-50 saturate-0'
              } group-hover:scale-105`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute bottom-0 left-0 right-0 p-2 text-[10px] text-white uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity">
              {s.title}
            </div>
            {s.ready && (
              <span
                className="absolute top-1 right-1 w-2 h-2 rounded-full ring-1 ring-white/60"
                style={{ background: `hsl(${s.hue} ${Math.round(s.sat * 100)}% ${Math.round(s.light * 100)}%)` }}
              />
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
