'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

export function NewsletterForm() {
  const t = useTranslations('footer');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done'>('idle');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    // TODO Phase 5: server action to insert into newsletter_subscribers + Resend audience
    await new Promise((r) => setTimeout(r, 600));
    setStatus('done');
    setEmail('');
  }

  if (status === 'done') {
    return <p className="text-sm text-accent">Thank you.</p>;
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
        disabled={status === 'submitting'}
        className="px-5 py-3 text-xs uppercase tracking-[0.2em] text-text-primary hover:text-accent transition-colors disabled:opacity-50"
      >
        {t('newsletterCta')}
      </button>
    </form>
  );
}
