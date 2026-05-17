'use client';

import { useState, useTransition } from 'react';

type Stage = 'phone' | 'code' | 'done';

export function SignInForm() {
  const [stage, setStage] = useState<Stage>('phone');
  const [phone, setPhone] = useState('');
  const [hint, setHint] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function requestCode() {
    setErr(null);
    setHint(null);
    const res = await fetch('/api/otp/request', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    const body = await res.json().catch(() => ({} as { error?: string; hint?: string }));
    if (!res.ok) {
      setErr(body.error ?? 'Could not send code.');
      return;
    }
    if (body.hint) setHint(body.hint);
    setStage('code');
  }

  async function verifyCode(code: string) {
    setErr(null);
    const res = await fetch('/api/otp/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ phone, code }),
    });
    const body = await res.json().catch(() => ({} as { error?: string }));
    if (!res.ok) {
      setErr(body.error ?? 'Could not verify code.');
      return;
    }
    setStage('done');
    // Cookie set by the API; bounce to /en after a beat.
    setTimeout(() => {
      window.location.href = '/en';
    }, 600);
  }

  function onPhoneSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) {
      setErr('Enter your phone number.');
      return;
    }
    startTransition(requestCode);
  }

  function onCodeSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const code = String(fd.get('code') ?? '').trim();
    if (!/^\d{6}$/.test(code)) {
      setErr('Enter the 6-digit code from your SMS.');
      return;
    }
    startTransition(() => verifyCode(code));
  }

  if (stage === 'done') {
    return (
      <p className="mt-12 text-text-primary/85">Signed in — taking you in…</p>
    );
  }

  if (stage === 'code') {
    return (
      <form onSubmit={onCodeSubmit} className="mt-12 grid gap-4 text-left">
        {hint && (
          <p className="text-[11px] uppercase tracking-[0.25em] text-text-muted text-center">
            {hint}
          </p>
        )}
        <label className="block">
          <span className="text-[11px] uppercase tracking-[0.25em] text-text-muted">6-digit code</span>
          <input
            name="code"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="one-time-code"
            maxLength={6}
            autoFocus
            className="mt-2 w-full bg-transparent border-b border-divider py-3 text-center text-2xl tracking-[0.4em] font-mono focus:border-accent focus:outline-none"
          />
        </label>

        {err && <p className="text-sm text-red-400 text-center">{err}</p>}

        <button
          type="submit"
          disabled={pending}
          className="mt-2 mx-auto border border-accent px-12 py-4 text-xs uppercase tracking-[0.25em] text-accent hover:bg-accent hover:text-bg-primary transition-colors disabled:opacity-50"
        >
          {pending ? 'Verifying…' : 'Verify'}
        </button>

        <button
          type="button"
          onClick={() => {
            setStage('phone');
            setErr(null);
            setHint(null);
          }}
          className="text-[11px] uppercase tracking-[0.25em] text-text-muted hover:text-accent"
        >
          ← Use a different number
        </button>
      </form>
    );
  }

  // stage === 'phone'
  return (
    <form onSubmit={onPhoneSubmit} className="mt-12 grid gap-4 text-left">
      <label className="block">
        <span className="text-[11px] uppercase tracking-[0.25em] text-text-muted">Phone</span>
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          autoFocus
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+44 7521 808964"
          className="mt-2 w-full bg-transparent border-b border-divider py-3 text-sm focus:border-accent focus:outline-none"
        />
      </label>

      {err && <p className="text-sm text-red-400 text-center">{err}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 mx-auto border border-accent px-12 py-4 text-xs uppercase tracking-[0.25em] text-accent hover:bg-accent hover:text-bg-primary transition-colors disabled:opacity-50"
      >
        {pending ? 'Sending…' : 'Send code'}
      </button>
    </form>
  );
}
