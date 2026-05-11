'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

export type CollageItem = {
  id: string;
  slug: string;
  title: string;
  image: string;
};

type Sampled = CollageItem & { hue: number; sat: number; light: number; ready: boolean };

const BANDS = [
  { key: 'red', label: 'Red', min: 345, max: 360, accent: '#e3415a' },
  { key: 'red2', label: 'Red', min: 0, max: 15, accent: '#e3415a' },
  { key: 'orange', label: 'Orange', min: 15, max: 45, accent: '#e08a3a' },
  { key: 'gold', label: 'Gold', min: 45, max: 65, accent: '#d4a93a' },
  { key: 'yellow', label: 'Yellow', min: 65, max: 80, accent: '#e8d24a' },
  { key: 'green', label: 'Green', min: 80, max: 165, accent: '#4caf6a' },
  { key: 'teal', label: 'Teal', min: 165, max: 195, accent: '#3aa6a3' },
  { key: 'blue', label: 'Blue', min: 195, max: 255, accent: '#4080d6' },
  { key: 'violet', label: 'Violet', min: 255, max: 290, accent: '#7c5fd6' },
  { key: 'magenta', label: 'Magenta', min: 290, max: 345, accent: '#c249a8' },
] as const;

type BandKey = (typeof BANDS)[number]['key'];

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

function bandFor(hue: number, sat: number, light: number): BandKey | 'mono' {
  if (sat < 0.12 || light < 0.08 || light > 0.92) return 'mono';
  for (const b of BANDS) {
    if (hue >= b.min && hue < b.max) return b.key;
  }
  return 'red';
}

/** Same-origin URL via Next's image optimizer — canvas can read pixels. */
function sameOriginSampleSrc(src: string) {
  return `/_next/image?url=${encodeURIComponent(src)}&w=64&q=10`;
}

async function sampleColor(src: string): Promise<{ h: number; s: number; l: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
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
          if (max < 25 || min > 230) continue;
          if (max - min < 22) continue;
          r += pr;
          g += pg;
          b += pb;
          n++;
        }
        if (n === 0) {
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
    img.src = sameOriginSampleSrc(src);
  });
}

export function CollageGrid({ items, locale }: { items: CollageItem[]; locale: string }) {
  const [sampled, setSampled] = useState<Sampled[]>(() =>
    items.map((i) => ({ ...i, hue: 0, sat: 0, light: 0, ready: false })),
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Process in small batches so the page doesn't fetch 38 images at once.
      const batchSize = 6;
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const results = await Promise.all(
          batch.map(async (it, j) => {
            const c = await sampleColor(it.image);
            return { it, c, idx: i + j };
          }),
        );
        if (cancelled) return;
        setSampled((prev) => {
          const next = [...prev];
          for (const { it, c, idx } of results) {
            if (c) {
              next[idx] = { ...it, hue: c.h, sat: c.s, light: c.l, ready: true };
            }
          }
          return next;
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [items]);

  const grouped = useMemo(() => {
    const groups = new Map<BandKey | 'mono', Sampled[]>();
    for (const s of sampled) {
      const key = s.ready ? bandFor(s.hue, s.sat, s.light) : 'mono';
      const arr = groups.get(key) ?? [];
      arr.push(s);
      groups.set(key, arr);
    }
    for (const [k, arr] of groups) {
      arr.sort((a, b) => {
        if (!a.ready && b.ready) return 1;
        if (a.ready && !b.ready) return -1;
        if (a.hue !== b.hue) return a.hue - b.hue;
        return b.sat - a.sat;
      });
      groups.set(k, arr);
    }
    return groups;
  }, [sampled]);

  const order: Array<BandKey | 'mono'> = [
    'red',
    'red2',
    'orange',
    'gold',
    'yellow',
    'green',
    'teal',
    'blue',
    'violet',
    'magenta',
    'mono',
  ];

  return (
    <div className="flex flex-col">
      {order.map((key) => {
        const arr = grouped.get(key);
        if (!arr || arr.length === 0) return null;
        const meta = BANDS.find((b) => b.key === key);
        const label = meta?.label ?? (locale === 'ar' ? 'محايد' : 'Mono');
        const accent = meta?.accent ?? '#666';
        return (
          <section key={key} className="border-t border-divider">
            <div className="mx-auto max-w-7xl px-6 py-6 flex items-center gap-4">
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{ backgroundColor: accent }}
                aria-hidden
              />
              <h2 className="text-[11px] uppercase tracking-[0.4em] text-text-muted">
                {label}
                <span className="ml-3 text-text-muted/60">{arr.length}</span>
              </h2>
            </div>
            <div className="mx-auto max-w-7xl px-6 pb-10">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {arr.map((s) => (
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
                    {s.ready && (
                      <span
                        className="absolute top-2 left-2 w-2 h-2 rounded-full ring-1 ring-white/70"
                        style={{
                          background: `hsl(${s.hue} ${Math.round(s.sat * 100)}% ${Math.round(
                            s.light * 100,
                          )}%)`,
                        }}
                      />
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
