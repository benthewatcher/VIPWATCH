'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { publicMediaUrl } from '@/lib/utils/storage';
import { GripVertical } from 'lucide-react';

type Row = {
  id: string;
  slug: string | null;
  title_en: string | null;
  watch_model: string | null;
  status: string;
  is_featured: boolean | null;
  card_image: string | null;
  hero_image: string | null;
};

export function SortableCommissionsTable({
  initial,
  reorderAction,
  duplicateAction,
}: {
  initial: Row[];
  reorderAction: (orderedIds: string[]) => Promise<void>;
  duplicateAction: (id: string) => Promise<void>;
}) {
  const [rows, setRows] = useState<Row[]>(initial);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [, startTransition] = useTransition();
  const [savingMessage, setSavingMessage] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function onDragStart(i: number) {
    return (e: React.DragEvent) => {
      setDragIndex(i);
      e.dataTransfer.effectAllowed = 'move';
      // Some browsers need data set or drag is cancelled.
      e.dataTransfer.setData('text/plain', String(i));
    };
  }

  function onDragOver(i: number) {
    return (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (overIndex !== i) setOverIndex(i);
    };
  }

  function onDragEnd() {
    setDragIndex(null);
    setOverIndex(null);
  }

  function onDrop(i: number) {
    return (e: React.DragEvent) => {
      e.preventDefault();
      const from = dragIndex;
      setDragIndex(null);
      setOverIndex(null);
      if (from === null || from === i) return;
      const next = [...rows];
      const [moved] = next.splice(from, 1);
      next.splice(i, 0, moved);
      setRows(next);
      const orderedIds = next.map((r) => r.id);
      setSavingMessage('Saving order…');
      setErr(null);
      startTransition(async () => {
        try {
          await reorderAction(orderedIds);
          setSavingMessage('Order saved');
          setTimeout(() => setSavingMessage(null), 1500);
        } catch (e) {
          setErr((e as Error).message);
          setSavingMessage(null);
        }
      });
    };
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3 text-xs text-text-muted">
        <span>Drag the handle to reorder. The first row becomes position 0.</span>
        {savingMessage && <span className="text-accent">{savingMessage}</span>}
        {err && <span className="text-red-400">{err}</span>}
      </div>
      <div className="border border-divider">
        <table className="w-full text-sm">
          <thead className="bg-bg-secondary">
            <tr className="text-left text-xs uppercase tracking-[0.2em] text-text-muted">
              <th className="px-2 py-3 w-8" />
              <th className="px-4 py-3 w-20" />
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Watch</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Featured</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-divider">
            {rows.map((c, i) => {
              const img = publicMediaUrl(c.card_image ?? c.hero_image);
              const isOver = overIndex === i && dragIndex !== null && dragIndex !== i;
              const isDragging = dragIndex === i;
              return (
                <tr
                  key={c.id}
                  draggable
                  onDragStart={onDragStart(i)}
                  onDragOver={onDragOver(i)}
                  onDrop={onDrop(i)}
                  onDragEnd={onDragEnd}
                  className={`${isDragging ? 'opacity-40' : ''} ${isOver ? 'bg-accent/10 outline outline-1 outline-accent' : 'hover:bg-bg-secondary/50'} transition-colors`}
                >
                  <td className="px-2 py-3 cursor-grab active:cursor-grabbing text-text-muted">
                    <GripVertical size={14} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="w-12 h-12 bg-bg-secondary border border-divider overflow-hidden">
                      {img && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-serif text-base">{c.title_en}</td>
                  <td className="px-4 py-3 font-mono text-xs text-text-muted">{c.slug}</td>
                  <td className="px-4 py-3 text-text-muted">{c.watch_model}</td>
                  <td className="px-4 py-3 text-xs uppercase tracking-[0.15em]">
                    <span className={c.status === 'published' ? 'text-accent' : 'text-text-muted'}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{c.is_featured ? '★' : ''}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-4">
                      {c.status === 'published' && c.slug && (
                        <a
                          href={`/en/commissions/${c.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs uppercase tracking-[0.2em] text-text-muted hover:text-accent"
                        >
                          View ↗
                        </a>
                      )}
                      <form action={duplicateAction.bind(null, c.id)}>
                        <button
                          type="submit"
                          className="text-xs uppercase tracking-[0.2em] text-text-muted hover:text-accent"
                        >
                          Duplicate
                        </button>
                      </form>
                      <Link
                        href={`/admin/commissions/${c.id}`}
                        className="text-xs uppercase tracking-[0.2em] text-text-muted hover:text-accent"
                      >
                        Edit →
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-text-muted">
                  No commissions yet. Click <em>New commission</em> to add the first piece.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
