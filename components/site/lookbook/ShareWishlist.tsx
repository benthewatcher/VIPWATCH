'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Share2 } from 'lucide-react';
import { getWishlist, subscribe } from '@/lib/wishlist/local';

// Pre-creates / updates the share token in the background so the Share
// button is always a plain <a> link — no async on click → no popup blocking.

const NAME_KEY = 'vipwatch:wishlist:sharer-name';
const TOKEN_KEY = 'vipwatch:wishlist:share-token';
const TITLE_KEY = 'vipwatch:wishlist:share-title';
const MESSAGE_KEY = 'vipwatch:wishlist:share-message';
const DEFAULT_TITLE = 'VIP WATCHES';

function readLs(key: string): string {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(key) ?? '';
}
function writeLs(key: string, value: string) {
  if (typeof window === 'undefined') return;
  if (value) window.localStorage.setItem(key, value);
  else window.localStorage.removeItem(key);
}
function readName(): string {
  return readLs(NAME_KEY);
}
function writeName(name: string) {
  writeLs(NAME_KEY, name);
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

function buildWhatsAppHref(
  token: string,
  count: number,
  name: string,
  title: string,
  message: string,
): string {
  const url = `${shareOrigin()}/wishlist/${token}`;
  const lines = [
    title || DEFAULT_TITLE,
    '',
    message || `${count} piece${count === 1 ? '' : 's'} I've been looking at:`,
    url,
    '',
    name ? `— ${name}` : '',
  ].filter(Boolean);
  return `https://wa.me/?text=${encodeURIComponent(lines.join('\n'))}`;
}

export function ShareWishlist() {
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const lastSynced = useRef<string>('');

  const sync = useCallback(
    async (overrides?: { name?: string; title?: string; message?: string }) => {
      const ids = getWishlist();
      if (ids.length === 0) return;
      const currentName = overrides?.name ?? readName();
      const currentTitle = overrides?.title ?? readLs(TITLE_KEY);
      const currentMessage = overrides?.message ?? readLs(MESSAGE_KEY);
      const signature = [ids.join(','), currentName, currentTitle, currentMessage].join('|');
      if (signature === lastSynced.current) return;

      setSyncing(true);
      setErr(null);
      try {
        const res = await fetch('/api/wishlist/share', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          token: readToken(),
          commission_ids: ids,
          title: currentTitle || DEFAULT_TITLE,
          message: currentMessage || null,
          sharer_name: currentName || null,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        token?: string;
        error?: string;
      };
      if (res.ok && body.token) {
        writeToken(body.token);
        setToken(body.token);
        lastSynced.current = signature;
      } else if (body.error) {
        setErr(body.error);
      }
    } catch (e) {
      setErr((e as Error)?.message ?? 'Could not prepare link');
    } finally {
      setSyncing(false);
    }
  }, []);

  // Initial load + subscribe to wishlist changes for live token sync.
  useEffect(() => {
    setName(readName());
    setTitle(readLs(TITLE_KEY));
    setMessage(readLs(MESSAGE_KEY));
    setToken(readToken());
    setCount(getWishlist().length);
    sync();
    return subscribe(() => {
      setCount(getWishlist().length);
      sync();
    });
  }, [sync]);

  function onSubmitName(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const next = String(fd.get('name') ?? '').trim();
    if (!next) {
      setErr('Enter your name to continue.');
      return;
    }
    writeName(next);
    setName(next);
    setErr(null);
    sync({ name: next });
  }

  function commitTitle(value: string) {
    const v = value.trim();
    writeLs(TITLE_KEY, v);
    setTitle(v);
    sync({ title: v });
  }

  function commitMessage(value: string) {
    const v = value.trim();
    writeLs(MESSAGE_KEY, v);
    setMessage(v);
    sync({ message: v });
  }

  if (count === 0) return null;

  // No name yet → show inline prompt.
  if (!name) {
    return (
      <form onSubmit={onSubmitName} className="grid gap-2 sm:flex sm:items-end sm:gap-3">
        <label className="block flex-1">
          <span className="text-[11px] uppercase tracking-[0.25em] text-text-muted">
            Your name
          </span>
          <input
            name="name"
            type="text"
            autoComplete="name"
            required
            placeholder="To share, we need your name first"
            className="mt-2 w-full bg-transparent border-b border-divider py-2 text-sm focus:border-accent focus:outline-none"
          />
        </label>
        <button
          type="submit"
          className="inline-flex items-center gap-2 border border-accent px-6 py-2.5 text-xs uppercase tracking-[0.25em] text-accent hover:bg-accent hover:text-bg-primary transition-colors whitespace-nowrap"
        >
          <Share2 size={14} /> Save & share
        </button>
        {err && (
          <p className="sm:basis-full text-sm text-red-400 sm:mt-2">{err}</p>
        )}
      </form>
    );
  }

  // Name set, token still being prepared.
  if (!token) {
    return (
      <span className="text-xs uppercase tracking-[0.25em] text-text-muted">
        {syncing ? 'Preparing share link…' : err || 'Preparing share link…'}
      </span>
    );
  }

  const href = buildWhatsAppHref(token, count, name, title, message);

  return (
    <div className="grid gap-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="block">
          <span className="text-[11px] uppercase tracking-[0.25em] text-text-muted">
            Title (optional)
          </span>
          <input
            type="text"
            defaultValue={title}
            placeholder={DEFAULT_TITLE}
            onBlur={(e) => commitTitle(e.currentTarget.value)}
            className="mt-2 w-full bg-transparent border-b border-divider py-2 text-sm focus:border-accent focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-[11px] uppercase tracking-[0.25em] text-text-muted">
            Note (optional)
          </span>
          <input
            type="text"
            defaultValue={message}
            placeholder="A short note to the recipient"
            onBlur={(e) => commitMessage(e.currentTarget.value)}
            className="mt-2 w-full bg-transparent border-b border-divider py-2 text-sm focus:border-accent focus:outline-none"
          />
        </label>
      </div>
      <div className="flex items-center gap-3">
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 border border-accent px-8 py-3 text-xs uppercase tracking-[0.25em] text-accent hover:bg-accent hover:text-bg-primary transition-colors"
        >
          <Share2 size={14} /> Share via WhatsApp
        </a>
        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.localStorage.removeItem(NAME_KEY);
              setName('');
            }
          }}
          className="text-[11px] uppercase tracking-[0.25em] text-text-muted hover:text-accent"
          title="Change the name shown on shares"
        >
          Change name
        </button>
        {syncing && (
          <span className="text-[10px] uppercase tracking-[0.25em] text-text-muted">Saving…</span>
        )}
      </div>
    </div>
  );
}
