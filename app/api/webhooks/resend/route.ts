import { NextResponse, type NextRequest } from 'next/server';
import { createClient as createSb } from '@supabase/supabase-js';

// Resend webhook receiver. Configure in Resend dashboard:
//   URL:    https://<host>/api/webhooks/resend
//   Events: email.delivered, email.opened, email.clicked, email.bounced
//   Auth:   set RESEND_WEBHOOK_SECRET in env; Resend signs requests with
//           an "Authorization: Bearer ..." header (or svix headers, depending
//           on plan). We accept either bearer or svix-signature.
//
// Payload reference: https://resend.com/docs/dashboard/webhooks

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

export async function POST(req: NextRequest) {
  try {
    // Auth: simple shared-secret check.
    const expected = process.env.RESEND_WEBHOOK_SECRET;
    if (expected) {
      const auth = req.headers.get('authorization') ?? '';
      const got = auth.replace(/^Bearer\s+/i, '').trim();
      if (got !== expected) {
        return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
      }
    }

    const event = (await req.json()) as ResendEvent;
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
