'use client';

import { useState, useTransition } from 'react';
import { getT } from '@/lib/i18n/t';
import { submitEnquiry } from '@/app/(public)/[locale]/contact/actions';

export function ContactView({
  locale,
  titleOverride,
  subtitleOverride,
}: {
  locale: string;
  titleOverride?: string | null;
  subtitleOverride?: string | null;
}) {
  const t = getT(locale, 'contact');
  const f = getT(locale, 'contact.fields');
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const input = {
      name: String(fd.get('name') ?? ''),
      email: String(fd.get('email') ?? ''),
      phone: String(fd.get('phone') ?? ''),
      country: String(fd.get('country') ?? ''),
      watch_brand: String(fd.get('watch_brand') ?? ''),
      watch_model: String(fd.get('watch_model') ?? ''),
      watch_reference: String(fd.get('watch_reference') ?? ''),
      message: String(fd.get('message') ?? ''),
      source_locale: (locale === 'ar' ? 'ar' : 'en') as 'ar' | 'en',
      source_path: typeof window !== 'undefined' ? window.location.pathname : null,
      source_referrer: typeof document !== 'undefined' ? document.referrer || null : null,
    };
    startTransition(async () => {
      const result = await submitEnquiry(input);
      if (result.ok) setDone(true);
      else setErr(result.error);
    });
  }

  if (done) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-32 md:py-40 text-center">
        <p className="text-[11px] uppercase tracking-[0.4em] text-accent">
          {locale === 'ar' ? 'Demande envoyée' : 'Request received'}
        </p>
        <h1 className="font-serif text-5xl md:text-6xl mt-4 tracking-tight">
          {locale === 'ar' ? 'Vous avez fait une demande' : 'You have made a request'}
        </h1>
        <p className="mt-6 text-text-muted text-base md:text-lg max-w-xl mx-auto">
          {locale === 'ar' ? 'Merci. Nous reviendrons vers vous très prochainement.' : "Thank you. We'll be in touch shortly."}
        </p>
      </section>
    );
  }

  return (
    <>
      <header className="mx-auto max-w-7xl px-6 pt-10 pb-8 md:pt-14 md:pb-10">
        <h1 className="font-serif text-4xl md:text-5xl tracking-tight">{titleOverride || t('title')}</h1>
        {(subtitleOverride || t('subtitle')) && (
          <p className="mt-3 max-w-2xl text-sm md:text-base text-text-muted">
            {subtitleOverride || t('subtitle')}
          </p>
        )}
      </header>
      <section className="mx-auto max-w-3xl px-6 pb-32">
        <form onSubmit={onSubmit} className="grid gap-6">
          <Field label={f('name')} name="name" required />
          <div className="grid md:grid-cols-2 gap-6">
            <Field label={f('email')} name="email" type="email" required />
            <Field label={f('phone')} name="phone" type="tel" />
          </div>
          <Field label={f('country')} name="country" />
          <div className="grid md:grid-cols-2 gap-6">
            <Field label={f('watchBrand')} name="watch_brand" />
            <Field label={f('watchModel')} name="watch_model" />
          </div>
          <Field label={f('watchReference')} name="watch_reference" />
          <Field label={f('message')} name="message" textarea required />

          {err && <p className="text-sm text-red-400">{err}</p>}

          <button
            type="submit"
            disabled={pending}
            className="mt-4 border border-accent px-10 py-4 text-xs uppercase tracking-[0.25em] text-accent hover:bg-accent hover:text-bg-primary transition-colors disabled:opacity-50"
          >
            {pending ? (locale === 'ar' ? 'Envoi…' : 'Sending…') : t('submit')}
          </button>
        </form>
      </section>
    </>
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
