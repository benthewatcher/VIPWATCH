'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

export function createClient() {
  // Fall back to harmless placeholders when env vars aren't injected (e.g.
  // during Next.js prerender of `force-static` pages). The real client is
  // only ever exercised inside useEffect in the browser, where the public
  // env vars are guaranteed to be defined at runtime.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key';
  return createBrowserClient<Database>(url, key);
}
