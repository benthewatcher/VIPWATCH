export const locales = ['ar', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  ar: 'English',
  en: 'English',
};

// English-only for now. /ar is redirected to /en by middleware.ts;
// these dirs stay LTR as a belt-and-braces guard in case a stray /ar route slips through.
export const localeDirs: Record<Locale, 'ltr' | 'rtl'> = {
  ar: 'ltr',
  en: 'ltr',
};
