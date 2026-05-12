'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { publicMediaUrl } from '@/lib/utils/storage';
import { Upload, X, FolderOpen } from 'lucide-react';
import { MediaPicker } from './MediaPicker';

export function ImageUpload({
  name,
  defaultValue,
  pathPrefix,
  label = 'Image',
  hint,
}: {
  name: string;
  defaultValue?: string | null;
  /** e.g. "services/skeletonisation" — files land at `media/<pathPrefix>/<file>` */
  pathPrefix: string;
  label?: string;
  /** Recommended dimensions / format hint shown under the uploader. */
  hint?: string;
}) {
  const [value, setValue] = useState<string>(defaultValue ?? '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const url = publicMediaUrl(value);

  async function onFile(file: File) {
    setBusy(true);
    setErr(null);
    setDims(null);

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    let payload: Blob = file;
    let ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
    let contentType = file.type || 'application/octet-stream';

    if (isImage && file.type !== 'image/svg+xml' && file.type !== 'image/gif') {
      // Resize to max 2400px long edge and re-encode as WebP at q=0.82.
      try {
        const optimised = await resizeAndEncode(file, 2400, 0.82);
        if (optimised) {
          payload = optimised.blob;
          ext = 'webp';
          contentType = 'image/webp';
          setDims({ w: optimised.width, h: optimised.height });
        }
      } catch {
        // fall through and upload the original
      }
    } else if (isImage) {
      // Still capture dims for the hint, but upload as-is.
      try {
        const bmp = await createImageBitmap(file);
        setDims({ w: bmp.width, h: bmp.height });
        bmp.close();
      } catch {
        /* ignore */
      }
    }

    const supabase = createClient();
    const path = `${pathPrefix.replace(/^\/+|\/+$/g, '')}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('media')
      .upload(path, payload, { upsert: true, contentType });
    if (error) {
      setErr(error.message);
      setBusy(false);
      return;
    }
    setValue(`media/${path}`);
    setBusy(false);
    void isVideo; // silence unused-var lint; videos take the as-is path.
  }

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-text-muted">{label}</p>
      {hint && <p className="text-[10px] text-text-muted/70 mt-1">{hint}</p>}
      <input type="hidden" name={name} value={value} />

      {url ? (
        <div className="mt-2 relative inline-block group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className="max-h-64 border border-divider object-cover" />
          <button
            type="button"
            onClick={() => setValue('')}
            className="absolute top-2 right-2 bg-bg-primary/80 border border-divider p-1 hover:border-accent"
            aria-label="Remove image"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div className="mt-2 grid gap-2">
          <label className="flex flex-col items-center justify-center gap-2 border border-dashed border-divider bg-bg-secondary/50 py-10 px-6 text-text-muted text-sm cursor-pointer hover:border-accent hover:text-accent transition-colors">
            <Upload size={20} />
            <span>{busy ? 'Uploading…' : 'Click to upload'}</span>
            <input
              type="file"
              accept="image/*,video/mp4"
              disabled={busy}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f);
              }}
              className="hidden"
            />
          </label>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="flex items-center justify-center gap-2 border border-divider bg-bg-secondary/30 py-2.5 px-4 text-xs uppercase tracking-[0.2em] text-text-muted hover:border-accent hover:text-accent transition-colors"
          >
            <FolderOpen size={14} />
            Choose from library
          </button>
        </div>
      )}
      {dims && (
        <p className="mt-2 text-[10px] text-text-muted">
          Uploaded: {dims.w}×{dims.h}px
        </p>
      )}
      {err && <p className="mt-2 text-xs text-red-400">{err}</p>}

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(path) => {
          setValue(path);
          setErr(null);
        }}
      />
    </div>
  );
}

async function resizeAndEncode(
  file: File,
  maxEdge: number,
  quality: number,
): Promise<{ blob: Blob; width: number; height: number } | null> {
  const bitmap = await createImageBitmap(file);
  const { width: w, height: h } = bitmap;
  const scale = Math.min(1, maxEdge / Math.max(w, h));
  const targetW = Math.round(w * scale);
  const targetH = Math.round(h * scale);

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    return null;
  }
  ctx.drawImage(bitmap, 0, 0, targetW, targetH);
  bitmap.close();

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/webp', quality),
  );
  if (!blob) return null;
  return { blob, width: targetW, height: targetH };
}
