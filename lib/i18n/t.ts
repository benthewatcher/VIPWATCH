import en from '@/messages/en.json';
import ar from '@/messages/ar.json';
import type { Locale } from './config';

const all = { en, ar } as const;

type Dict = Record<string, unknown>;

/**
 * Plain translation helper — drop-in replacement for next-intl's
 * useTranslations, callable from server *or* client components.
 *
 *   const t = getT(locale, 'home');
 *   t('title');             // "VIP WATCH"
 *   t('hero.subtitle');     // dot-paths supported
 */
export function getT(locale: string, namespace?: string) {
  const dict = ((all as Record<string, Dict>)[locale] ?? (all as Record<string, Dict>).en) as Dict;
  const ns: Dict = namespace ? ((dict[namespace] as Dict) ?? {}) : dict;
  return (key: string): string => {
    const parts = key.split('.');
    let v: unknown = ns;
    for (const p of parts) v = (v as Dict | undefined)?.[p];
    return typeof v === 'string' ? v : key;
  };
}

export type T = ReturnType<typeof getT>;
export type { Locale };
