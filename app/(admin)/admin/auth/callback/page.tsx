'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function CallbackPage() {
  const params = useSearchParams();
  const [msg, setMsg] = useState('Signing you in…');

  useEffect(() => {
    const supabase = createClient();

    // Hard redirect — guarantees a fresh server fetch with the new cookies.
    function go(path: string) {
      window.location.href = path;
    }

    async function run() {
      // Flow A: PKCE — ?code= in query
      const code = params.get('code');
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          go(`/admin/login?error=${encodeURIComponent(error.message)}`);
          return;
        }
        go('/admin');
        return;
      }

      // Flow B: legacy verify — #access_token=...&refresh_token=... in hash
      const hash = window.location.hash.startsWith('#')
        ? window.location.hash.slice(1)
        : window.location.hash;
      const h = new URLSearchParams(hash);
      const access_token = h.get('access_token');
      const refresh_token = h.get('refresh_token');

      if (access_token && refresh_token) {
        const { error } = await supabase.auth.setSession({ access_token, refresh_token });
        if (error) {
          go(`/admin/login?error=${encodeURIComponent(error.message)}`);
          return;
        }
        go('/admin');
        return;
      }

      // Flow C: error in hash
      const errCode = h.get('error_code') ?? h.get('error');
      const errDesc = h.get('error_description');
      go(
        `/admin/login?error=${encodeURIComponent(errDesc ?? errCode ?? 'no_token')}`,
      );
    }

    run().catch((e) => setMsg(`Error: ${e?.message ?? 'unknown'}`));
  }, [params]);

  return (
    <div className="min-h-screen flex items-center justify-center text-text-muted text-sm tracking-[0.2em] uppercase">
      {msg}
    </div>
  );
}
