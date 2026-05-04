// Generate a magic-link URL via the Supabase admin API.
// Usage: node scripts/gen-magic-link.mjs [email]
// Reads SUPABASE_URL + SERVICE_ROLE_KEY from .env.local. No email sent.

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

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.argv[2] ?? 'bw@minc.watch';
const redirectTo = process.argv[3] ?? 'http://localhost:3002/admin/auth/callback';

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const { data, error } = await admin.auth.admin.generateLink({
  type: 'magiclink',
  email,
  options: { redirectTo },
});

if (error) {
  console.error('Error:', error.message);
  process.exit(1);
}

console.log('\nPaste this into your browser:\n');
console.log(data.properties.action_link);
console.log('');
