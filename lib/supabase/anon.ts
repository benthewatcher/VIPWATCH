import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

/**
 * Cookie-less Supabase client for build-time use (e.g. generateStaticParams).
 * Reads RLS-permissive public data only.
 */
export function createAnonClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

/**
 * Same as createAnonClient but returns null when the Supabase env vars
 * aren't available — used at build time so generateStaticParams can skip
 * pre-rendering without crashing the whole build.
 */
export function createAnonClientOrNull() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
