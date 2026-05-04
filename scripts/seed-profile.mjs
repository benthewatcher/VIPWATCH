// Seed the profile row for the signed-in admin user.
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
const fullName = process.argv[3] ?? 'Ben';
const role = process.argv[4] ?? 'owner';

const { data: { users } } = await admin.auth.admin.listUsers();
const u = users.find((x) => x.email === email);
if (!u) { console.error(`No auth user with email ${email}`); process.exit(1); }

const { error } = await admin
  .from('profiles')
  .upsert({ id: u.id, email, full_name: fullName, role }, { onConflict: 'id' });
if (error) { console.error('upsert error:', error.message); process.exit(1); }
console.log(`OK: profile seeded for ${email} (id=${u.id}, role=${role})`);
