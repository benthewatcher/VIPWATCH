import type { Locale } from './config';

export function pickLocale<T extends Record<string, unknown>>(
  row: T | null | undefined,
  field: string,
  locale: Locale,
): string | null {
  if (!row) return null;
  const value = row[`${field}_${locale}`] ?? row[`${field}_en`] ?? row[`${field}_fr`];
  return typeof value === 'string' ? value : null;
}
