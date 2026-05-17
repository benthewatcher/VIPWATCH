'use client';

import { useState, useTransition } from 'react';
import { Copy, Check, Plus } from 'lucide-react';
import { createInvite } from '@/app/(admin)/admin/invites/actions';

export function NewInviteForm() {
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [created, setCreated] = useState<{ token: string; label: string; url: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPersonal, setIsPersonal] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    // Capture form before any await — React nulls e.currentTarget on the next tick.
    const formEl = e.currentTarget;
    const fd = new FormData(formEl);
    const isPersonal = fd.get('is_personal') === 'on';
    const input = {
      label: String(fd.get('label') ?? '').trim(),
      phone: String(fd.get('phone') ?? '').trim() || null,
      email: String(fd.get('email') ?? '').trim() || null,
      notes: String(fd.get('notes') ?? '').trim() || null,
      // Personal invites are single-use: the link belongs to that one person.
      max_uses: isPersonal ? 1 : fd.get('max_uses') ? Number(fd.get('max_uses')) : null,
      expires_in_days: fd.get('expires_in_days') ? Number(fd.get('expires_in_days')) : 30,
      is_personal: isPersonal,
    };
    if (!input.label) {
      setErr(isPersonal ? "Recipient's name is required." : 'Label is required.');
      return;
    }
    if (isPersonal && !input.email && !input.phone) {
      setErr('Personal invites need at least an email or a phone for the recipient.');
      return;
    }
    startTransition(async () => {
      const r = await createInvite(input);
      if (!r.ok) {
        setErr(r.error);
        return;
      }
      const origin = inviteOrigin();
      setCreated({ token: r.token, label: input.label, url: `${origin}/i/${r.token}` });
      formEl?.reset();
    });
  }

  return (
    <section className="border border-divider p-8 max-w-3xl">
      <h2 className="font-serif text-2xl">New invite</h2>
      <p className="text-xs text-text-muted mt-1">
        Generate a personal tap-link. Share it however you like — WhatsApp, iMessage, email.
        One tap and the recipient is signed in for 60 days on that device.
      </p>

      {created && (
        <div className="mt-6 border border-accent bg-accent/5 p-4">
          <p className="text-[10px] uppercase tracking-[0.3em] text-accent">
            Created · {created.label}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <code className="flex-1 font-mono text-xs break-all bg-bg-secondary border border-divider px-3 py-2">
              {created.url}
            </code>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(created.url);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="grid place-items-center w-10 h-10 border border-divider hover:border-accent hover:text-accent"
              aria-label="Copy link"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-6 grid gap-4">
        <label className="inline-flex items-start gap-3 border border-divider bg-bg-secondary/30 p-4 cursor-pointer">
          <input
            type="checkbox"
            name="is_personal"
            checked={isPersonal}
            onChange={(e) => setIsPersonal(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            <span className="text-xs uppercase tracking-[0.2em] text-text-primary">
              Personal invite — pre-fill the recipient
            </span>
            <span className="block text-[11px] text-text-muted mt-1">
              When ticked, the recipient skips the &ldquo;What&apos;s your name?&rdquo; step.
              Their name, email and phone are read from the fields below. Single-use.
            </span>
          </span>
        </label>

        <Field
          name="label"
          label={isPersonal ? "Recipient's name" : 'Label'}
          placeholder={isPersonal ? 'e.g. Roger Smith' : 'e.g. Roger Smith / Press launch FT'}
          required
        />
        <div className="grid md:grid-cols-2 gap-4">
          <Field
            name="phone"
            label={isPersonal ? "Recipient's phone" : 'Phone (for SMS re-auth)'}
            placeholder="+44 7521 808964"
          />
          <Field
            name="email"
            label={isPersonal ? "Recipient's email" : 'Email (admin reference)'}
            type="email"
            placeholder="roger@example.com"
          />
        </div>
        <Field name="notes" label="Notes" placeholder="Where you met, context, etc." />
        <div className="grid md:grid-cols-2 gap-4">
          <Field
            name="max_uses"
            label="Max uses"
            type="number"
            placeholder={isPersonal ? '1 (locked for personal)' : 'leave blank = unlimited'}
            defaultValue={isPersonal ? '1' : ''}
          />
          <Field
            name="expires_in_days"
            label="Expires in (days)"
            type="number"
            defaultValue="30"
          />
        </div>

        {err && <p className="text-sm text-red-400">{err}</p>}

        <div>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 border border-accent px-6 py-3 text-xs uppercase tracking-[0.25em] text-accent hover:bg-accent hover:text-bg-primary transition-colors disabled:opacity-50"
          >
            <Plus size={14} />
            {pending ? 'Generating…' : 'Generate link'}
          </button>
        </div>
      </form>
    </section>
  );
}

function inviteOrigin(): string {
  // Prefer NEXT_PUBLIC_SITE_URL so links work even when admin is on localhost.
  const env = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
  if (env) return env;
  if (typeof window !== 'undefined') return window.location.origin;
  return 'https://forvip.watch';
}

function Field({
  name,
  label,
  type = 'text',
  required,
  placeholder,
  defaultValue,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.2em] text-text-muted">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="mt-2 w-full bg-bg-secondary border border-divider px-3 py-2 text-sm focus:border-accent focus:outline-none"
      />
    </label>
  );
}
