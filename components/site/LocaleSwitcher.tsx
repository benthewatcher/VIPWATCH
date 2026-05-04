'use client';

import { usePathname, useRouter } from 'next/navigation';
import { locales } from '@/lib/i18n/config';
import { useTransition } from 'react';

export function LocaleSwitcher({ locale }: { locale: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  // Strip the existing locale prefix to get the bare path.
  const stripped = locales.reduce(
    (p, l) => (p.startsWith(`/${l}`) ? p.slice(l.length + 1) || '/' : p),
    pathname,
  );

  return (
    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em]">
      {locales.map((l, i) => (
        <span key={l} className="flex items-center gap-2">
          {i > 0 && <span className="text-text-muted/50">/</span>}
          <button
            onClick={() =>
              startTransition(() =>
                router.replace(`/${l}${stripped === '/' ? '' : stripped}`),
              )
            }
            className={
              l === locale
                ? 'text-text-primary'
                : 'text-text-muted hover:text-text-primary transition-colors'
            }
          >
            {l}
          </button>
        </span>
      ))}
    </div>
  );
}
