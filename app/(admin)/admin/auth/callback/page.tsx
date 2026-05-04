'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function CallbackPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [msg, setMsg] = useState('Signing you in…');

  useEffect(() => {
    const supabase = createClient();

    async function run() {
      // Flow A: PKCE — ?code= in query
      const code = params.get('code');
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          router.replace(`/admin/login?error=${encodeURIComponent(error.message)}`);
          return;
        }
        router.replace('/admin');
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
          router.replace(`/admin/login?error=${encodeURIComponent(error.message)}`);
          return;
        }
        router.replace('/admin');
        return;
      }

      // Flow C: error in hash
      const errCode = h.get('error_code') ?? h.get('error');
      const errDesc = h.get('error_description');
      router.replace(
        `/admin/login?error=${encodeURIComponent(errDesc ?? errCode ?? 'no_token')}`,
      );
    }

    run().catch((e) => setMsg(`Error: ${e?.message ?? 'unknown'}`));
  }, [params, router]);

  return (
    <div className="min-h-screen flex items-center justify-center text-text-muted text-sm tracking-[0.2em] uppercase">
      {msg}
    </div>
  );
}
