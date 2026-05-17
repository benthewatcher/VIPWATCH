'use client';

import { useState, useTransition } from 'react';
import { X, Mail } from 'lucide-react';

export function VisitorBannerClient({
  id,
  subject,
  body,
}: {
  id: string;
  subject: string | null;
  body: string;
}) {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [pending, startTransition] = useTransition();

  function markRead() {
    startTransition(async () => {
      await fetch('/api/visitor/notifications/dismiss', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setDismissed(true);
      setOpen(false);
    });
  }

  if (dismissed) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-6 z-40 max-w-[340px] grid grid-cols-[auto_1fr_auto] items-center gap-3 px-5 py-3 bg-bg-secondary border border-accent rounded-none shadow-lg text-left animate-in fade-in slide-in-from-bottom-4 duration-700"
      >
        <span className="grid place-items-center w-8 h-8 rounded-full bg-accent/15 text-accent">
          <Mail size={14} />
        </span>
        <span className="min-w-0">
          <span className="block text-[10px] uppercase tracking-[0.3em] text-accent">
            A note from the atelier
          </span>
          <span className="block text-sm text-text-primary truncate">
            {subject || 'Tap to read'}
          </span>
        </span>
        <span className="text-[10px] uppercase tracking-[0.25em] text-text-muted">Read</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[150] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center px-4 py-6"
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
            <p className="text-[11px] uppercase tracking-[0.4em] text-accent">
              A note from VIP WATCH
            </p>
            {subject && (
              <h2 className="font-serif text-2xl md:text-3xl mt-3 tracking-tight">
                {subject}
              </h2>
            )}
            <p className="mt-6 text-text-primary/85 text-base leading-relaxed whitespace-pre-line">
              {body}
            </p>

            <div className="mt-8 flex justify-end">
              <button
                type="button"
                onClick={markRead}
                disabled={pending}
                className="border border-accent px-8 py-3 text-xs uppercase tracking-[0.25em] text-accent hover:bg-accent hover:text-bg-primary transition-colors disabled:opacity-50"
              >
                {pending ? 'Closing…' : 'Mark as read'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
