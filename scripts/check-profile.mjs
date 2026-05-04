// Check whether the auth user has a profile row (required by is_admin()).
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n').filter(Boolean)
    .map((l) => l.replace(/^\s*#.*/, '')).filter(Boolean)
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^['"]|['"]$/g, '')]; }),
);

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const email = process.argv[2] ?? 'bw@minc.watch';

const { data: { users } } = await admin.auth.admin.listUsers();
const u = users.find((x) => x.email === email);
if (!u) { console.log(`No auth user with email ${email}`); process.exit(0); }
console.log(`auth.users.id = ${u.id}`);

const { data: profile, error } = await admin
  .from('profiles')
  .select('id, email, role, full_name')
  .eq('id', u.id)
  .maybeSingle();

if (error) { console.error('profile fetch error:', error.message); process.exit(1); }
if (!profile) {
  console.log('NO PROFILE — uploads will fail. Insert with:');
  console.log(`  insert into profiles (id, email, full_name, role) values ('${u.id}', '${email}', 'Ben', 'owner');`);
  process.exit(0);
}
console.log('profile:', profile);
