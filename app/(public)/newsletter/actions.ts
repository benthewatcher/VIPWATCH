'use server';

import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';

export type NewsletterResult = { ok: true } | { ok: false; error: string };

export async function subscribeToNewsletter({
  email,
  locale,
  source,
}: {
  email: string;
  locale?: 'en' | 'ar';
  source?: string;
}): Promise<NewsletterResult> {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: 'That email looks invalid.' };
  }

  // DB locale_code enum is ('fr','en'); app locales are ('en','ar'). Both
  // app locales map to 'en' on the newsletter row since 'ar' would fail the
  // enum cast and the field is cosmetic for outbound mail anyway.
  const dbLocale = 'en' as const;

  // 1. Insert. Anon RLS only allows INSERT (not UPDATE), so a repeat
  // submission of the same email hits the unique constraint — treat that as
  // success rather than surfacing an error.
  try {
    const supabase = (await createClient()) as any;
    const { error } = await supabase.from('newsletter_subscribers').insert({
      email: email.trim().toLowerCase(),
      locale: dbLocale,
      source: source ?? 'footer',
    });
    if (error) {
      const msg = error.message ?? '';
      const isDuplicate = error.code === '23505' || /duplicate|unique/i.test(msg);
      if (!isDuplicate) {
        console.error('[newsletter] DB insert failed:', msg);
        return { ok: false, error: 'Could not subscribe. Try again later.' };
      }
      // Already subscribed — treat as success.
    }
  } catch (e) {
    console.error('[newsletter] DB exception:', e);
    return { ok: false, error: 'Something went wrong.' };
  }

  // 2. Sync to Resend Audience (best-effort)
  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (apiKey && audienceId) {
    try {
      const resend = new Resend(apiKey);
      const created = await resend.contacts.create({
        audienceId,
        email: email.trim().toLowerCase(),
        unsubscribed: false,
      });
      // Save Resend's contact id so admin can cross-reference / unsubscribe later.
      const resendId = (created.data as { id?: string } | null)?.id;
      if (resendId) {
        const supabase = (await createClient()) as any;
        await supabase
          .from('newsletter_subscribers')
          .update({ resend_contact_id: resendId })
          .eq('email', email.trim().toLowerCase());
      }
    } catch (e) {
      console.error('[newsletter] Resend audience sync failed (non-fatal):', e);
    }
  } else {
    console.warn('[newsletter] RESEND_API_KEY or RESEND_AUDIENCE_ID not set — skipping Resend sync.');
  }

  return { ok: true };
}
