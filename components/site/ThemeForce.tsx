'use client';

import { useEffect } from 'react';

/**
 * Force light or dark mode for the current page only.
 *
 * Doesn't touch next-themes' localStorage, so the visitor's chosen theme is
 * restored when they navigate to a page without an override.
 */
export function ThemeForce({ theme }: { theme: 'system' | 'light' | 'dark' | null | undefined }) {
  useEffect(() => {
    if (!theme || theme === 'system') return;
    const root = document.documentElement;
    const hadDark = root.classList.contains('dark');
    const hadLight = root.classList.contains('light');
    root.classList.remove('dark', 'light');
    root.classList.add(theme);
    return () => {
      root.classList.remove('dark', 'light');
      if (hadDark) root.classList.add('dark');
      if (hadLight) root.classList.add('light');
    };
  }, [theme]);
  return null;
}
