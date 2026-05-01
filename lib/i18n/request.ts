import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, type Locale } from './config';
import en from '../../messages/en.json';
import fr from '../../messages/fr.json';

const messages: Record<Locale, typeof en> = { en, fr };

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = (locales as readonly string[]).includes(requested ?? '')
    ? (requested as Locale)
    : undefined;

  if (!locale) notFound();

  return {
    locale,
    messages: messages[locale],
  };
});
