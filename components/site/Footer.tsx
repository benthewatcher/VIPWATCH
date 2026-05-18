'use client';

import { getT } from '@/lib/i18n/t';
import Link from 'next/link';
import { NewsletterForm } from './NewsletterForm';

export function Footer({ locale }: { locale: string }) {
  const t = getT(locale, 'footer');
  const tNav = getT(locale, 'nav');
  const tBrand = getT(locale, 'brand');
  const year = new Date().getFullYear();
  const localized = (href: string) => `/${locale}${href === '/' ? '' : href}`;

  return (
    <footer className="border-t border-divider bg-bg-primary">
      <div className="mx-auto max-w-7xl px-6 py-20 grid gap-16 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <div className="font-serif text-2xl tracking-[0.25em] uppercase">{tBrand('name')}</div>
          <p className="mt-4 max-w-md text-sm text-text-muted">{tBrand('tagline')}</p>
        </div>

        <div>
          <h3 className="text-xs uppercase tracking-[0.2em] text-text-muted mb-4">Navigate</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href={localized('/commissions')} className="hover:text-accent">{tNav('commissions')}</Link></li>
            <li><Link href={localized('/atelier')} className="hover:text-accent">{tNav('atelier')}</Link></li>
            <li><Link href={localized('/contact')} className="hover:text-accent">{tNav('contact')}</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs uppercase tracking-[0.2em] text-text-muted mb-4">{t('newsletterHeading')}</h3>
          <p className="text-sm text-text-muted mb-4">{t('newsletterCopy')}</p>
          <NewsletterForm locale={locale} />
        </div>
      </div>

      <div className="border-t border-divider">
        <div className="mx-auto max-w-7xl px-6 py-6 flex flex-col md:flex-row justify-between gap-4 text-xs text-text-muted">
          <span>{t('rights', { year })}</span>
          <div className="flex gap-6">
            <Link href={localized('/legal/privacy')} className="hover:text-accent">Privacy</Link>
            <Link href={localized('/legal/terms')} className="hover:text-accent">Terms</Link>
            <Link href={localized('/legal/legal-notice')} className="hover:text-accent">Legal notice</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
