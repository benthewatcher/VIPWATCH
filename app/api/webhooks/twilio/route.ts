import { NextResponse, type NextRequest } from 'next/server';
import { createClient as createSb } from '@supabase/supabase-js';

// Twilio status-callback receiver. Configure on each Messaging Service /
// outbound number to POST to https://<host>/api/webhooks/twilio. Twilio sends
// application/x-www-form-urlencoded with MessageSid, MessageStatus,
// ErrorCode, etc.
//
// Status values: queued, sending, sent, delivered, undelivered, failed, read.

export const dynamic = 'force-dynamic';

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createSb(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const messageId = form.get('MessageSid')?.toString();
    const status = form.get('MessageStatus')?.toString();
    const errorCode = form.get('ErrorCode')?.toString() || null;
    if (!messageId || !status) {
      return NextResponse.json({ ok: true, skipped: 'missing-fields' });
    }

    const supabase = serviceClient() as any;
    const patch: Record<string, string | null> = { sms_status: status };
    if (status === 'delivered') patch.sms_delivered_at = new Date().toISOString();
    if (status === 'failed' || status === 'undelivered') {
      patch.sms_failed_reason = errorCode ? `Twilio ${errorCode}` : status;
    }

    const { error } = await supabase
      .from('visitor_notifications')
      .update(patch)
      .eq('sms_message_id', messageId);
    if (error) console.warn('[twilio:webhook] update failed:', error.message);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[twilio:webhook] unhandled:', e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
