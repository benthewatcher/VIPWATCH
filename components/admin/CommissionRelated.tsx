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

export function CommissionRelated({
  commissionId,
  options,
  initial,
  setAction,
}: {
  commissionId: string;
  options: Option[];
  initial: string[];
  setAction: (commissionId: string, relatedIds: string[]) => Promise<void>;
}) {
  const [selected, setSelected] = useState<string[]>(initial);
  const [, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function persist(next: string[]) {
    setSelected(next);
    startTransition(async () => {
      try {
        await setAction(commissionId, next);
      } catch (e) {
        setErr((e as Error).message);
      }
    });
  }

  function add(id: string) {
    if (selected.includes(id)) return;
    persist([...selected, id]);
  }

  function remove(id: string) {
    persist(selected.filter((x) => x !== id));
  }

  function move(id: string, dir: -1 | 1) {
    const idx = selected.indexOf(id);
    const swap = idx + dir;
    if (idx < 0 || swap < 0 || swap >= selected.length) return;
    const next = [...selected];
    [next[idx], next[swap]] = [next[swap], next[idx]];
    persist(next);
  }

  const optionMap = new Map(options.map((o) => [o.id, o]));
  const available = options.filter((o) => !selected.includes(o.id));

  return (
    <div>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="text-xs uppercase tracking-[0.2em] text-text-muted">More commissions</p>
        <p className="text-xs text-text-muted">
          {selected.length === 0
            ? 'Auto: next 3 by position'
            : `${selected.length} selected`}
        </p>
      </div>

      {selected.length > 0 && (
        <div className="mt-3 grid gap-2">
          {selected.map((id, i) => {
            const c = optionMap.get(id);
            if (!c) return null;
            const img = publicMediaUrl(c.card_image ?? c.hero_image);
            return (
              <div key={id} className="flex items-center gap-3 border border-divider bg-bg-secondary/30 p-2">
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
                    onClick={() => move(id, -1)}
                    disabled={i === 0}
                    aria-label="Move up"
                    className="p-1 border border-divider hover:border-accent disabled:opacity-30"
                  >
                    <ArrowUp size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(id, 1)}
                    disabled={i === selected.length - 1}
                    aria-label="Move down"
                    className="p-1 border border-divider hover:border-accent disabled:opacity-30"
                  >
                    <ArrowDown size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(id)}
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
          <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Add</p>
          <div className="mt-2 grid gap-1 max-h-72 overflow-y-auto border border-divider">
            {available.map((c) => {
              const img = publicMediaUrl(c.card_image ?? c.hero_image);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => add(c.id)}
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

      {selected.length === 0 && available.length === 0 && (
        <p className="mt-3 text-xs text-text-muted">
          No other commissions exist yet. Publish another commission to use it here.
        </p>
      )}

      {err && <p className="mt-3 text-xs text-red-400">{err}</p>}
    </div>
  );
}
