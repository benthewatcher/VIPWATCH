'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { track } from '@/lib/track';

// Fires a 'pageview' event on every client-side navigation. Mounted once in
// the locale layout. Server route silently no-ops if there's no visitor cookie.
export function PageviewTracker() {
  const pathname = usePathname();
  const search = useSearchParams();

  useEffect(() => {
    const path = pathname + (search.size > 0 ? `?${search.toString()}` : '');
    track({ event_type: 'pageview', path });
  }, [pathname, search]);

  return null;
}
