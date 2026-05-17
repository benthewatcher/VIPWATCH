import type { Metadata } from 'next';

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
      <div className="max-w-xl text-center">
        <p className="text-[11px] uppercase tracking-[0.4em] text-accent">VIP WATCH</p>
        <h1 className="font-serif text-5xl md:text-6xl mt-6 tracking-tight leading-[1.05]">
          By invitation only
        </h1>
        <p className="mt-8 text-text-primary/80 text-base md:text-lg leading-relaxed">
          We work for a small circle of collectors. Access to the atelier is by personal
          invitation. If you know someone who has commissioned a piece, ask them to share
          their link with you. We'll be in touch shortly.
        </p>

        {message && (
          <p className="mt-8 inline-block border border-divider px-5 py-3 text-sm text-text-muted">
            {message}
          </p>
        )}

        <div className="mt-12">
          <p className="text-[11px] uppercase tracking-[0.4em] text-text-muted">For introductions</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a
              href="mailto:bespoke@forvip.watch?subject=Request%20for%20introduction%20%E2%80%94%20VIP%20WATCH&body=Hello%2C%0A%0AI%20would%20like%20to%20be%20introduced%20to%20the%20atelier.%0A%0AMy%20name%3A%20%0ALocation%3A%20%0A%0AA%20brief%20about%20the%20piece%20I%20have%20in%20mind%3A%20%0A"
              className="inline-flex items-center gap-2 border border-accent px-8 py-3 text-xs uppercase tracking-[0.25em] text-accent hover:bg-accent hover:text-bg-primary transition-colors"
            >
              {/* mail glyph */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" />
              </svg>
              Email us
            </a>
            <WhatsAppCta />
          </div>
          <p className="mt-6 text-[11px] uppercase tracking-[0.25em] text-text-muted/70">
            bespoke@forvip.watch
          </p>
        </div>
      </div>
    </main>
  );
}

function WhatsAppCta() {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  if (!number) return null;
  const message = encodeURIComponent(
    'Hello — I would like to be introduced to VIP WATCH. Could you send me an invitation link?',
  );
  return (
    <a
      href={`https://wa.me/${number}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 border border-divider px-8 py-3 text-xs uppercase tracking-[0.25em] text-text-muted hover:border-accent hover:text-accent transition-colors"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M19.05 4.91A10 10 0 0 0 2.55 16.83L1 22l5.3-1.38a10 10 0 0 0 4.7 1.2h.01a10 10 0 0 0 8.04-15.91ZM11.02 20.13h-.01a8.32 8.32 0 0 1-4.24-1.16l-.3-.18-3.14.82.84-3.07-.2-.32a8.31 8.31 0 1 1 7.05 3.91Zm4.56-6.21c-.25-.13-1.47-.73-1.7-.81-.22-.08-.39-.13-.55.13-.16.25-.62.81-.76.97-.14.16-.28.18-.53.06-.25-.13-1.06-.39-2.02-1.24-.75-.66-1.25-1.48-1.4-1.73-.14-.25-.01-.39.11-.51.11-.11.25-.28.37-.42.13-.14.16-.25.25-.41.08-.16.04-.31-.02-.43-.06-.13-.55-1.33-.76-1.82-.2-.48-.4-.41-.55-.42l-.47-.01c-.16 0-.42.06-.64.31-.22.25-.84.82-.84 2 0 1.18.86 2.32.98 2.48.13.16 1.7 2.6 4.13 3.64.58.25 1.03.4 1.38.51.58.18 1.1.16 1.51.1.46-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.11-.23-.18-.48-.31Z" />
      </svg>
      WhatsApp us
    </a>
  );
}
