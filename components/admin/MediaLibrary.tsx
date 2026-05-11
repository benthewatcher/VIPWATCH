'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, Copy, Check, Upload } from 'lucide-react';
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
      const full = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id === null) {
        await walk(full);
      } else {
        out.push({
          path: `media/${full}`,
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

type Tab = 'all' | 'image' | 'video';

export function MediaLibrary() {
  const [files, setFiles] = useState<FileItem[] | null>(null);
  const [filter, setFilter] = useState('');
  const [tab, setTab] = useState<Tab>('all');
  const [copied, setCopied] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let mounted = true;
    setFiles(null);
    walkBucket()
      .then((all) => mounted && setFiles(all))
      .catch((e) => mounted && setErr(e?.message ?? 'Could not load'));
    return () => {
      mounted = false;
    };
  }, [reloadKey]);

  const filtered = useMemo(() => {
    if (!files) return [];
    let out = files;
    if (tab === 'image') out = out.filter((f) => IMAGE_EXT.test(f.name));
    if (tab === 'video') out = out.filter((f) => VIDEO_EXT.test(f.name));
    if (filter.trim()) {
      const q = filter.toLowerCase();
      out = out.filter((f) => f.path.toLowerCase().includes(q));
    }
    return out;
  }, [files, filter, tab]);

  async function onUpload(file: File) {
    setUploading(true);
    setErr(null);
    const supabase = createClient();
    const ext = file.name.split('.').pop() || 'bin';
    const safeName = file.name.replace(/\.[^.]+$/, '').replace(/[^a-z0-9-_]/gi, '-').toLowerCase();
    const path = `library/${Date.now()}-${safeName}.${ext}`;
    const { error } = await supabase.storage
      .from('media')
      .upload(path, file, { upsert: false, contentType: file.type });
    setUploading(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setReloadKey((k) => k + 1);
  }

  function copyPath(p: string) {
    navigator.clipboard.writeText(p);
    setCopied(p);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-2 border border-divider bg-bg-secondary px-3 py-2 flex-1 min-w-[260px]">
          <Search size={14} className="text-text-muted" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search by name or folder…"
            className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-text-muted"
          />
        </div>
        <div className="flex border border-divider">
          {(['all', 'image', 'video'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-xs uppercase tracking-[0.2em] ${
                tab === t ? 'bg-accent text-bg-primary' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 border border-divider px-4 py-2 text-xs uppercase tracking-[0.2em] text-text-muted hover:border-accent hover:text-accent transition-colors cursor-pointer">
          <Upload size={14} />
          {uploading ? 'Uploading…' : 'Upload'}
          <input
            type="file"
            accept="image/*,video/*"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUpload(f);
            }}
            className="hidden"
          />
        </label>
        <span className="text-xs uppercase tracking-[0.2em] text-text-muted">
          {files === null ? 'Loading…' : `${filtered.length} / ${files.length}`}
        </span>
      </div>

      {err && <p className="text-red-400 text-sm mb-4">{err}</p>}

      {files === null ? (
        <p className="text-text-muted text-sm">Listing media bucket…</p>
      ) : filtered.length === 0 ? (
        <p className="text-text-muted text-sm">No matches.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filtered.map((f) => {
            const url = publicMediaUrl(f.path);
            const isVideo = VIDEO_EXT.test(f.name);
            return (
              <div
                key={f.path}
                className="group relative aspect-square overflow-hidden bg-bg-secondary border border-divider"
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-x-0 bottom-0 p-2 flex items-end justify-between gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] text-white/90 truncate">{f.path.replace(/^media\//, '')}</span>
                  <button
                    type="button"
                    onClick={() => copyPath(f.path)}
                    aria-label="Copy path"
                    className="grid place-items-center w-7 h-7 bg-black/60 border border-white/20 text-white hover:border-accent hover:text-accent"
                  >
                    {copied === f.path ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
