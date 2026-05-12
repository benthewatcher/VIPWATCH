#!/usr/bin/env node
/**
 * One-off bulk optimiser for the Supabase `media` bucket.
 *
 * For every image larger than --min-bytes (default 500KB), this script:
 *   1. backs up the original under  originals/<path>  (only on the FIRST pass)
 *   2. resizes to a max long edge of --max-edge (default 2400px), keeping aspect
 *   3. encodes to WebP at --quality (default 82)
 *   4. uploads back to the SAME path with upsert: true (so DB rows still resolve)
 *
 * Usage:
 *   node scripts/optimise-media.mjs                   # dry run, no writes
 *   node scripts/optimise-media.mjs --apply           # actually rewrite files
 *   node scripts/optimise-media.mjs --apply --max-edge 1800 --quality 78
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL in .env.local.
 * Run `npm i -D sharp dotenv` first.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

// --- env loader (no dotenv dep required) ---
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env.local');
try {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    if (!process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, '');
  }
} catch {
  /* env file optional */
}

// --- args ---
const args = new Map();
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a.startsWith('--')) args.set(a.slice(2), process.argv[i + 1]?.startsWith('--') ? true : process.argv[++i] ?? true);
}
const APPLY = args.has('apply');
const MAX_EDGE = Number(args.get('max-edge') ?? 2400);
const QUALITY = Number(args.get('quality') ?? 82);
const MIN_BYTES = Number(args.get('min-bytes') ?? 500 * 1024);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const BUCKET = 'media';
const IMAGE_EXT = /\.(png|jpe?g|webp|avif)$/i;

async function walk(prefix = '') {
  const out = [];
  const { data, error } = await supabase.storage.from(BUCKET).list(prefix, { limit: 1000 });
  if (error) throw error;
  for (const item of data ?? []) {
    const full = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.id === null) {
      // skip the originals backup tree so we don't double-process
      if (full === 'originals' || full.startsWith('originals/')) continue;
      out.push(...(await walk(full)));
    } else {
      out.push({ path: full, size: item.metadata?.size ?? 0, name: item.name });
    }
  }
  return out;
}

async function backupOriginal(srcPath) {
  const backupPath = `originals/${srcPath}`;
  const { data: existing } = await supabase.storage
    .from(BUCKET)
    .list(`originals/${srcPath.split('/').slice(0, -1).join('/')}`, {
      limit: 1000,
      search: srcPath.split('/').pop(),
    });
  if ((existing ?? []).some((f) => f.name === srcPath.split('/').pop())) return; // already backed up
  const { data: blob, error } = await supabase.storage.from(BUCKET).download(srcPath);
  if (error || !blob) throw error ?? new Error('download failed');
  const buf = Buffer.from(await blob.arrayBuffer());
  const up = await supabase.storage
    .from(BUCKET)
    .upload(backupPath, buf, { upsert: false, contentType: blob.type || 'application/octet-stream' });
  if (up.error && !up.error.message.toLowerCase().includes('exists')) throw up.error;
}

async function optimise(srcPath) {
  const { data: blob, error } = await supabase.storage.from(BUCKET).download(srcPath);
  if (error || !blob) throw error ?? new Error('download failed');
  const input = Buffer.from(await blob.arrayBuffer());
  const out = await sharp(input)
    .rotate()
    .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toBuffer();
  return { before: input.length, after: out.length, buf: out };
}

async function main() {
  console.log(`Bucket scan: ${BUCKET}`);
  console.log(`  apply=${APPLY}  max-edge=${MAX_EDGE}px  quality=${QUALITY}  min-bytes=${MIN_BYTES}`);
  const all = await walk('');
  const candidates = all.filter((f) => IMAGE_EXT.test(f.name) && f.size >= MIN_BYTES);
  console.log(`  ${all.length} files, ${candidates.length} candidates over ${(MIN_BYTES / 1024).toFixed(0)}KB`);

  let savedBytes = 0;
  let processed = 0;
  let skipped = 0;

  for (const f of candidates) {
    try {
      const { before, after, buf } = await optimise(f.path);
      const delta = before - after;
      const pct = ((delta / before) * 100).toFixed(1);
      if (after >= before * 0.95) {
        console.log(`  · skip  ${f.path}  (${(before / 1024).toFixed(0)}KB → ${(after / 1024).toFixed(0)}KB, no gain)`);
        skipped++;
        continue;
      }
      if (APPLY) {
        await backupOriginal(f.path);
        // Determine target path: keep original extension or switch to .webp.
        const targetPath = f.path.replace(/\.(png|jpe?g|avif)$/i, '.webp');
        if (targetPath !== f.path) {
          // Upload new .webp then delete old. DB rows referencing old path won't update —
          // so safer to KEEP original path. Re-encode to webp under the same .png/.jpg name.
          // The browser content-type header (image/webp) is enough.
        }
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(f.path, buf, { upsert: true, contentType: 'image/webp' });
        if (upErr) throw upErr;
      }
      console.log(`  ✓ ${f.path}  ${(before / 1024).toFixed(0)}KB → ${(after / 1024).toFixed(0)}KB  (-${pct}%)`);
      savedBytes += delta;
      processed++;
    } catch (e) {
      console.log(`  ✗ ${f.path}  ${e?.message ?? e}`);
    }
  }

  console.log('');
  console.log(`Done. processed=${processed} skipped=${skipped} saved=${(savedBytes / 1024 / 1024).toFixed(2)}MB`);
  if (!APPLY) console.log('(dry run — re-run with --apply to actually rewrite files)');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
