// Update the `media` bucket to accept the file types the admin actually uploads.
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

const allowed = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
  'image/heic',
  'image/heif',
  'image/svg+xml',
  'video/mp4',
  'video/webm',
  'video/quicktime',
];

const { data, error } = await admin.storage.updateBucket('media', {
  public: true,
  allowedMimeTypes: allowed,
  fileSizeLimit: 50 * 1024 * 1024, // 50 MB
});
console.log(error ? `FAIL: ${error.message}` : `OK: ${JSON.stringify(data)}`);
console.log('Allowed types:', allowed.join(', '));
console.log('Size limit: 50 MB');
