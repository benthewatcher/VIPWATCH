'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/lib/i18n/routing';
import { locales, type Locale } from '@/lib/i18n/config';
import { useTransition } from 'react';

export function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em]">
      {locales.map((l, i) => (
        <span key={l} className="flex items-center gap-2">
          {i > 0 && <span className="text-text-muted/50">/</span>}
          <button
            onClick={() => startTransition(() => router.replace(pathname, { locale: l }))}
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
