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

/**
 * Auto-crop a stored image via Supabase's `render/image` endpoint.
 * Requires Storage Image Transformations to be enabled on the project
 * (Pro plan or higher). If the input is already a full http(s) URL we
 * leave it alone — we can only transform our own storage objects.
 */
export function transformedMediaUrl(
  pathOrUrl: string | null | undefined,
  opts: { width: number; height: number; resize?: 'cover' | 'contain' | 'fill'; quality?: number },
): string | null {
  if (!pathOrUrl) return null;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const clean = pathOrUrl.replace(/^\//, '');
  const objectPath = clean.startsWith('media/') ? clean : `media/${clean}`;
  const qs = new URLSearchParams({
    width: String(opts.width),
    height: String(opts.height),
    resize: opts.resize ?? 'cover',
    quality: String(opts.quality ?? 80),
  });
  return `${base}/storage/v1/render/image/public/${objectPath}?${qs.toString()}`;
}

/**
 * Mobile-friendly crop: prefer an explicit mobile path; fall back to an
 * auto-cropped portrait of the desktop image (4:5 at 900×1125).
 */
export function mobileCoverUrl(
  desktopPath: string | null | undefined,
  mobilePath: string | null | undefined,
): string | null {
  if (mobilePath) return publicMediaUrl(mobilePath);
  return transformedMediaUrl(desktopPath, { width: 900, height: 1125, resize: 'cover' });
}
