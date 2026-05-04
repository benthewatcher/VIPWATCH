'use client';

import { useMemo, useRef, useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { publicMediaUrl } from '@/lib/utils/storage';
import { Upload, X, ArrowUp, ArrowDown, Folder, Image as ImageIcon } from 'lucide-react';

type GalleryImage = { id: string; url: string; position: number };

const IMAGE_RE = /\.(jpe?g|png|webp|avif|gif|heic|heif|svg)$/i;

/**
 * Recursively walk a DataTransferItemList (drag-and-drop) and return all
 * image File objects found inside, including nested folders.
 */
async function readDroppedItems(items: DataTransferItemList): Promise<File[]> {
  const out: File[] = [];

  async function readEntry(entry: FileSystemEntry | null): Promise<void> {
    if (!entry) return;
    if (entry.isFile) {
      const fileEntry = entry as FileSystemFileEntry;
      const file = await new Promise<File>((res, rej) => fileEntry.file(res, rej));
      if (IMAGE_RE.test(file.name) || file.type.startsWith('image/')) out.push(file);
      return;
    }
    if (entry.isDirectory) {
      const reader = (entry as FileSystemDirectoryEntry).createReader();
      // Directory readers return entries in batches; loop until empty.
      while (true) {
        const batch = await new Promise<FileSystemEntry[]>((res, rej) =>
          reader.readEntries(res, rej),
        );
        if (batch.length === 0) break;
        await Promise.all(batch.map(readEntry));
      }
    }
  }

  const entries: (FileSystemEntry | null)[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.kind !== 'file') continue;
    // webkitGetAsEntry is the de-facto standard for folder drops
    const entry = (item as DataTransferItem & { webkitGetAsEntry: () => FileSystemEntry | null })
      .webkitGetAsEntry();
    entries.push(entry);
  }
  await Promise.all(entries.map(readEntry));
  return out;
}

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
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [, startTransition] = useTransition();

  // Refs for the two hidden inputs (file picker + folder picker)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const sorted = useMemo(
    () => [...images].sort((a, b) => a.position - b.position),
    [images],
  );

  async function uploadAll(files: File[]) {
    if (files.length === 0) return;
    // Filter to images only — folder picks may include other files
    const imageFiles = files.filter(
      (f) => IMAGE_RE.test(f.name) || f.type.startsWith('image/'),
    );
    if (imageFiles.length === 0) {
      setErr('No image files found.');
      return;
    }

    setBusy(true);
    setErr(null);
    setProgress({ done: 0, total: imageFiles.length });

    const supabase = createClient();
    const added: GalleryImage[] = [];

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const ext = file.name.split('.').pop() || 'bin';
      const path = `commissions/${slug}/gallery/${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage
        .from('media')
        .upload(path, file, { upsert: false, contentType: file.type || 'image/jpeg' });
      if (error) {
        setErr(`${file.name}: ${error.message}`);
        setProgress({ done: i + 1, total: imageFiles.length });
        continue;
      }
      const stored = `media/${path}`;
      try {
        const row = await addAction(commissionId, stored);
        added.push(row);
      } catch (e) {
        setErr(`${file.name}: ${(e as Error).message}`);
      }
      setProgress({ done: i + 1, total: imageFiles.length });
    }

    if (added.length > 0) {
      setImages((prev) => [...prev, ...added]);
    }
    setBusy(false);
    setProgress(null);
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

  function onPositionInput(imageId: string, raw: string) {
    const n = Number.parseInt(raw, 10);
    if (Number.isNaN(n)) return;
    setImages((prev) => prev.map((i) => (i.id === imageId ? { ...i, position: n } : i)));
    persistPosition(imageId, n);
  }

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

  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (!busy) setDragging(true);
  }

  function onDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  }

  async function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    if (busy) return;
    const files = await readDroppedItems(e.dataTransfer.items);
    if (files.length > 0) await uploadAll(files);
  }

  return (
    <div onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Gallery</p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
            className="flex items-center gap-2 border border-divider px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-text-muted hover:border-accent hover:text-accent transition-colors disabled:opacity-50"
          >
            <ImageIcon size={12} /> Add images
          </button>
          <button
            type="button"
            onClick={() => folderInputRef.current?.click()}
            disabled={busy}
            className="flex items-center gap-2 border border-divider px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-text-muted hover:border-accent hover:text-accent transition-colors disabled:opacity-50"
          >
            <Folder size={12} /> Add folder
          </button>
          <p className="text-xs text-text-muted">
            {images.length} image{images.length === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => uploadAll(Array.from(e.target.files ?? []))}
        className="hidden"
      />
      <input
        ref={folderInputRef}
        type="file"
        // @ts-expect-error — webkitdirectory is a non-standard but widely-supported attribute
        webkitdirectory=""
        directory=""
        multiple
        onChange={(e) => uploadAll(Array.from(e.target.files ?? []))}
        className="hidden"
      />

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

              <button
                type="button"
                onClick={() => onRemove(img.id)}
                aria-label="Remove image"
                className="absolute top-2 right-2 bg-bg-primary/80 border border-divider p-1 opacity-0 group-hover:opacity-100 hover:border-accent transition-opacity z-10"
              >
                <X size={14} />
              </button>

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

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
          className={`aspect-[3/4] flex flex-col items-center justify-center gap-2 border border-dashed text-xs cursor-pointer transition-colors p-4 text-center ${
            dragging
              ? 'border-accent bg-accent/10 text-accent'
              : 'border-divider bg-bg-secondary/50 text-text-muted hover:border-accent hover:text-accent'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <Upload size={20} />
          {busy && progress ? (
            <span>
              Uploading {progress.done}/{progress.total}…
            </span>
          ) : dragging ? (
            <span>Drop to upload</span>
          ) : (
            <span>
              Click, drag files,
              <br />
              or drag a folder here
            </span>
          )}
        </button>
      </div>

      {err && <p className="mt-3 text-xs text-red-400">{err}</p>}
      {images.length === 0 && !busy && (
        <p className="mt-3 text-xs text-text-muted">
          Save the commission first, then upload gallery images. Drag a whole folder onto the gallery to add everything inside.
        </p>
      )}
    </div>
  );
}
