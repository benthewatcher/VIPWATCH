'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/lib/i18n/navigation';
import { LocaleSwitcher } from './LocaleSwitcher';
import { ThemeToggle } from './ThemeToggle';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { key: 'commissions', href: '/commissions' },
  { key: 'services', href: '/services' },
  { key: 'process', href: '/process' },
  { key: 'artsAndCrafts', href: '/arts-and-crafts' },
  { key: 'atelier', href: '/atelier' },
  { key: 'blog', href: '/blog' },
  { key: 'contact', href: '/contact' },
] as const;

export function Nav() {
  const t = useTranslations('nav');
  const tBrand = useTranslations('brand');
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-bg-primary/70 border-b border-divider">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link href="/" className="font-serif text-xl tracking-[0.25em] uppercase">
          {tBrand('name')}
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          {items.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                'text-xs uppercase tracking-[0.2em] text-text-muted hover:text-text-primary transition-colors',
                pathname === item.href && 'text-text-primary',
              )}
            >
              {t(item.key)}
            </Link>
          ))}
          <LocaleSwitcher />
          <ThemeToggle />
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
              href={item.href}
              onClick={() => setOpen(false)}
              className="text-sm uppercase tracking-[0.2em] text-text-muted hover:text-text-primary"
            >
              {t(item.key)}
            </Link>
          ))}
          <div className="pt-2 flex items-center gap-4"><LocaleSwitcher /><ThemeToggle /></div>
        </nav>
      )}
    </header>
  );
}
