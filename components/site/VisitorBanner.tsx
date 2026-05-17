import { cookies } from 'next/headers';
import { createClient as createSb } from '@supabase/supabase-js';
import { COOKIE_NAME, verifySessionCookie } from '@/lib/auth/invite-session';
import { VisitorBannerClient } from './VisitorBannerClient';

// Server component — runs on every public layout render. Fetches the most
// recent unread on-site note for this visitor (if any) and hands it to the
// client banner. Cheap query keyed by visitor_id + read_at index.

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createSb(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function VisitorBanner() {
  const cookieStore = await cookies();
  const session = await verifySessionCookie(cookieStore.get(COOKIE_NAME)?.value);
  if (!session?.vid) return null;

  const sb = serviceClient() as any;
  const { data } = await sb
    .from('visitor_notifications')
    .select('id, subject, body, created_at')
    .eq('visitor_id', session.vid)
    .eq('sent_banner', true)
    .is('read_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;

  return (
    <VisitorBannerClient
      id={data.id}
      subject={data.subject ?? null}
      body={data.body}
    />
  );
}
