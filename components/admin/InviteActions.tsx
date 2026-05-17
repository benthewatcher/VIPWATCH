'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Check, ShieldOff, ShieldCheck, Trash } from 'lucide-react';
import { revokeInvite, unrevokeInvite, deleteInvite } from '@/app/(admin)/admin/invites/actions';

export function InviteActions({
  id,
  token,
  isRevoked,
}: {
  id: string;
  token: string;
  isRevoked: boolean;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  const url = typeof window !== 'undefined'
    ? `${window.location.origin}/i/${token}`
    : `https://forvip.watch/i/${token}`;

  function copy() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function onRevoke() {
    startTransition(async () => {
      await revokeInvite(id);
      router.refresh();
    });
  }
  function onUnrevoke() {
    startTransition(async () => {
      await unrevokeInvite(id);
      router.refresh();
    });
  }
  function onDelete() {
    if (!confirm('Delete this invite permanently? Usage history will go with it.')) return;
    startTransition(async () => {
      await deleteInvite(id);
      router.push('/admin/invites');
    });
  }

  return (
    <section className="border border-divider p-6 max-w-3xl">
      <h2 className="text-xs uppercase tracking-[0.2em] text-text-muted">Share link</h2>
      <div className="mt-3 flex items-center gap-2">
        <code className="flex-1 font-mono text-xs break-all bg-bg-secondary border border-divider px-3 py-2">
          {url}
        </code>
        <button
          type="button"
          onClick={copy}
          className="grid place-items-center w-10 h-10 border border-divider hover:border-accent hover:text-accent"
          aria-label="Copy"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {isRevoked ? (
          <button
            type="button"
            onClick={onUnrevoke}
            disabled={pending}
            className="inline-flex items-center gap-2 border border-divider px-4 py-2 text-xs uppercase tracking-[0.2em] text-text-muted hover:border-accent hover:text-accent disabled:opacity-50"
          >
            <ShieldCheck size={14} /> Restore
          </button>
        ) : (
          <button
            type="button"
            onClick={onRevoke}
            disabled={pending}
            className="inline-flex items-center gap-2 border border-divider px-4 py-2 text-xs uppercase tracking-[0.2em] text-text-muted hover:border-red-400 hover:text-red-400 disabled:opacity-50"
          >
            <ShieldOff size={14} /> Revoke
          </button>
        )}
        <button
          type="button"
          onClick={onDelete}
          disabled={pending}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-[0.2em] text-text-muted hover:text-red-400 ml-auto disabled:opacity-50"
        >
          <Trash size={14} /> Delete
        </button>
      </div>
    </section>
  );
}
