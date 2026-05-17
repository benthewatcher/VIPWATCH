'use client';

import { useState, useTransition } from 'react';
import { submitEnquiry } from '@/app/(public)/[locale]/contact/actions';

export function RequestAccessForm() {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get('name') ?? '').trim();
    const email = String(fd.get('email') ?? '').trim();
    const phone = String(fd.get('phone') ?? '').trim();
    const note = String(fd.get('note') ?? '').trim();

    startTransition(async () => {
      const result = await submitEnquiry({
        name,
        email,
        phone: phone || null,
        message: note
          ? `Access request from /waitlist — ${note}`
          : 'Access request from /waitlist.',
        source_locale: 'en',
        source_path: typeof window !== 'undefined' ? window.location.pathname : null,
        source_referrer: typeof document !== 'undefined' ? document.referrer || null : null,
      });
      if (result.ok) setDone(true);
      else setErr(result.error);
    });
  }

  if (done) {
    return (
      <div className="mt-12 border border-accent/60 bg-accent/5 px-8 py-10 text-center">
        <p className="text-[11px] uppercase tracking-[0.4em] text-accent">Request received</p>
        <h2 className="font-serif text-3xl md:text-4xl mt-4 tracking-tight">
          Thank you
        </h2>
        <p className="mt-4 text-text-primary/80 max-w-md mx-auto">
          We&apos;ve received your request and will be in touch shortly with next steps.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-12 grid gap-4 text-left">
      <p className="text-[11px] uppercase tracking-[0.4em] text-accent text-center">
        Request access
      </p>

      <Field name="name" label="Full name" required autoComplete="name" />
      <div className="grid sm:grid-cols-2 gap-4">
        <Field name="email" label="Email" type="email" required autoComplete="email" />
        <Field name="phone" label="Phone (optional)" type="tel" autoComplete="tel" />
      </div>
      <Field name="note" label="A short note (optional)" textarea />

      {err && <p className="text-sm text-red-400 text-center">{err}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 mx-auto border border-accent px-12 py-4 text-xs uppercase tracking-[0.25em] text-accent hover:bg-accent hover:text-bg-primary transition-colors disabled:opacity-50"
      >
        {pending ? 'Sending…' : 'Send request'}
      </button>
    </form>
  );
}

function Field({
  name,
  label,
  type = 'text',
  required,
  autoComplete,
  textarea,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  textarea?: boolean;
}) {
  const common =
    'mt-2 w-full bg-transparent border-b border-divider py-3 text-sm focus:border-accent focus:outline-none';
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-[0.25em] text-text-muted">{label}</span>
      {textarea ? (
        <textarea name={name} required={required} rows={3} className={common} />
      ) : (
        <input
          name={name}
          type={type}
          required={required}
          autoComplete={autoComplete}
          className={common}
        />
      )}
    </label>
  );
}
