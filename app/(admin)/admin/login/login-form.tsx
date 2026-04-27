'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errMsg, setErrMsg] = useState('');
  const search = useSearchParams();
  const errorParam = search.get('error');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    setErrMsg('');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/admin/auth/callback`,
        shouldCreateUser: false,
      },
    });
    if (error) {
      setStatus('error');
      setErrMsg(error.message);
      return;
    }
    setStatus('sent');
  }

  if (status === 'sent') {
    return (
      <p className="mt-12 text-center text-text-muted">
        Check <span className="text-accent">{email}</span> for the sign-in link.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-12 grid gap-6">
      <label className="block">
        <span className="text-xs uppercase tracking-[0.2em] text-text-muted">Email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-2 w-full bg-transparent border-b border-divider py-3 focus:border-accent focus:outline-none"
        />
      </label>

      <button
        type="submit"
        disabled={status === 'sending'}
        className="border border-accent px-6 py-3 text-xs uppercase tracking-[0.25em] text-accent hover:bg-accent hover:text-bg-primary transition-colors disabled:opacity-50"
      >
        {status === 'sending' ? 'Sending…' : 'Send magic link'}
      </button>

      {errorParam === 'not_authorised' && (
        <p className="text-xs text-red-400">
          That email is signed in but not on the admin allow-list.
        </p>
      )}
      {errMsg && <p className="text-xs text-red-400">{errMsg}</p>}
    </form>
  );
}
