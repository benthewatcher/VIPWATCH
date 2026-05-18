'use server';

import { revalidatePath } from 'next/cache';
import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';
import { sendSms } from '@/lib/sms/twilio';

const FROM = 'VIP WATCH <bespoke@forvip.watch>';

export type ComposeInput = {
  visitor_id: string;
  subject?: string | null;
  body: string;
  channels: { email: boolean; banner: boolean; sms: boolean };
};

export type ComposeResult =
  | { ok: true; sent_email: boolean; sent_banner: boolean; sent_sms: boolean }
  | { ok: false; error: string };

export async function sendVisitorMessage(input: ComposeInput): Promise<ComposeResult> {
  const body = input.body?.trim();
  if (!body) return { ok: false, error: 'Write a message before sending.' };
  if (!input.channels.email && !input.channels.banner && !input.channels.sms) {
    return { ok: false, error: 'Pick at least one channel.' };
  }

  const supabase = (await createClient()) as any;

  const { data: v } = await supabase
    .from('visitors')
    .select('id, name, email, phone')
    .eq('id', input.visitor_id)
    .maybeSingle();
  if (!v) return { ok: false, error: 'Visitor not found.' };

  // Who's sending — populate created_by for audit.
  const { data: auth } = await supabase.auth.getUser();
  const createdBy = auth?.user?.id ?? null;

  let sent_email = false;
  let email_message_id: string | null = null;
  let emailError: string | null = null;

  if (input.channels.email) {
    if (!v.email) {
      emailError = 'Visitor has no email on file.';
    } else {
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) {
        emailError = 'RESEND_API_KEY not set.';
      } else {
        try {
          const resend = new Resend(apiKey);
          const res = await resend.emails.send({
            from: FROM,
            to: [v.email],
            replyTo: 'bespoke@forvip.watch',
            subject: input.subject?.trim() || 'A note from VIP WATCH',
            text: `Hello ${v.name ?? ''},\n\n${body}\n\n— VIP WATCH`,
          });
          sent_email = true;
          email_message_id = (res.data as { id?: string } | null)?.id ?? null;
        } catch (e) {
          console.error('[visitor:notify] resend failed:', e);
          emailError = 'Email delivery failed.';
        }
      }
    }
  }

  let sent_sms = false;
  let sms_message_id: string | null = null;
  let smsError: string | null = null;
  if (input.channels.sms) {
    if (!v.phone) {
      smsError = 'Visitor has no phone on file.';
    } else {
      const smsBody = input.subject?.trim()
        ? `${input.subject.trim()} — ${body}`
        : body;
      const result = await sendSms(v.phone, smsBody);
      if (result.ok) {
        sent_sms = true;
        sms_message_id = result.messageSid ?? null;
      } else {
        console.error('[visitor:notify] sms failed:', result.error);
        smsError = 'SMS delivery failed.';
      }
    }
  }

  const sent_banner = input.channels.banner;
  const now = new Date().toISOString();

  const { error: insErr } = await supabase.from('visitor_notifications').insert({
    visitor_id: v.id,
    subject: input.subject?.trim() || null,
    body,
    sent_email,
    sent_banner,
    sent_sms,
    email_sent_at: sent_email ? now : null,
    sms_sent_at: sent_sms ? now : null,
    banner_sent_at: sent_banner ? now : null,
    email_message_id,
    sms_message_id,
    created_by: createdBy,
  });
  if (insErr) {
    return { ok: false, error: insErr.message };
  }

  revalidatePath(`/admin/visitors/${v.id}`);
  revalidatePath('/admin/visitors');

  // Surface the first channel-level failure if the user asked for that channel
  // but nothing made it out.
  if (input.channels.email && !sent_email && emailError) {
    return { ok: false, error: emailError };
  }
  if (input.channels.sms && !sent_sms && smsError) {
    return { ok: false, error: smsError };
  }
  return { ok: true, sent_email, sent_banner, sent_sms };
}

export async function deleteVisitorMessage(notificationId: string, visitorId: string) {
  const supabase = (await createClient()) as any;
  await supabase
    .from('visitor_notifications')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', notificationId);
  revalidatePath(`/admin/visitors/${visitorId}`);
  revalidatePath('/admin/visitors');
}
