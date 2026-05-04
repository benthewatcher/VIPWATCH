// Inspect storage.objects RLS policies for the media bucket.
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n').filter(Boolean).map((l) => l.replace(/^\s*#.*/, '')).filter(Boolean)
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^['"]|['"]$/g, '')]; }),
);

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await admin
  .from('pg_policies' as never)
  .select('*' as never);
if (error) {
  // pg_policies may not be exposed via PostgREST. Use rpc fallback.
  const { data: r, error: e } = await admin.rpc('exec_sql' as never, {
    q: "select policyname, cmd, qual, with_check from pg_policies where schemaname='storage' and tablename='objects'",
  } as never);
  if (e) {
    console.error('Cannot query policies via API. Run this SQL manually in the SQL editor:\n');
    console.log("select policyname, cmd, qual, with_check from pg_policies where schemaname='storage' and tablename='objects';\n");
    process.exit(0);
  }
  console.log(r);
} else {
  console.log(JSON.stringify(data, null, 2));
}
