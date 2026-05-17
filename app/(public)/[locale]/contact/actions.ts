'use server';

import { cookies } from 'next/headers';
import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';
import { COOKIE_NAME, verifySessionCookie } from '@/lib/auth/invite-session';

export type EnquiryInput = {
  name: string;
  email: string;
  phone?: string | null;
  country?: string | null;
  watch_brand?: string | null;
  watch_model?: string | null;
  watch_reference?: string | null;
  message: string;
  source_locale?: 'ar' | 'en';
  source_path?: string | null;
  source_referrer?: string | null;
};

export type EnquiryResult = { ok: true } | { ok: false; error: string };

const TO_ADDRESSES = ['bespoke@forvip.watch', 'bw@minc.watch'];

export async function submitEnquiry(input: EnquiryInput): Promise<EnquiryResult> {
  // Basic validation — server-side trust nothing.
  if (!input.name?.trim() || !input.email?.trim() || !input.message?.trim()) {
    return { ok: false, error: 'Please fill name, email and your message.' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    return { ok: false, error: 'That email address looks invalid.' };
  }

  // 0. If the visitor arrived via an invite, attribute the enquiry to it.
  let inviteId: string | null = null;
  try {
    const cookieStore = await cookies();
    const session = await verifySessionCookie(cookieStore.get(COOKIE_NAME)?.value);
    if (session?.iid) inviteId = session.iid;
  } catch {
    /* cookie helpers can throw in edge cases — never block the enquiry */
  }

  // 1. Persist to Supabase regardless of email outcome.
  try {
    const supabase = (await createClient()) as any;
    const { error } = await supabase.from('enquiries').insert({
      name: input.name.trim(),
      email: input.email.trim(),
      phone: input.phone?.trim() || null,
      country: input.country?.trim() || null,
      watch_brand: input.watch_brand?.trim() || null,
      watch_model: input.watch_model?.trim() || null,
      watch_reference: input.watch_reference?.trim() || null,
      message: input.message.trim(),
      source_locale: input.source_locale ?? 'en',
      source_path: input.source_path ?? null,
      source_referrer: input.source_referrer ?? null,
      status: 'new',
      invite_id: inviteId,
    });
    if (error) {
      console.error('[enquiry] DB insert failed:', error.message);
      return { ok: false, error: 'Could not save your enquiry. Please try again or WhatsApp us.' };
    }
  } catch (e) {
    console.error('[enquiry] DB exception:', e);
    return { ok: false, error: 'Something went wrong. Please try again shortly.' };
  }

  // 2. Best-effort email notification via Resend. Don't fail the whole submission
  // if Resend hiccups — the enquiry is already saved in the DB.
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    try {
      const resend = new Resend(apiKey);
      const from = process.env.RESEND_FROM_EMAIL || 'VIP WATCH <onboarding@resend.dev>';
      const subject = `New enquiry — ${input.name}`;
      const lines = [
        `Name: ${input.name}`,
        `Email: ${input.email}`,
        input.phone && `WhatsApp: ${input.phone}`,
        input.country && `Country: ${input.country}`,
        (input.watch_brand || input.watch_model || input.watch_reference) &&
          `Watch: ${[input.watch_brand, input.watch_model, input.watch_reference].filter(Boolean).join(' · ')}`,
        '',
        'Message:',
        input.message,
      ].filter(Boolean);
      // a) Internal notification to the atelier
      await resend.emails.send({
        from,
        to: TO_ADDRESSES,
        replyTo: input.email,
        subject,
        text: lines.join('\n'),
      });

      // b) Auto-confirmation to the enquirer
      const ar = input.source_locale === 'ar';
      const confirmSubject = ar
        ? 'Demande reçue — VIP WATCH'
        : 'Request received — VIP WATCH';
      const confirmBody = ar
        ? `Bonjour ${input.name.split(' ')[0]},\n\nMerci pour votre message. Nous l'examinons et reviendrons vers vous dans la semaine pour convenir d'un échange.\n\nVotre demande :\n\n${input.message}\n\n— VIP WATCH`
        : `Hello ${input.name.split(' ')[0]},\n\nThank you for your message. We're reviewing it and will be in touch within a week to arrange a time to talk.\n\nYour request:\n\n${input.message}\n\n— VIP WATCH`;
      await resend.emails.send({
        from,
        to: [input.email],
        replyTo: TO_ADDRESSES[0],
        subject: confirmSubject,
        text: confirmBody,
      });
    } catch (e) {
      console.error('[enquiry] Resend failed (non-fatal):', e);
    }
  } else {
    console.warn('[enquiry] RESEND_API_KEY not set — skipping email notification.');
  }

  return { ok: true };
}
