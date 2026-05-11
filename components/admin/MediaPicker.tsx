'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { publicMediaUrl } from '@/lib/utils/storage';

type FileItem = {
  path: string;
  name: string;
  created_at?: string | null;
  size?: number | null;
};

const IMAGE_EXT = /\.(png|jpe?g|webp|gif|avif|svg)$/i;
const VIDEO_EXT = /\.(mp4|webm|mov|m4v)$/i;

async function walkBucket(): Promise<FileItem[]> {
  const supabase = createClient() as any;
  const out: FileItem[] = [];

  async function walk(prefix: string) {
    const { data, error } = await supabase.storage.from('media').list(prefix, {
      limit: 1000,
      sortBy: { column: 'created_at', order: 'desc' },
    });
    if (error || !data) return;
    for (const item of data as Array<{
      name: string;
      id: string | null;
      created_at?: string | null;
      metadata?: { size?: number } | null;
    }>) {
      const fullPath = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id === null) {
        await walk(fullPath);
      } else {
        out.push({
          path: `media/${fullPath}`,
          name: item.name,
          created_at: item.created_at ?? null,
          size: item.metadata?.size ?? null,
        });
      }
    }
  }

  await walk('');
  return out;
}

export function MediaPicker({
  open,
  onClose,
  onSelect,
  accept = 'image',
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (path: string) => void;
  accept?: 'image' | 'video' | 'any';
}) {
  const [files, setFiles] = useState<FileItem[] | null>(null);
  const [filter, setFilter] = useState('');
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open || files !== null) return;
    walkBucket()
      .then((all) => {
        const matcher = accept === 'image' ? IMAGE_EXT : accept === 'video' ? VIDEO_EXT : null;
        setFiles(matcher ? all.filter((f) => matcher.test(f.name)) : all);
      })
      .catch((e) => setErr(e?.message ?? 'Could not load library'));
  }, [open, files, accept]);

  const filtered = useMemo(() => {
    if (!files) return [];
    if (!filter.trim()) return files;
    const q = filter.toLowerCase();
    return files.filter((f) => f.path.toLowerCase().includes(q));
  }, [files, filter]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-6xl max-h-[90vh] flex flex-col bg-bg-primary border border-divider"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center gap-3 px-6 py-4 border-b border-divider">
          <Search size={16} className="text-text-muted" />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search by name or folder…"
            className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-text-muted"
            autoFocus
          />
          <span className="text-xs uppercase tracking-[0.2em] text-text-muted">
            {files === null ? 'Loading…' : `${filtered.length} / ${files.length}`}
          </span>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="text-text-muted hover:text-text-primary"
          >
            <X size={18} />
          </button>
        </header>

        <div className="overflow-y-auto p-4 flex-1">
          {err ? (
            <p className="text-red-400 text-sm">{err}</p>
          ) : files === null ? (
            <p className="text-text-muted text-sm">Listing media bucket…</p>
          ) : filtered.length === 0 ? (
            <p className="text-text-muted text-sm">No matches.</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {filtered.map((f) => {
                const url = publicMediaUrl(f.path);
                const isVideo = VIDEO_EXT.test(f.name);
                return (
                  <button
                    key={f.path}
                    type="button"
                    onClick={() => {
                      onSelect(f.path);
                      onClose();
                    }}
                    className="group relative aspect-square overflow-hidden bg-bg-secondary border border-divider hover:border-accent transition-colors"
                    title={f.path}
                  >
                    {isVideo ? (
                      <video src={url ?? undefined} muted className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={url ?? ''}
                        alt=""
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute inset-x-0 bottom-0 px-1.5 py-1 bg-black/70 text-[9px] text-white truncate opacity-0 group-hover:opacity-100 transition-opacity">
                      {f.path.replace(/^media\//, '')}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
