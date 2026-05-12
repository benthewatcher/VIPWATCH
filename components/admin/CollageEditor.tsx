'use client';

import { useState, useTransition } from 'react';
import { GripVertical, Wand2, Save, Check } from 'lucide-react';

export type Tile = {
  path: string;
  url: string;
  title: string;
  slug: string;
  kind: 'hero' | 'hero_mobile' | 'card' | 'gallery' | 'block';
  savedPosition: number | null;
};

type Sampled = Tile & { hue: number | null; sat: number; light: number };

const BANDS = [
  { min: 345, max: 360 },
  { min: 0, max: 15 },
  { min: 15, max: 45 },
  { min: 45, max: 65 },
  { min: 65, max: 80 },
  { min: 80, max: 165 },
  { min: 165, max: 195 },
  { min: 195, max: 255 },
  { min: 255, max: 290 },
  { min: 290, max: 345 },
] as const;

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

function bandIndex(hue: number) {
  for (let i = 0; i < BANDS.length; i++) {
    if (hue >= BANDS[i].min && hue < BANDS[i].max) return i;
  }
  return BANDS.length - 1;
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
          if (data[i + 3] < 200) continue;
          const mx = Math.max(pr, pg, pb);
          const mn = Math.min(pr, pg, pb);
          if (mx < 25 || mn > 230) continue;
          if (mx - mn < 22) continue;
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
    img.src = `/_next/image?url=${encodeURIComponent(src)}&w=64&q=10`;
  });
}

export function CollageEditor({
  initial,
  save,
}: {
  initial: Tile[];
  save: (orderedPaths: string[]) => Promise<void>;
}) {
  const [tiles, setTiles] = useState<Sampled[]>(() =>
    initial.map((t) => ({ ...t, hue: null, sat: 0, light: 0 })),
  );
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [sampling, setSampling] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  async function autoSort() {
    setSampling(true);
    const next: Sampled[] = [...tiles];
    const batch = 8;
    for (let i = 0; i < next.length; i += batch) {
      const slice = next.slice(i, i + batch);
      const samples = await Promise.all(slice.map((t) => sampleColor(t.url)));
      for (let j = 0; j < slice.length; j++) {
        const c = samples[j];
        const idx = i + j;
        if (c) {
          next[idx] = { ...next[idx], hue: c.h, sat: c.s, light: c.l };
        }
      }
      setTiles([...next]);
    }
    // Sort by hue band, then within band by hue, then saturation.
    next.sort((a, b) => {
      const ah = a.hue;
      const bh = b.hue;
      if (ah === null && bh === null) return 0;
      if (ah === null) return 1;
      if (bh === null) return -1;
      const ab = bandIndex(ah);
      const bb = bandIndex(bh);
      if (ab !== bb) return ab - bb;
      if (ah !== bh) return ah - bh;
      return b.sat - a.sat;
    });
    setTiles(next);
    setSampling(false);
  }

  function move(from: number, to: number) {
    if (from === to) return;
    setTiles((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }

  function onSave() {
    startTransition(async () => {
      await save(tiles.map((t) => t.path));
      setSavedAt(Date.now());
      setTimeout(() => setSavedAt(null), 2500);
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-6 sticky top-0 z-10 bg-bg-primary py-3 -mx-10 px-10 border-b border-divider">
        <span className="text-xs uppercase tracking-[0.2em] text-text-muted">
          {tiles.length} tiles · drag to reorder
        </span>
        <div className="flex-1" />
        <button
          type="button"
          onClick={autoSort}
          disabled={sampling}
          className="flex items-center gap-2 border border-divider px-4 py-2 text-xs uppercase tracking-[0.2em] text-text-muted hover:border-accent hover:text-accent transition-colors disabled:opacity-50"
        >
          <Wand2 size={14} />
          {sampling ? 'Sampling colours…' : 'Auto-sort by colour'}
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={pending}
          className="flex items-center gap-2 border border-accent px-5 py-2 text-xs uppercase tracking-[0.2em] text-accent hover:bg-accent hover:text-bg-primary transition-colors disabled:opacity-50"
        >
          {savedAt ? <Check size={14} /> : <Save size={14} />}
          {pending ? 'Saving…' : savedAt ? 'Saved' : 'Save layout'}
        </button>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
        {tiles.map((t, i) => (
          <div
            key={t.path}
            draggable
            onDragStart={() => setDragIndex(i)}
            onDragOver={(e) => {
              e.preventDefault();
              setOverIndex(i);
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (dragIndex !== null) move(dragIndex, i);
              setDragIndex(null);
              setOverIndex(null);
            }}
            onDragEnd={() => {
              setDragIndex(null);
              setOverIndex(null);
            }}
            className={`group relative aspect-square overflow-hidden bg-bg-secondary border ${
              overIndex === i ? 'border-accent' : 'border-divider'
            } cursor-grab active:cursor-grabbing`}
            title={t.title}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/_next/image?url=${encodeURIComponent(t.url)}&w=384&q=60`}
              alt={t.title}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            />
            <div className="absolute top-1 left-1 grid place-items-center w-6 h-6 bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity">
              <GripVertical size={12} />
            </div>
            <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-black/60 text-white text-[8px] uppercase tracking-[0.15em]">
              {t.kind}
            </div>
            {t.hue !== null && (
              <span
                className="absolute bottom-1 left-1 w-3 h-3 rounded-full ring-1 ring-white/70"
                style={{
                  background: `hsl(${t.hue} ${Math.round(t.sat * 100)}% ${Math.round(t.light * 100)}%)`,
                }}
              />
            )}
            <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 text-white text-[9px] tabular-nums">
              {i + 1}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
