'use client';

import { useMemo, useState } from 'react';
import {
  CANONICAL_SERVICES,
  parseServices,
  canonicalMatch,
} from '@/lib/commission/services';

/**
 * Renders:
 *  - a checkbox grid of CANONICAL_SERVICES
 *  - a textarea for anything else (one per line)
 *
 * Submits a single hidden input named `services_performed` whose value is the
 * union of the two, newline-separated. The existing server action writes that
 * string straight into commissions.services_performed.
 */
export function ServicesPicker({ defaultValue }: { defaultValue: string | null }) {
  const initial = useMemo(() => {
    const lines = parseServices(defaultValue);
    const selected = new Set<string>();
    const extras: string[] = [];
    for (const line of lines) {
      const hit = canonicalMatch(line);
      if (hit) selected.add(hit);
      else extras.push(line);
    }
    return { selected, extras: extras.join('\n') };
  }, [defaultValue]);

  const [selected, setSelected] = useState<Set<string>>(initial.selected);
  const [extras, setExtras] = useState<string>(initial.extras);

  function toggle(service: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(service)) next.delete(service);
      else next.add(service);
      return next;
    });
  }

  const hiddenValue = [
    ...CANONICAL_SERVICES.filter((s) => selected.has(s)),
    ...parseServices(extras),
  ].join('\n');

  return (
    <div>
      <input type="hidden" name="services_performed" value={hiddenValue} />

      <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Services performed</p>
      <p className="mt-1 text-[10px] text-text-muted/70">
        Tick what applies. Anything unusual goes in &ldquo;Other&rdquo; below.
      </p>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
        {CANONICAL_SERVICES.map((s) => {
          const checked = selected.has(s);
          return (
            <label
              key={s}
              className={`flex items-center gap-2 border px-3 py-2 cursor-pointer transition-colors ${
                checked
                  ? 'border-accent bg-accent/10 text-text-primary'
                  : 'border-divider bg-bg-secondary text-text-muted hover:border-text-muted'
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(s)}
                className="accent-accent"
              />
              <span className="text-xs">{s}</span>
            </label>
          );
        })}
      </div>

      <label className="mt-4 block">
        <span className="text-xs uppercase tracking-[0.2em] text-text-muted">Other (one per line)</span>
        <textarea
          rows={3}
          value={extras}
          onChange={(e) => setExtras(e.target.value)}
          placeholder={'e.g.\nHand-engraved caseback\nCustom rotor'}
          className="mt-2 w-full bg-bg-secondary border border-divider px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
      </label>
    </div>
  );
}
