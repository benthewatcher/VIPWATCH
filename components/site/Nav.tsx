'use client';

import { getT } from '@/lib/i18n/t';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LocaleSwitcher } from './LocaleSwitcher';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { key: 'commissions', href: '/commissions' },
  { key: 'collections', href: '/collections' },
  { key: 'lookbook', href: '/lookbook' },
  { key: 'services', href: '/services' },
  { key: 'process', href: '/process' },
  { key: 'artsAndCrafts', href: '/arts-and-crafts' },
  { key: 'atelier', href: '/atelier' },
  { key: 'blog', href: '/blog' },
  { key: 'contact', href: '/contact' },
] as const;

export function Nav({ locale }: { locale: string }) {
  const t = getT(locale, 'nav');
  const tBrand = getT(locale, 'brand');
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // pathname includes the locale prefix (e.g. /ar/services). Strip it for comparisons.
  const stripped = pathname.startsWith(`/${locale}`)
    ? pathname.slice(locale.length + 1) || '/'
    : pathname;

  const localized = (href: string) => `/${locale}${href === '/' ? '' : href}`;

  return (
    <header className="sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-bg-primary/70 border-b border-divider">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link href={`/${locale}`} className="font-serif text-xl tracking-[0.25em] uppercase">
          {tBrand('name')}
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          {items.map((item) => (
            <Link
              key={item.key}
              href={localized(item.href)}
              className={cn(
                'text-xs uppercase tracking-[0.2em] text-text-muted hover:text-text-primary transition-colors',
                stripped === item.href && 'text-text-primary',
              )}
            >
              {t(item.key)}
            </Link>
          ))}
          <LocaleSwitcher locale={locale} />
          <ThemeToggle />
          <UserMenu locale={locale} />
        </nav>

        <button
          aria-label="Toggle menu"
          className="lg:hidden text-text-primary"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <nav className="lg:hidden border-t border-divider px-6 py-6 flex flex-col gap-5 bg-bg-primary">
          {items.map((item) => (
            <Link
              key={item.key}
              href={localized(item.href)}
              onClick={() => setOpen(false)}
              className="text-sm uppercase tracking-[0.2em] text-text-muted hover:text-text-primary"
            >
              {t(item.key)}
            </Link>
          ))}
          <div className="pt-2 flex items-center gap-4">
            <LocaleSwitcher locale={locale} />
            <ThemeToggle />
            <UserMenu locale={locale} />
          </div>
        </nav>
      )}
    </header>
  );
}
