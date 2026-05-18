'use server';

import { revalidatePath } from 'next/cache';
import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';
import { sendSms } from '@/lib/sms/twilio';

const FROM = 'VIP WATCH <bespoke@forvip.watch>';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderEmailHtml({ greeting, body }: { greeting: string; body: string }): string {
  // Plain serif HTML, paragraphs from line breaks. Resend injects its open
  // pixel + rewrites links for click tracking when an html body is present.
  const paragraphs = body
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 16px 0;">${escapeHtml(p).replace(/\n/g, '<br/>')}</p>`)
    .join('');
  return `<!doctype html>
<html><body style="margin:0;padding:24px;font-family:Georgia,serif;color:#111;background:#fafafa;line-height:1.55;">
<table cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#fff;padding:32px;border:1px solid #eee;">
<tr><td>
<p style="margin:0 0 20px 0;font-weight:600;">${escapeHtml(greeting)}</p>
${paragraphs}
<p style="margin:32px 0 0 0;color:#888;font-size:13px;">— VIP WATCH</p>
</td></tr>
</table>
</body></html>`;
}

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
          const greeting = v.name ? `Hello ${v.name},` : 'Hello,';
          const text = `${greeting}\n\n${body}\n\n— VIP WATCH`;
          const html = renderEmailHtml({ greeting, body });
          const res = await resend.emails.send({
            from: FROM,
            to: [v.email],
            replyTo: 'bespoke@forvip.watch',
            subject: input.subject?.trim() || 'A note from VIP WATCH',
            text,
            html,
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

export type UpdateVisitorInput = {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
};

export type UpdateVisitorResult = { ok: true } | { ok: false; error: string };

export async function updateVisitor(input: UpdateVisitorInput): Promise<UpdateVisitorResult> {
  if (!input.id) return { ok: false, error: 'Missing visitor id.' };
  const supabase = (await createClient()) as any;

  // Normalise: trim, treat empty string as null so we don't persist whitespace.
  const norm = (v: string | null | undefined): string | null => {
    if (v === undefined) return null;
    if (v === null) return null;
    const t = v.trim();
    return t.length === 0 ? null : t;
  };

  const patch: Record<string, string | null> = {};
  if (input.name !== undefined) patch.name = norm(input.name);
  if (input.email !== undefined) {
    const e = norm(input.email);
    if (e && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      return { ok: false, error: 'Email looks invalid.' };
    }
    patch.email = e;
  }
  if (input.phone !== undefined) {
    const p = norm(input.phone);
    if (p && !/^\+?[0-9 ()-]{6,}$/.test(p)) {
      return { ok: false, error: 'Phone looks invalid. Use E.164 like +447521808964.' };
    }
    patch.phone = p ? p.replace(/[^\d+]/g, '') : null;
  }

  if (Object.keys(patch).length === 0) return { ok: true };

  const { error } = await supabase.from('visitors').update(patch).eq('id', input.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/visitors/${input.id}`);
  revalidatePath('/admin/visitors');
  return { ok: true };
}
