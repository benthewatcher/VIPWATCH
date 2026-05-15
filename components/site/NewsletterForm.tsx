'use client';

import { useState, useTransition } from 'react';
import { getT } from '@/lib/i18n/t';
import { subscribeToNewsletter } from '@/app/(public)/newsletter/actions';

export function NewsletterForm({ locale, source = 'footer' }: { locale: string; source?: string }) {
  const t = getT(locale, 'footer');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'done'>('idle');
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    startTransition(async () => {
      const result = await subscribeToNewsletter({
        email,
        locale: locale === 'ar' ? 'ar' : 'en',
        source,
      });
      if (result.ok) {
        setStatus('done');
        setEmail('');
      } else {
        setErr(result.error);
      }
    });
  }

  if (status === 'done') {
    return (
      <p className="text-sm text-accent">
        {locale === 'ar' ? 'Merci. À bientôt.' : 'Thank you. We’ll be in touch.'}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex border border-divider">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="email@example.com"
        className="flex-1 bg-transparent px-4 py-3 text-sm placeholder:text-text-muted focus:outline-none"
      />
      <button
        type="submit"
        disabled={pending}
        className="px-5 py-3 text-xs uppercase tracking-[0.2em] text-text-primary hover:text-accent transition-colors disabled:opacity-50"
      >
        {pending ? '…' : t('newsletterCta')}
      </button>
      {err && (
        <span className="px-3 self-center text-xs text-red-400">{err}</span>
      )}
    </form>
  );
}
