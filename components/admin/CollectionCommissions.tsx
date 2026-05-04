'use client';

import { useState, useTransition } from 'react';
import { publicMediaUrl } from '@/lib/utils/storage';
import { ArrowDown, ArrowUp, X } from 'lucide-react';

type Option = {
  id: string;
  slug: string;
  title_en: string | null;
  watch_model: string | null;
  card_image: string | null;
  hero_image: string | null;
};

type Member = Option & { position: number };

export function CollectionCommissions({
  collectionId,
  options,
  initial,
  addAction,
  removeAction,
  setPositionAction,
}: {
  collectionId: string;
  options: Option[];
  initial: Member[];
  addAction: (collectionId: string, commissionId: string) => Promise<void>;
  removeAction: (collectionId: string, commissionId: string) => Promise<void>;
  setPositionAction: (collectionId: string, commissionId: string, position: number) => Promise<void>;
}) {
  const [members, setMembers] = useState<Member[]>(
    [...initial].sort((a, b) => a.position - b.position),
  );
  const [, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const memberIds = new Set(members.map((m) => m.id));
  const available = options.filter((o) => !memberIds.has(o.id));

  function add(c: Option) {
    const nextPos = members.length === 0 ? 0 : Math.max(...members.map((m) => m.position)) + 1;
    setMembers((prev) => [...prev, { ...c, position: nextPos }]);
    startTransition(async () => {
      try {
        await addAction(collectionId, c.id);
      } catch (e) {
        setErr((e as Error).message);
      }
    });
  }

  function remove(id: string) {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    startTransition(async () => {
      try {
        await removeAction(collectionId, id);
      } catch (e) {
        setErr((e as Error).message);
      }
    });
  }

  function move(id: string, dir: -1 | 1) {
    const idx = members.findIndex((m) => m.id === id);
    const swap = idx + dir;
    if (idx < 0 || swap < 0 || swap >= members.length) return;
    const a = members[idx];
    const b = members[swap];
    setMembers((prev) =>
      prev
        .map((m) => {
          if (m.id === a.id) return { ...m, position: b.position };
          if (m.id === b.id) return { ...m, position: a.position };
          return m;
        })
        .sort((x, y) => x.position - y.position),
    );
    startTransition(async () => {
      try {
        await setPositionAction(collectionId, a.id, b.position);
        await setPositionAction(collectionId, b.id, a.position);
      } catch (e) {
        setErr((e as Error).message);
      }
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Commissions in this collection</p>
        <p className="text-xs text-text-muted">{members.length} item{members.length === 1 ? '' : 's'}</p>
      </div>

      {members.length > 0 && (
        <div className="mt-3 grid gap-2">
          {members.map((c, i) => {
            const img = publicMediaUrl(c.card_image ?? c.hero_image);
            return (
              <div key={c.id} className="flex items-center gap-3 border border-divider bg-bg-secondary/30 p-2">
                <span className="text-xs text-text-muted w-6 text-right">{i + 1}</span>
                <div className="w-12 h-12 bg-bg-secondary border border-divider overflow-hidden flex-shrink-0">
                  {img && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-serif text-base truncate">{c.title_en}</p>
                  <p className="text-xs text-text-muted truncate">{c.watch_model}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => move(c.id, -1)}
                    disabled={i === 0}
                    aria-label="Move up"
                    className="p-1 border border-divider hover:border-accent disabled:opacity-30"
                  >
                    <ArrowUp size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(c.id, 1)}
                    disabled={i === members.length - 1}
                    aria-label="Move down"
                    className="p-1 border border-divider hover:border-accent disabled:opacity-30"
                  >
                    <ArrowDown size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(c.id)}
                    aria-label="Remove"
                    className="p-1 border border-divider hover:border-accent text-text-muted hover:text-accent"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {available.length > 0 && (
        <div className="mt-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Add commissions</p>
          <div className="mt-2 grid gap-1 max-h-72 overflow-y-auto border border-divider">
            {available.map((c) => {
              const img = publicMediaUrl(c.card_image ?? c.hero_image);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => add(c)}
                  className="flex items-center gap-3 p-2 hover:bg-bg-secondary/50 text-left"
                >
                  <div className="w-10 h-10 bg-bg-secondary border border-divider overflow-hidden flex-shrink-0">
                    {img && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-sm truncate">{c.title_en}</p>
                    <p className="text-xs text-text-muted truncate">{c.watch_model}</p>
                  </div>
                  <span className="text-xs uppercase tracking-[0.2em] text-text-muted">+ Add</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {members.length === 0 && available.length === 0 && (
        <p className="mt-3 text-xs text-text-muted">No commissions exist yet. Create one first.</p>
      )}

      {err && <p className="mt-3 text-xs text-red-400">{err}</p>}
    </div>
  );
}
