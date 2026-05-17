'use client';

import { useEffect, useState, useTransition } from 'react';
import { Share2, X } from 'lucide-react';
import { getWishlist } from '@/lib/wishlist/local';

const PROFILE_KEY = 'vipwatch:wishlist:profile';
const TOKEN_KEY = 'vipwatch:wishlist:share-token';

type Profile = { name?: string; email?: string; title?: string; message?: string };

function readProfile(): Profile {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as Profile) : {};
  } catch {
    return {};
  }
}
function writeProfile(p: Profile) {
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
}
function readToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}
function writeToken(t: string) {
  window.localStorage.setItem(TOKEN_KEY, t);
}
function shareOrigin(): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
  if (env) return env;
  if (typeof window !== 'undefined') return window.location.origin;
  return 'https://forvip.watch';
}
function openWhatsApp(url: string, profile: Profile, count: number) {
  const lines = [
    profile.title ?? `${count} piece${count === 1 ? '' : 's'} I've been saving`,
    profile.message ? `\n${profile.message}\n` : '',
    profile.name ? `From ${profile.name} — have a look:` : 'Have a look:',
    url,
  ].filter(Boolean);
  const text = encodeURIComponent(lines.join('\n'));
  window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
}

export function ShareWishlist() {
  const [open, setOpen] = useState(false);
  const [existingToken, setExistingToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile>({});
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setExistingToken(readToken());
    setProfile(readProfile());
  }, []);

  function onClickShare() {
    const tok = readToken();
    const prof = readProfile();
    if (prof.name) {
      shareNow(tok, prof);
      return;
    }
    setProfile(prof);
    setExistingToken(tok);
    setOpen(true);
    setErr(null);
  }

  function shareNow(tokenToUse: string | null, prof: Profile) {
    const ids = getWishlist();
    if (ids.length === 0) {
      setErr('Add at least one watch to your wishlist first.');
      setOpen(true);
      return;
    }
    startTransition(async () => {
      const res = await fetch('/api/wishlist/share', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          token: tokenToUse,
          commission_ids: ids,
          title: prof.title ?? null,
          message: prof.message ?? null,
          sharer_name: prof.name ?? null,
          sharer_email: prof.email ?? null,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; token?: string; error?: string };
      if (!res.ok || !body.token) {
        setErr(body.error ?? 'Could not create a share link.');
        setOpen(true);
        return;
      }
      writeToken(body.token);
      setExistingToken(body.token);
      const url = `${shareOrigin()}/wishlist/${body.token}`;
      openWhatsApp(url, prof, ids.length);
    });
  }

  function onSubmitProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    const fd = new FormData(e.currentTarget);
    const next: Profile = {
      name: String(fd.get('sharer_name') ?? '').trim() || undefined,
      email: String(fd.get('sharer_email') ?? '').trim() || undefined,
      title: String(fd.get('title') ?? '').trim() || undefined,
      message: String(fd.get('message') ?? '').trim() || undefined,
    };
    if (!next.name) {
      setErr('Your name is required so the recipient sees who sent it.');
      return;
    }
    writeProfile(next);
    setProfile(next);
    setOpen(false);
    shareNow(readToken(), next);
  }

  return (
    <>
      <button
        type="button"
        onClick={onClickShare}
        disabled={pending}
        className="inline-flex items-center gap-2 border border-accent px-8 py-3 text-xs uppercase tracking-[0.25em] text-accent hover:bg-accent hover:text-bg-primary transition-colors disabled:opacity-50"
      >
        <Share2 size={14} />
        {pending ? 'Preparing…' : 'Share via WhatsApp'}
      </button>

      {existingToken && (
        <button
          type="button"
          onClick={() => {
            setProfile(readProfile());
            setOpen(true);
            setErr(null);
          }}
          className="ml-3 text-xs uppercase tracking-[0.2em] text-text-muted hover:text-accent"
        >
          Edit details
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center px-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-lg bg-bg-primary border border-divider p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 text-text-muted hover:text-text-primary"
            >
              <X size={18} />
            </button>

            <h2 className="font-serif text-2xl">Share your list</h2>
            <p className="text-xs text-text-muted mt-1">
              Once we have your name, we&apos;ll open WhatsApp with your link
              ready to send. The recipient can browse the atelier as your guest.
            </p>

            <form onSubmit={onSubmitProfile} className="mt-6 grid gap-4">
              <Field
                name="sharer_name"
                label="Your name"
                placeholder="Alice"
                required
                defaultValue={profile.name ?? ''}
              />
              <Field
                name="sharer_email"
                label="Your email (optional, lets the recipient reply)"
                type="email"
                defaultValue={profile.email ?? ''}
              />
              <Field
                name="title"
                label="Title for this list (optional)"
                placeholder="e.g. Cannes shortlist"
                defaultValue={profile.title ?? ''}
              />
              <Field
                name="message"
                label="A short note (optional)"
                textarea
                defaultValue={profile.message ?? ''}
              />

              {err && <p className="text-sm text-red-400">{err}</p>}

              <button
                type="submit"
                disabled={pending}
                className="mt-2 self-start border border-accent px-8 py-3 text-xs uppercase tracking-[0.25em] text-accent hover:bg-accent hover:text-bg-primary transition-colors disabled:opacity-50"
              >
                {pending ? 'Preparing…' : 'Continue to WhatsApp'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function Field({
  name,
  label,
  type = 'text',
  placeholder,
  defaultValue,
  required,
  textarea,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
  textarea?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-[0.25em] text-text-muted">{label}</span>
      {textarea ? (
        <textarea
          name={name}
          rows={3}
          defaultValue={defaultValue}
          placeholder={placeholder}
          className="mt-2 w-full bg-bg-secondary border border-divider px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
      ) : (
        <input
          name={name}
          type={type}
          required={required}
          defaultValue={defaultValue}
          placeholder={placeholder}
          className="mt-2 w-full bg-bg-secondary border border-divider px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
      )}
    </label>
  );
}
