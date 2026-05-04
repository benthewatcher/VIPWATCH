'use client';

import { useState } from 'react';
import { getT } from '@/lib/i18n/t';

export function EnquiryForm({ locale }: { locale: string }) {
  const t = getT(locale, 'contact');
  const f = getT(locale, 'contact.fields');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done'>('idle');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('submitting');
    // TODO Phase 5: server action -> insert enquiries + Resend
    await new Promise((r) => setTimeout(r, 800));
    setStatus('done');
  }

  if (status === 'done') {
    return <p className="font-serif text-2xl text-accent">Thank you. We'll be in touch shortly.</p>;
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6">
      <Field label={f('name')} name="name" required />
      <div className="grid md:grid-cols-2 gap-6">
        <Field label={f('email')} name="email" type="email" required />
        <Field label={f('phone')} name="phone" />
      </div>
      <Field label={f('country')} name="country" />
      <div className="grid md:grid-cols-2 gap-6">
        <Field label={f('watchBrand')} name="watch_brand" />
        <Field label={f('watchModel')} name="watch_model" />
      </div>
      <Field label={f('watchReference')} name="watch_reference" />
      <Field label={f('message')} name="message" textarea required />

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="mt-4 border border-accent px-10 py-4 text-xs uppercase tracking-[0.25em] text-accent hover:bg-accent hover:text-bg-primary transition-colors disabled:opacity-50"
      >
        {t('submit')}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = 'text',
  required,
  textarea,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  textarea?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.2em] text-text-muted">{label}</span>
      {textarea ? (
        <textarea
          name={name}
          required={required}
          rows={5}
          className="mt-2 w-full bg-transparent border-b border-divider py-3 focus:border-accent focus:outline-none"
        />
      ) : (
        <input
          name={name}
          type={type}
          required={required}
          className="mt-2 w-full bg-transparent border-b border-divider py-3 focus:border-accent focus:outline-none"
        />
      )}
    </label>
  );
}
