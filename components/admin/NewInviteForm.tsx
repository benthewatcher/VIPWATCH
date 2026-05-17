'use client';

import { useState, useTransition } from 'react';
import { Copy, Check, Plus } from 'lucide-react';
import { createInvite } from '@/app/(admin)/admin/invites/actions';

export function NewInviteForm() {
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [created, setCreated] = useState<{ token: string; label: string; url: string } | null>(null);
  const [copied, setCopied] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    const fd = new FormData(e.currentTarget);
    const input = {
      label: String(fd.get('label') ?? '').trim(),
      phone: String(fd.get('phone') ?? '').trim() || null,
      email: String(fd.get('email') ?? '').trim() || null,
      notes: String(fd.get('notes') ?? '').trim() || null,
      max_uses: fd.get('max_uses') ? Number(fd.get('max_uses')) : null,
      expires_in_days: fd.get('expires_in_days') ? Number(fd.get('expires_in_days')) : 30,
    };
    if (!input.label) {
      setErr('Label is required.');
      return;
    }
    startTransition(async () => {
      const r = await createInvite(input);
      if (!r.ok) {
        setErr(r.error);
        return;
      }
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://forvip.watch';
      setCreated({ token: r.token, label: input.label, url: `${origin}/i/${r.token}` });
      (e.currentTarget as HTMLFormElement).reset();
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
        <Field name="label" label="Label" placeholder="e.g. Roger Smith" required />
        <div className="grid md:grid-cols-2 gap-4">
          <Field name="phone" label="Phone (for SMS re-auth)" placeholder="+44 7521 808964" />
          <Field name="email" label="Email (admin reference)" type="email" placeholder="rger@example.com" />
        </div>
        <Field name="notes" label="Notes" placeholder="Where you met, context, etc." />
        <div className="grid md:grid-cols-2 gap-4">
          <Field
            name="max_uses"
            label="Max uses"
            type="number"
            placeholder="leave blank = unlimited"
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
