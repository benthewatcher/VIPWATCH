import type { Metadata } from 'next';
import { RequestAccessForm } from '@/components/site/RequestAccessForm';

export const metadata: Metadata = {
  title: 'By invitation only — VIP WATCH',
  robots: { index: false, follow: false },
};

const REASONS: Record<string, string> = {
  invalid: 'That invitation could not be matched.',
  expired: 'That invitation has expired.',
  revoked: 'That invitation has been withdrawn.',
  used: 'That invitation has already been claimed.',
  missing: 'No invitation was provided.',
};

export default async function Waitlist({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string; from?: string }>;
}) {
  const { reason } = await searchParams;
  const message = reason && REASONS[reason] ? REASONS[reason] : null;

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-24 bg-bg-primary text-text-primary">
      <div className="max-w-xl w-full text-center">
        <p className="text-[11px] uppercase tracking-[0.4em] text-accent">VIP WATCH</p>
        <h1 className="font-serif text-5xl md:text-6xl mt-6 tracking-tight leading-[1.05]">
          By invitation only
        </h1>
        <p className="mt-8 text-text-primary/80 text-base md:text-lg leading-relaxed">
          We work for a small circle of collectors. Access to the atelier is by personal
          invitation. If you know someone who has commissioned a piece, ask them to share
          their link with you — otherwise drop your details below and we&apos;ll be in touch.
        </p>

        {message && (
          <p className="mt-8 inline-block border border-divider px-5 py-3 text-sm text-text-muted">
            {message}
          </p>
        )}

        <RequestAccessForm />

        <p className="mt-10 text-[11px] uppercase tracking-[0.25em] text-text-muted">
          Already invited?{' '}
          <a href="/signin" className="text-accent hover:underline">
            Sign in with SMS →
          </a>
        </p>
      </div>
    </main>
  );
}
