// Diagnose Supabase Storage setup for the `media` bucket.
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((l) => l.replace(/^\s*#.*/, ''))
    .filter(Boolean)
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^['"]|['"]$/g, '')];
    }),
);

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

console.log('--- buckets ---');
const { data: buckets, error: bErr } = await admin.storage.listBuckets();
if (bErr) console.error('list buckets error:', bErr.message);
else for (const b of buckets ?? []) console.log(`${b.name}  public=${b.public}  created=${b.created_at}`);

console.log('\n--- testing upload as service_role to media/test/_check.txt ---');
const { error: upErr } = await admin.storage
  .from('media')
  .upload(`test/_check_${Date.now()}.txt`, new Blob(['ok']), { contentType: 'text/plain' });
console.log(upErr ? `FAIL: ${upErr.message}` : 'OK (service role can upload)');

console.log('\n--- testing upload as anon (no session) ---');
const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const { error: anonErr } = await anon.storage
  .from('media')
  .upload(`test/_anon_${Date.now()}.txt`, new Blob(['ok']), { contentType: 'text/plain' });
console.log(anonErr ? `FAIL: ${anonErr.message}` : 'OK (anon can upload — bucket is wide open)');
