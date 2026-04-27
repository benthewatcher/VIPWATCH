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
