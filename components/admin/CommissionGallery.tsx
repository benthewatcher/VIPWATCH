'use client';

import { useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { publicMediaUrl } from '@/lib/utils/storage';
import { Upload, X } from 'lucide-react';

type GalleryImage = { id: string; url: string; position: number };

export function CommissionGallery({
  commissionId,
  slug,
  initial,
  addAction,
  removeAction,
}: {
  commissionId: string;
  slug: string;
  initial: GalleryImage[];
  addAction: (commissionId: string, url: string) => Promise<void>;
  removeAction: (commissionId: string, imageId: string) => Promise<void>;
}) {
  const [images, setImages] = useState<GalleryImage[]>(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setErr(null);
    const supabase = createClient();
    const newImages: GalleryImage[] = [];

    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop() || 'bin';
      const path = `commissions/${slug}/gallery/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from('media').upload(path, file, { upsert: false, contentType: file.type });
      if (error) {
        setErr(error.message);
        continue;
      }
      const stored = `media/${path}`;
      try {
        await addAction(commissionId, stored);
        newImages.push({ id: 'pending-' + Date.now() + '-' + Math.random(), url: stored, position: images.length + newImages.length });
      } catch (e) {
        setErr((e as Error).message);
      }
    }

    if (newImages.length > 0) {
      setImages((prev) => [...prev, ...newImages]);
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

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Gallery</p>

      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
        {images.map((img) => {
          const url = publicMediaUrl(img.url);
          return (
            <div key={img.id} className="relative aspect-[3/4] bg-bg-secondary border border-divider overflow-hidden group">
              {url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt="" className="w-full h-full object-cover" />
              )}
              <button
                type="button"
                onClick={() => onRemove(img.id)}
                aria-label="Remove image"
                className="absolute top-2 right-2 bg-bg-primary/80 border border-divider p-1 opacity-0 group-hover:opacity-100 hover:border-accent transition-opacity"
              >
                <X size={14} />
              </button>
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
        <p className="mt-3 text-xs text-text-muted">Save the commission first, then upload gallery images.</p>
      )}
    </div>
  );
}
