'use client';

import { useState, useTransition } from 'react';

export function WelcomeForm({ next }: { next: string }) {
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get('name') ?? '').trim();
    const email = String(fd.get('email') ?? '').trim();
    const phone = String(fd.get('phone') ?? '').trim();

    if (!name) {
      setErr('Enter your name to continue.');
      return;
    }
    if (!email && !phone) {
      setErr('Add an email or a phone so the atelier can reach you.');
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErr('That email looks off.');
      return;
    }
    if (phone && phone.replace(/[^\d]/g, '').length < 6) {
      setErr('That phone number looks too short.');
      return;
    }

    startTransition(async () => {
      const res = await fetch('/api/visitor/name', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name,
          email: email || null,
          phone: phone || null,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !body.ok) {
        setErr(body.error ?? 'Could not save your details.');
        return;
      }
      window.location.href = next.startsWith('/') ? next : '/en';
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-10 grid gap-5 text-left">
      <label className="block">
        <span className="text-[11px] uppercase tracking-[0.25em] text-text-muted">Your name</span>
        <input
          name="name"
          type="text"
          autoComplete="name"
          required
          autoFocus
          className="mt-2 w-full bg-transparent border-b border-divider py-3 focus:border-accent focus:outline-none"
        />
      </label>

      <p className="text-[11px] uppercase tracking-[0.25em] text-text-muted -mb-3">
        Email or phone — either is fine
      </p>

      <label className="block">
        <span className="text-[11px] uppercase tracking-[0.25em] text-text-muted">Email</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className="mt-2 w-full bg-transparent border-b border-divider py-3 focus:border-accent focus:outline-none"
        />
      </label>

      <label className="block">
        <span className="text-[11px] uppercase tracking-[0.25em] text-text-muted">Phone</span>
        <input
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+44 7852 111111"
          className="mt-2 w-full bg-transparent border-b border-divider py-3 focus:border-accent focus:outline-none"
        />
      </label>

      {err && <p className="text-sm text-red-400 text-center">{err}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-4 mx-auto border border-accent px-12 py-4 text-xs uppercase tracking-[0.25em] text-accent hover:bg-accent hover:text-bg-primary transition-colors disabled:opacity-50"
      >
        {pending ? 'Saving…' : 'Continue'}
      </button>
    </form>
  );
}
