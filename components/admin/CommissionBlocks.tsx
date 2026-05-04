'use client';

import { useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { publicMediaUrl } from '@/lib/utils/storage';
import { ArrowDown, ArrowUp, Image as ImageIcon, Text, Columns2, Trash2, Upload } from 'lucide-react';
import type { CommissionBlockRow, CommissionBlockType } from '@/app/(admin)/admin/commissions/actions';

type Props = {
  commissionId: string;
  slug: string;
  initial: CommissionBlockRow[];
  addAction: (commissionId: string, type: CommissionBlockType) => Promise<CommissionBlockRow>;
  updateAction: (
    commissionId: string,
    blockId: string,
    patch: Partial<Omit<CommissionBlockRow, 'id' | 'position' | 'type'>>,
  ) => Promise<void>;
  removeAction: (commissionId: string, blockId: string) => Promise<void>;
  setPositionAction: (commissionId: string, blockId: string, position: number) => Promise<void>;
};

export function CommissionBlocks({
  commissionId,
  slug,
  initial,
  addAction,
  updateAction,
  removeAction,
  setPositionAction,
}: Props) {
  const [blocks, setBlocks] = useState<CommissionBlockRow[]>(
    [...initial].sort((a, b) => a.position - b.position),
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function addBlock(type: CommissionBlockType) {
    setErr(null);
    setBusy(true);
    startTransition(async () => {
      try {
        const row = await addAction(commissionId, type);
        setBlocks((prev) => [...prev, row].sort((a, b) => a.position - b.position));
      } catch (e) {
        setErr((e as Error).message);
      } finally {
        setBusy(false);
      }
    });
  }

  function patchLocal(id: string, patch: Partial<CommissionBlockRow>) {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }

  function persist(id: string, patch: Partial<Omit<CommissionBlockRow, 'id' | 'position' | 'type'>>) {
    startTransition(async () => {
      try {
        await updateAction(commissionId, id, patch);
      } catch (e) {
        setErr((e as Error).message);
      }
    });
  }

  function remove(id: string) {
    if (!confirm('Remove this block?')) return;
    startTransition(async () => {
      try {
        await removeAction(commissionId, id);
        setBlocks((prev) => prev.filter((b) => b.id !== id));
      } catch (e) {
        setErr((e as Error).message);
      }
    });
  }

  function move(id: string, dir: -1 | 1) {
    const idx = blocks.findIndex((b) => b.id === id);
    const swap = idx + dir;
    if (idx < 0 || swap < 0 || swap >= blocks.length) return;
    const a = blocks[idx];
    const b = blocks[swap];
    setBlocks((prev) =>
      [...prev]
        .map((p) => {
          if (p.id === a.id) return { ...p, position: b.position };
          if (p.id === b.id) return { ...p, position: a.position };
          return p;
        })
        .sort((x, y) => x.position - y.position),
    );
    startTransition(async () => {
      try {
        await setPositionAction(commissionId, a.id, b.position);
        await setPositionAction(commissionId, b.id, a.position);
      } catch (e) {
        setErr((e as Error).message);
      }
    });
  }

  async function uploadImage(file: File, slot: 1 | 2, blockId: string) {
    setErr(null);
    const supabase = createClient();
    const ext = file.name.split('.').pop() || 'bin';
    const path = `commissions/${slug}/blocks/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage
      .from('media')
      .upload(path, file, { upsert: false, contentType: file.type || 'image/jpeg' });
    if (error) {
      setErr(error.message);
      return;
    }
    const stored = `media/${path}`;
    const key = slot === 1 ? 'image_url' : 'image_url_2';
    patchLocal(blockId, { [key]: stored } as Partial<CommissionBlockRow>);
    persist(blockId, { [key]: stored });
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Body sections</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => addBlock('paragraph')}
            disabled={busy}
            className="flex items-center gap-2 border border-divider px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-text-muted hover:border-accent hover:text-accent transition-colors disabled:opacity-50"
          >
            <Text size={12} /> Paragraph
          </button>
          <button
            type="button"
            onClick={() => addBlock('image')}
            disabled={busy}
            className="flex items-center gap-2 border border-divider px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-text-muted hover:border-accent hover:text-accent transition-colors disabled:opacity-50"
          >
            <ImageIcon size={12} /> Image
          </button>
          <button
            type="button"
            onClick={() => addBlock('image_pair')}
            disabled={busy}
            className="flex items-center gap-2 border border-divider px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-text-muted hover:border-accent hover:text-accent transition-colors disabled:opacity-50"
          >
            <Columns2 size={12} /> Image pair
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4">
        {blocks.length === 0 && (
          <p className="text-xs text-text-muted">
            Add paragraph and image blocks to compose the body. They render in the order shown below.
          </p>
        )}

        {blocks.map((block, i) => (
          <div
            key={block.id}
            className="border border-divider bg-bg-secondary/30 p-4 grid gap-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.25em] text-text-muted">
                {block.type.replace('_', ' ')} · #{i + 1}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => move(block.id, -1)}
                  disabled={i === 0}
                  aria-label="Move up"
                  className="p-1 border border-divider hover:border-accent disabled:opacity-30"
                >
                  <ArrowUp size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => move(block.id, 1)}
                  disabled={i === blocks.length - 1}
                  aria-label="Move down"
                  className="p-1 border border-divider hover:border-accent disabled:opacity-30"
                >
                  <ArrowDown size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => remove(block.id)}
                  aria-label="Remove block"
                  className="p-1 border border-divider hover:border-accent text-text-muted hover:text-accent"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>

            {block.type === 'paragraph' && (
              <div className="grid gap-3 md:grid-cols-2">
                <label className="block">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted">EN</span>
                  <textarea
                    rows={5}
                    defaultValue={block.body_en ?? ''}
                    onBlur={(e) => persist(block.id, { body_en: e.target.value })}
                    className="mt-1 w-full bg-bg-primary border border-divider px-3 py-2 text-sm focus:border-accent outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted">AR (optional)</span>
                  <textarea
                    rows={5}
                    defaultValue={block.body_fr ?? ''}
                    onBlur={(e) => persist(block.id, { body_fr: e.target.value })}
                    className="mt-1 w-full bg-bg-primary border border-divider px-3 py-2 text-sm focus:border-accent outline-none"
                  />
                </label>
              </div>
            )}

            {(block.type === 'image' || block.type === 'image_pair') && (
              <div className={`grid gap-3 ${block.type === 'image_pair' ? 'md:grid-cols-2' : ''}`}>
                <ImageSlot
                  url={block.image_url}
                  onUpload={(f) => uploadImage(f, 1, block.id)}
                  onClear={() => {
                    patchLocal(block.id, { image_url: null });
                    persist(block.id, { image_url: null });
                  }}
                />
                {block.type === 'image_pair' && (
                  <ImageSlot
                    url={block.image_url_2}
                    onUpload={(f) => uploadImage(f, 2, block.id)}
                    onClear={() => {
                      patchLocal(block.id, { image_url_2: null });
                      persist(block.id, { image_url_2: null });
                    }}
                  />
                )}
                <div className="grid gap-2 md:col-span-2">
                  <label className="block">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Alt text (EN)</span>
                    <input
                      defaultValue={block.alt_en ?? ''}
                      onBlur={(e) => persist(block.id, { alt_en: e.target.value })}
                      className="mt-1 w-full bg-bg-primary border border-divider px-3 py-2 text-sm focus:border-accent outline-none"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {err && <p className="mt-3 text-xs text-red-400">{err}</p>}
    </div>
  );
}

function ImageSlot({
  url,
  onUpload,
  onClear,
}: {
  url: string | null;
  onUpload: (file: File) => void | Promise<void>;
  onClear: () => void;
}) {
  const display = publicMediaUrl(url);
  return (
    <label className="relative aspect-[3/2] bg-bg-primary border border-divider border-dashed flex items-center justify-center text-xs text-text-muted cursor-pointer hover:border-accent hover:text-accent transition-colors overflow-hidden">
      {display ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={display} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onClear();
            }}
            className="absolute top-2 right-2 bg-bg-primary/80 border border-divider px-2 py-1 text-[10px] uppercase tracking-[0.2em] hover:border-accent z-10"
          >
            Replace
          </button>
        </>
      ) : (
        <span className="flex items-center gap-2">
          <Upload size={14} /> Click to upload
        </span>
      )}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onUpload(f);
          e.target.value = '';
        }}
      />
    </label>
  );
}
