/**
 * Convert a Supabase Storage path or full URL into a public CDN URL.
 * - If it's already an http(s) URL, return as-is.
 * - If it starts with "media/" or any bucket prefix we know, expand to public URL.
 * - Otherwise assume it's a path inside the `media` bucket.
 */
export function publicMediaUrl(pathOrUrl: string | null | undefined): string | null {
  if (!pathOrUrl) return null;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const clean = pathOrUrl.replace(/^\//, '');
  if (clean.startsWith('media/')) {
    return `${base}/storage/v1/object/public/${clean}`;
  }
  return `${base}/storage/v1/object/public/media/${clean}`;
}
