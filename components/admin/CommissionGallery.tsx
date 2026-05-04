'use client';

import { useMemo, useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { publicMediaUrl } from '@/lib/utils/storage';
import { Upload, X, ArrowUp, ArrowDown } from 'lucide-react';

type GalleryImage = { id: string; url: string; position: number };

export function CommissionGallery({
  commissionId,
  slug,
  initial,
  addAction,
  removeAction,
  setPositionAction,
}: {
  commissionId: string;
  slug: string;
  initial: GalleryImage[];
  addAction: (commissionId: string, url: string) => Promise<GalleryImage>;
  removeAction: (commissionId: string, imageId: string) => Promise<void>;
  setPositionAction: (commissionId: string, imageId: string, position: number) => Promise<void>;
}) {
  const [images, setImages] = useState<GalleryImage[]>(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const sorted = useMemo(
    () => [...images].sort((a, b) => a.position - b.position),
    [images],
  );

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setErr(null);
    const supabase = createClient();
    const added: GalleryImage[] = [];

    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop() || 'bin';
      const path = `commissions/${slug}/gallery/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage
        .from('media')
        .upload(path, file, { upsert: false, contentType: file.type });
      if (error) {
        setErr(error.message);
        continue;
      }
      const stored = `media/${path}`;
      try {
        const row = await addAction(commissionId, stored);
        added.push(row);
      } catch (e) {
        setErr((e as Error).message);
      }
    }

    if (added.length > 0) {
      setImages((prev) => [...prev, ...added]);
    }
    setBusy(false);
  }

  function onRemove(imageId: string) {
    if (!confirm('Remove this image?')) return;
    startTransition(async () => {
      try {
        await removeAction(commissionId, imageId);
        setImages((prev) => prev.filter((i) => i.id !== imageId));
      } catch (e) {
        setErr((e as Error).message);
      }
    });
  }

  function persistPosition(imageId: string, position: number) {
    startTransition(async () => {
      try {
        await setPositionAction(commissionId, imageId, position);
      } catch (e) {
        setErr((e as Error).message);
      }
    });
  }

  // Set explicit position on an image (e.g. from number input).
  function onPositionInput(imageId: string, raw: string) {
    const n = Number.parseInt(raw, 10);
    if (Number.isNaN(n)) return;
    setImages((prev) => prev.map((i) => (i.id === imageId ? { ...i, position: n } : i)));
    persistPosition(imageId, n);
  }

  // Swap an image's position with its neighbour (up/down).
  function move(imageId: string, dir: -1 | 1) {
    const list = sorted;
    const idx = list.findIndex((i) => i.id === imageId);
    const swapIdx = idx + dir;
    if (idx < 0 || swapIdx < 0 || swapIdx >= list.length) return;

    const a = list[idx];
    const b = list[swapIdx];
    setImages((prev) =>
      prev.map((i) => {
        if (i.id === a.id) return { ...i, position: b.position };
        if (i.id === b.id) return { ...i, position: a.position };
        return i;
      }),
    );
    persistPosition(a.id, b.position);
    persistPosition(b.id, a.position);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Gallery</p>
        <p className="text-xs text-text-muted">
          {images.length} image{images.length === 1 ? '' : 's'}
        </p>
      </div>

      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
        {sorted.map((img, i) => {
          const url = publicMediaUrl(img.url);
          return (
            <div
              key={img.id}
              className="relative aspect-[3/4] bg-bg-secondary border border-divider overflow-hidden group flex flex-col"
            >
              {url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt="" className="absolute inset-0 w-full h-full object-cover" />
              )}

              {/* Top-right: remove */}
              <button
                type="button"
                onClick={() => onRemove(img.id)}
                aria-label="Remove image"
                className="absolute top-2 right-2 bg-bg-primary/80 border border-divider p-1 opacity-0 group-hover:opacity-100 hover:border-accent transition-opacity z-10"
              >
                <X size={14} />
              </button>

              {/* Bottom: position controls */}
              <div className="mt-auto bg-bg-primary/80 backdrop-blur-sm border-t border-divider p-2 flex items-center gap-1.5 z-10">
                <button
                  type="button"
                  onClick={() => move(img.id, -1)}
                  disabled={i === 0}
                  aria-label="Move earlier"
                  className="p-1 border border-divider hover:border-accent disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ArrowUp size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => move(img.id, 1)}
                  disabled={i === sorted.length - 1}
                  aria-label="Move later"
                  className="p-1 border border-divider hover:border-accent disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ArrowDown size={12} />
                </button>
                <input
                  type="number"
                  value={img.position}
                  onChange={(e) =>
                    setImages((prev) =>
                      prev.map((p) =>
                        p.id === img.id
                          ? { ...p, position: Number.parseInt(e.target.value, 10) || 0 }
                          : p,
                      ),
                    )
                  }
                  onBlur={(e) => onPositionInput(img.id, e.target.value)}
                  className="w-12 ml-auto bg-transparent text-xs text-text-primary border-b border-divider focus:border-accent outline-none text-right py-0.5"
                  aria-label="Position"
                />
              </div>
            </div>
          );
        })}

        <label className="aspect-[3/4] flex flex-col items-center justify-center gap-2 border border-dashed border-divider bg-bg-secondary/50 text-text-muted text-xs cursor-pointer hover:border-accent hover:text-accent transition-colors p-4 text-center">
          <Upload size={20} />
          <span>{busy ? 'Uploading…' : 'Add images'}</span>
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={busy}
            onChange={(e) => onFiles(e.target.files)}
            className="hidden"
          />
        </label>
      </div>

      {err && <p className="mt-3 text-xs text-red-400">{err}</p>}
      {images.length === 0 && !busy && (
        <p className="mt-3 text-xs text-text-muted">
          Save the commission first, then upload gallery images.
        </p>
      )}
    </div>
  );
}
