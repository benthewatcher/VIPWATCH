'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Check } from 'lucide-react';
import { sendVisitorMessage } from '@/app/(admin)/admin/visitors/actions';

export function VisitorCompose({ visitorId, hasEmail }: { visitorId: string; hasEmail: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [sentAt, setSentAt] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [sendEmail, setSendEmail] = useState(hasEmail);
  const [sendBanner, setSendBanner] = useState(true);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    const formEl = e.currentTarget;
    const fd = new FormData(formEl);
    const subject = String(fd.get('subject') ?? '').trim();
    const body = String(fd.get('body') ?? '').trim();
    if (!body) {
      setErr('Write a message before sending.');
      return;
    }
    startTransition(async () => {
      const res = await sendVisitorMessage({
        visitor_id: visitorId,
        subject: subject || null,
        body,
        channels: { email: sendEmail, banner: sendBanner },
      });
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      setSentAt(Date.now());
      formEl?.reset();
      router.refresh();
      setTimeout(() => setSentAt(null), 4000);
    });
  }

  return (
    <section className="border border-divider p-6 max-w-3xl">
      <h2 className="font-serif text-2xl">Send a note</h2>
      <p className="text-xs text-text-muted mt-1">
        Bespoke message to this visitor. Choose whether to deliver by email,
        on-site banner (next time they visit), or both.
      </p>

      <form onSubmit={onSubmit} className="mt-6 grid gap-4">
        <label className="block">
          <span className="text-[11px] uppercase tracking-[0.25em] text-text-muted">
            Subject <span className="ml-2 normal-case tracking-normal text-text-muted/60">(used as the email subject)</span>
          </span>
          <input
            name="subject"
            type="text"
            placeholder="A note from VIP WATCH"
            className="mt-2 w-full bg-bg-secondary border border-divider px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="text-[11px] uppercase tracking-[0.25em] text-text-muted">Message</span>
          <textarea
            name="body"
            rows={6}
            required
            placeholder={'Hi Alice,\n\nI\'ve been thinking about the Cannes piece you hearted — there is a stone I came across that would be perfect…'}
            className="mt-2 w-full bg-bg-secondary border border-divider px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
        </label>

        <div className="flex flex-wrap items-center gap-6">
          <label className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-text-muted">
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              disabled={!hasEmail}
            />
            Send email{!hasEmail && <span className="text-text-muted/70 normal-case tracking-normal ml-1">(no email on file)</span>}
          </label>
          <label className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-text-muted">
            <input
              type="checkbox"
              checked={sendBanner}
              onChange={(e) => setSendBanner(e.target.checked)}
            />
            Show on-site banner
          </label>
        </div>

        {err && <p className="text-sm text-red-400">{err}</p>}

        <div>
          <button
            type="submit"
            disabled={pending || (!sendEmail && !sendBanner)}
            className="inline-flex items-center gap-2 border border-accent px-6 py-3 text-xs uppercase tracking-[0.25em] text-accent hover:bg-accent hover:text-bg-primary transition-colors disabled:opacity-50"
          >
            {sentAt ? <Check size={14} /> : <Send size={14} />}
            {pending ? 'Sending…' : sentAt ? 'Sent' : 'Send'}
          </button>
        </div>
      </form>
    </section>
  );
}
