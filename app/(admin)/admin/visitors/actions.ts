'use server';

import { revalidatePath } from 'next/cache';
import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';

const FROM = 'VIP WATCH <bespoke@forvip.watch>';

export type ComposeInput = {
  visitor_id: string;
  subject?: string | null;
  body: string;
  channels: { email: boolean; banner: boolean };
};

export type ComposeResult =
  | { ok: true; sent_email: boolean; sent_banner: boolean }
  | { ok: false; error: string };

export async function sendVisitorMessage(input: ComposeInput): Promise<ComposeResult> {
  const body = input.body?.trim();
  if (!body) return { ok: false, error: 'Write a message before sending.' };
  if (!input.channels.email && !input.channels.banner) {
    return { ok: false, error: 'Pick at least one channel.' };
  }

  const supabase = (await createClient()) as any;

  // Look up the visitor.
  const { data: v } = await supabase
    .from('visitors')
    .select('id, name, email')
    .eq('id', input.visitor_id)
    .maybeSingle();
  if (!v) return { ok: false, error: 'Visitor not found.' };

  let sent_email = false;
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
          await resend.emails.send({
            from: FROM,
            to: [v.email],
            replyTo: 'bespoke@forvip.watch',
            subject: input.subject?.trim() || 'A note from VIP WATCH',
            text: `Hello ${v.name ?? ''},\n\n${body}\n\n— VIP WATCH`,
          });
          sent_email = true;
        } catch (e) {
          console.error('[visitor:notify] resend failed:', e);
          emailError = 'Email delivery failed.';
        }
      }
    }
  }

  const sent_banner = input.channels.banner;

  // Always log the row regardless of email success — admin sees what they sent.
  const { error: insErr } = await supabase.from('visitor_notifications').insert({
    visitor_id: v.id,
    subject: input.subject?.trim() || null,
    body,
    sent_email,
    sent_banner,
    email_sent_at: sent_email ? new Date().toISOString() : null,
  });
  if (insErr) {
    return { ok: false, error: insErr.message };
  }

  revalidatePath(`/admin/visitors/${v.id}`);
  revalidatePath('/admin/visitors');

  if (emailError && input.channels.email && !sent_email) {
    return { ok: false, error: emailError };
  }
  return { ok: true, sent_email, sent_banner };
}

export async function deleteVisitorMessage(notificationId: string, visitorId: string) {
  const supabase = (await createClient()) as any;
  await supabase.from('visitor_notifications').delete().eq('id', notificationId);
  revalidatePath(`/admin/visitors/${visitorId}`);
  revalidatePath('/admin/visitors');
}
