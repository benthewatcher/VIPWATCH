'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { publicMediaUrl } from '@/lib/utils/storage';
import { Upload, X } from 'lucide-react';

export function ImageUpload({
  name,
  defaultValue,
  pathPrefix,
  label = 'Image',
}: {
  name: string;
  defaultValue?: string | null;
  /** e.g. "services/skeletonisation" — files land at `media/<pathPrefix>/<file>` */
  pathPrefix: string;
  label?: string;
}) {
  const [value, setValue] = useState<string>(defaultValue ?? '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const url = publicMediaUrl(value);

  async function onFile(file: File) {
    setBusy(true);
    setErr(null);
    const supabase = createClient();
    const ext = file.name.split('.').pop() || 'bin';
    const path = `${pathPrefix.replace(/^\/+|\/+$/g, '')}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('media')
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) {
      setErr(error.message);
      setBusy(false);
      return;
    }
    setValue(`media/${path}`);
    setBusy(false);
  }

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-text-muted">{label}</p>
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
        <label className="mt-2 flex flex-col items-center justify-center gap-2 border border-dashed border-divider bg-bg-secondary/50 py-10 px-6 text-text-muted text-sm cursor-pointer hover:border-accent hover:text-accent transition-colors">
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
      )}
      {err && <p className="mt-2 text-xs text-red-400">{err}</p>}
    </div>
  );
}
