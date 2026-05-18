'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Check, X } from 'lucide-react';
import { updateVisitor } from '@/app/(admin)/admin/visitors/actions';

type Props = {
  visitorId: string;
  initial: {
    name: string | null;
    email: string | null;
    phone: string | null;
  };
};

export function VisitorEdit({ visitorId, initial }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [name, setName] = useState(initial.name ?? '');
  const [email, setEmail] = useState(initial.email ?? '');
  const [phone, setPhone] = useState(initial.phone ?? '');

  function reset() {
    setName(initial.name ?? '');
    setEmail(initial.email ?? '');
    setPhone(initial.phone ?? '');
    setErr(null);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    startTransition(async () => {
      const res = await updateVisitor({ id: visitorId, name, email, phone });
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-text-muted hover:text-accent"
      >
        <Pencil size={12} /> Edit details
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 grid gap-4 max-w-md">
      <Field label="Name" value={name} onChange={setName} placeholder="Alice" />
      <Field label="Email" value={email} onChange={setEmail} type="email" placeholder="alice@example.com" />
      <Field label="Phone" value={phone} onChange={setPhone} type="tel" placeholder="+447852111111" />

      {err && <p className="text-sm text-red-400">{err}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 border border-accent px-5 py-2 text-xs uppercase tracking-[0.25em] text-accent hover:bg-accent hover:text-bg-primary transition-colors disabled:opacity-50"
        >
          <Check size={14} /> {pending ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={() => { reset(); setEditing(false); }}
          disabled={pending}
          className="inline-flex items-center gap-2 border border-divider px-5 py-2 text-xs uppercase tracking-[0.25em] text-text-muted hover:text-text-primary transition-colors"
        >
          <X size={14} /> Cancel
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-[0.25em] text-text-muted">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full bg-bg-secondary border border-divider px-3 py-2 text-sm focus:border-accent focus:outline-none"
      />
    </label>
  );
}
