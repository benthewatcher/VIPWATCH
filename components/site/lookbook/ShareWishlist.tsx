'use client';

import { useEffect, useState, useTransition } from 'react';
import { Share2, Copy, Check, X } from 'lucide-react';
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

export function ShareWishlist() {
  const [open, setOpen] = useState(false);
  const [existingToken, setExistingToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile>({});
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setExistingToken(readToken());
    setProfile(readProfile());
  }, []);

  function openDialog() {
    setErr(null);
    setShareUrl(null);
    setCopied(false);
    setProfile(readProfile());
    setExistingToken(readToken());
    setOpen(true);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);

    const fd = new FormData(e.currentTarget);
    const next: Profile = {
      name: String(fd.get('sharer_name') ?? '').trim() || undefined,
      email: String(fd.get('sharer_email') ?? '').trim() || undefined,
      title: String(fd.get('title') ?? '').trim() || undefined,
      message: String(fd.get('message') ?? '').trim() || undefined,
    };
    writeProfile(next);
    setProfile(next);

    const ids = getWishlist();
    if (ids.length === 0) {
      setErr('Add at least one watch to your wishlist first.');
      return;
    }

    startTransition(async () => {
      const res = await fetch('/api/wishlist/share', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          token: existingToken,
          commission_ids: ids,
          title: next.title ?? null,
          message: next.message ?? null,
          sharer_name: next.name ?? null,
          sharer_email: next.email ?? null,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; token?: string; error?: string };
      if (!res.ok || !body.token) {
        setErr(body.error ?? 'Could not create a share link.');
        return;
      }
      writeToken(body.token);
      setExistingToken(body.token);
      setShareUrl(`${shareOrigin()}/wishlist/${body.token}`);
    });
  }

  function copyLink() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="inline-flex items-center gap-2 border border-accent px-8 py-3 text-xs uppercase tracking-[0.25em] text-accent hover:bg-accent hover:text-bg-primary transition-colors"
      >
        <Share2 size={14} />
        {existingToken ? 'Update share link' : 'Share this list'}
      </button>

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

            <h2 className="font-serif text-2xl">
              {existingToken ? 'Update your share link' : 'Share this list'}
            </h2>
            <p className="text-xs text-text-muted mt-1">
              We&apos;ll create a private URL you can send to anyone.
              They&apos;ll see only the watches you&apos;ve hearted.
            </p>

            {shareUrl ? (
              <div className="mt-6">
                <p className="text-[10px] uppercase tracking-[0.3em] text-accent">Your link</p>
                <div className="mt-3 flex items-center gap-2">
                  <code className="flex-1 font-mono text-xs break-all bg-bg-secondary border border-divider px-3 py-2">
                    {shareUrl}
                  </code>
                  <button
                    type="button"
                    onClick={copyLink}
                    className="grid place-items-center w-10 h-10 border border-divider hover:border-accent hover:text-accent"
                    aria-label="Copy link"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
                <p className="mt-4 text-[11px] text-text-muted">
                  Anyone with this link can see your current selection. Each time you
                  add or remove a watch, then click Share again, the same link will
                  show the updated list.
                </p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="mt-6 text-xs uppercase tracking-[0.25em] text-text-muted hover:text-accent"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="mt-6 grid gap-4">
                <Field
                  name="sharer_name"
                  label="Your name"
                  placeholder="Alice"
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
                  {pending ? 'Creating…' : existingToken ? 'Update link' : 'Create link'}
                </button>
              </form>
            )}
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
  textarea,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string;
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
          defaultValue={defaultValue}
          placeholder={placeholder}
          className="mt-2 w-full bg-bg-secondary border border-divider px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
      )}
    </label>
  );
}
