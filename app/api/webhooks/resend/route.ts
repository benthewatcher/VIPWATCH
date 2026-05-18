import { NextResponse, type NextRequest } from 'next/server';
import { createClient as createSb } from '@supabase/supabase-js';

// Resend webhook receiver. Resend signs via Svix:
//   headers: svix-id, svix-timestamp, svix-signature
//   secret:  whsec_<base64>  (from the Resend webhook detail page)
// Set RESEND_WEBHOOK_SECRET in env to enable verification.

export const dynamic = 'force-dynamic';

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createSb(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

type ResendEvent = {
  type: 'email.delivered' | 'email.opened' | 'email.clicked' | 'email.bounced' | string;
  created_at: string;
  data: { email_id?: string; id?: string };
};

// Verify Svix signature against the whsec_... secret. Returns true on match.
async function verifySvix(req: NextRequest, rawBody: string): Promise<boolean> {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return true; // No secret configured → skip verification.

  const svixId = req.headers.get('svix-id');
  const svixTimestamp = req.headers.get('svix-timestamp');
  const svixSignature = req.headers.get('svix-signature');
  if (!svixId || !svixTimestamp || !svixSignature) return false;

  // Reject very old payloads (5 min tolerance).
  const ts = Number(svixTimestamp);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > 300) return false;

  // The secret is "whsec_<base64>". Decode the base64 portion to raw key bytes.
  const b64 = secret.startsWith('whsec_') ? secret.slice(6) : secret;
  const keyBytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const payload = `${svixId}.${svixTimestamp}.${rawBody}`;
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(payload));
  const expected = btoa(String.fromCharCode(...new Uint8Array(sig)));

  // svix-signature is "v1,<sig1> v1,<sig2>" — match any one.
  return svixSignature
    .split(' ')
    .map((part) => part.split(',')[1])
    .filter(Boolean)
    .some((s) => s === expected);
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const verified = await verifySvix(req, rawBody);
    if (!verified) {
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
    }

    const event = JSON.parse(rawBody) as ResendEvent;
    const messageId = event.data?.email_id ?? event.data?.id;
    if (!messageId) return NextResponse.json({ ok: true, skipped: 'no-id' });

    const supabase = serviceClient() as any;
    const ts = event.created_at ?? new Date().toISOString();

    const patch: Record<string, string> = {};
    switch (event.type) {
      case 'email.delivered':
        patch.email_delivered_at = ts;
        break;
      case 'email.opened':
        patch.email_opened_at = ts;
        break;
      case 'email.clicked':
        patch.email_clicked_at = ts;
        break;
      case 'email.bounced':
        patch.email_bounced_at = ts;
        break;
      default:
        return NextResponse.json({ ok: true, skipped: 'unknown-type' });
    }

    const { error } = await supabase
      .from('visitor_notifications')
      .update(patch)
      .eq('email_message_id', messageId);
    if (error) console.warn('[resend:webhook] update failed:', error.message);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[resend:webhook] unhandled:', e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
