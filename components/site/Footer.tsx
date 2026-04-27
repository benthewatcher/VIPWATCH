import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/routing';
import { NewsletterForm } from './NewsletterForm';

export function Footer() {
  const t = useTranslations('footer');
  const tNav = useTranslations('nav');
  const tBrand = useTranslations('brand');
  const year = new Date().getFullYear();

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
            <li><Link href="/commissions" className="hover:text-accent">{tNav('commissions')}</Link></li>
            <li><Link href="/services" className="hover:text-accent">{tNav('services')}</Link></li>
            <li><Link href="/atelier" className="hover:text-accent">{tNav('atelier')}</Link></li>
            <li><Link href="/contact" className="hover:text-accent">{tNav('contact')}</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs uppercase tracking-[0.2em] text-text-muted mb-4">{t('newsletterHeading')}</h3>
          <p className="text-sm text-text-muted mb-4">{t('newsletterCopy')}</p>
          <NewsletterForm />
        </div>
      </div>

      <div className="border-t border-divider">
        <div className="mx-auto max-w-7xl px-6 py-6 flex flex-col md:flex-row justify-between gap-4 text-xs text-text-muted">
          <span>{t('rights', { year })}</span>
          <div className="flex gap-6">
            <Link href="/legal/privacy" className="hover:text-accent">Privacy</Link>
            <Link href="/legal/terms" className="hover:text-accent">Terms</Link>
            <Link href="/legal/mentions-legales" className="hover:text-accent">Legal</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
