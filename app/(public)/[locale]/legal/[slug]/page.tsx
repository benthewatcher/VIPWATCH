import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

const SUPPORTED_SLUGS = new Set(['privacy', 'terms', 'legal-notice']);

const TITLES: Record<string, string> = {
  privacy: 'Privacy Policy',
  terms: 'Terms of Service',
  'legal-notice': 'Legal Notice',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const title = TITLES[slug];
  if (!title) return {};
  return {
    title: `${title} — VIP WATCH`,
    description:
      slug === 'privacy'
        ? 'How VIP WATCH collects, uses and protects personal data of our visitors, clients and prospects.'
        : `${title} for VIP WATCH.`,
  };
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  if (!SUPPORTED_SLUGS.has(slug)) notFound();
  if (slug === 'privacy') return <PrivacyPolicy />;
  return <ComingSoon title={TITLES[slug] ?? slug} />;
}

function ComingSoon({ title }: { title: string }) {
  return (
    <article className="mx-auto max-w-3xl px-6 py-24 md:py-32 text-text-primary">
      <header className="mb-12">
        <p className="text-[11px] uppercase tracking-[0.4em] text-accent">Legal</p>
        <h1 className="font-serif text-4xl md:text-5xl mt-4 tracking-tight">{title}</h1>
      </header>
      <p className="text-text-muted text-sm md:text-base leading-relaxed">
        This page is being prepared. In the meantime, please email{' '}
        <a href="mailto:bespoke@forvip.watch" className="text-accent hover:underline">
          bespoke@forvip.watch
        </a>{' '}
        with any questions about how we work or your data.
      </p>
    </article>
  );
}

function PrivacyPolicy() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-24 md:py-32 text-text-primary">
      <header className="mb-12">
        <p className="text-[11px] uppercase tracking-[0.4em] text-accent">Legal</p>
        <h1 className="font-serif text-4xl md:text-5xl mt-4 tracking-tight">Privacy Policy</h1>
        <p className="mt-6 text-text-muted text-sm">Last updated: 17 May 2026</p>
      </header>

      <div className="prose prose-invert max-w-none text-sm md:text-base leading-relaxed space-y-8">
        <Section title="1. Who we are">
          <p>
            VIP WATCH (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is a private atelier offering
            bespoke watchmaking commissions. This policy explains how we handle personal data we
            collect from visitors to our site at <strong>forvip.watch</strong> and from the people
            who reach out to us by invitation.
          </p>
          <p>
            If you have any questions about this policy or your data, contact us at{' '}
            <a href="mailto:bespoke@forvip.watch" className="text-accent hover:underline">
              bespoke@forvip.watch
            </a>
            .
          </p>
        </Section>

        <Section title="2. The data we collect">
          <p>We collect only what we need to respond to you and run the site:</p>
          <ul className="list-disc pl-5 space-y-2 text-text-muted">
            <li>
              <strong className="text-text-primary">Identity & contact details</strong> — your name,
              email address and (optionally) phone number, when you accept an invitation or send us
              an enquiry.
            </li>
            <li>
              <strong className="text-text-primary">Invitation & visit data</strong> — the invite
              token you used, the time of your visits, an anonymised hash of your IP address, and a
              short note of your browser, so we can prevent abuse and personalise responses.
            </li>
            <li>
              <strong className="text-text-primary">Enquiry content</strong> — anything you write to
              us in the enquiry form or by email.
            </li>
            <li>
              <strong className="text-text-primary">Wishlist & sharing</strong> — the watches you
              save to a wishlist (stored locally in your browser), and the optional title, note and
              your first name when you share a wishlist link.
            </li>
            <li>
              <strong className="text-text-primary">Analytics</strong> — basic, aggregated usage
              metrics (pages viewed, country, device class) collected by Google Analytics. No
              cross-site tracking.
            </li>
          </ul>
        </Section>

        <Section title="3. Why we use it (lawful basis)">
          <ul className="list-disc pl-5 space-y-2 text-text-muted">
            <li>
              <strong className="text-text-primary">To respond to your enquiry</strong> — performance
              of a contract, or steps to enter into one.
            </li>
            <li>
              <strong className="text-text-primary">To keep the site invite-only & secure</strong> —
              our legitimate interest in protecting our work and our clients.
            </li>
            <li>
              <strong className="text-text-primary">To send you occasional updates</strong> — only
              with your consent, withdrawable at any time.
            </li>
            <li>
              <strong className="text-text-primary">To meet legal obligations</strong> — e.g. tax,
              anti-money-laundering checks where a commission proceeds.
            </li>
          </ul>
        </Section>

        <Section title="4. Who we share it with">
          <p>
            We do not sell or rent personal data. We share it only with the service providers we
            need to operate:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-text-muted">
            <li>
              <strong className="text-text-primary">Supabase</strong> — secure database & auth
              (EU region).
            </li>
            <li>
              <strong className="text-text-primary">Vercel</strong> — site hosting and edge
              delivery.
            </li>
            <li>
              <strong className="text-text-primary">Resend</strong> — transactional email delivery.
            </li>
            <li>
              <strong className="text-text-primary">Twilio</strong> — SMS one-time codes for
              invited visitors who choose to sign back in by phone.
            </li>
            <li>
              <strong className="text-text-primary">Google Analytics</strong> — anonymised usage
              statistics.
            </li>
          </ul>
          <p>
            Each provider is bound by its own data-processing terms. We do not give them permission
            to use your data for their own purposes.
          </p>
        </Section>

        <Section title="5. Where it is stored">
          <p>
            We store data inside the United Kingdom and the European Economic Area where possible.
            Some of our providers (Vercel, Twilio, Google) may process data in the United States
            under standard contractual clauses or equivalent safeguards.
          </p>
        </Section>

        <Section title="6. How long we keep it">
          <ul className="list-disc pl-5 space-y-2 text-text-muted">
            <li>
              <strong className="text-text-primary">Enquiries</strong> — up to 3 years from your
              last contact with us, then deleted.
            </li>
            <li>
              <strong className="text-text-primary">Client commission records</strong> — up to 7
              years after the work completes, to meet UK accounting and warranty obligations.
            </li>
            <li>
              <strong className="text-text-primary">Visitor session logs</strong> — up to 12 months,
              then deleted.
            </li>
            <li>
              <strong className="text-text-primary">Newsletter subscribers</strong> — until you
              unsubscribe.
            </li>
          </ul>
        </Section>

        <Section title="7. Your rights">
          <p>Under UK and EU data-protection law, you have the right to:</p>
          <ul className="list-disc pl-5 space-y-2 text-text-muted">
            <li>Ask what data we hold about you and request a copy.</li>
            <li>Ask us to correct anything that is wrong.</li>
            <li>Ask us to delete your data, where we have no overriding legal obligation to keep it.</li>
            <li>Ask us to restrict or stop processing.</li>
            <li>Withdraw consent at any time (e.g. unsubscribe from the newsletter).</li>
            <li>Complain to the UK Information Commissioner&apos;s Office at ico.org.uk.</li>
          </ul>
          <p>
            To exercise any of these rights, email{' '}
            <a href="mailto:bespoke@forvip.watch" className="text-accent hover:underline">
              bespoke@forvip.watch
            </a>
            . We aim to respond within 30 days.
          </p>
        </Section>

        <Section title="8. Cookies & local storage">
          <p>We use the minimum necessary:</p>
          <ul className="list-disc pl-5 space-y-2 text-text-muted">
            <li>
              <strong className="text-text-primary">Essential cookies</strong> — a signed session
              cookie (<code className="text-accent">vipw_session</code>) that proves you have a
              valid invitation, and Supabase auth cookies for admins.
            </li>
            <li>
              <strong className="text-text-primary">Analytics cookies</strong> — Google Analytics
              cookies (<code className="text-accent">_ga</code>, <code className="text-accent">_ga_*</code>)
              for aggregated visit data.
            </li>
            <li>
              <strong className="text-text-primary">Local storage</strong> — your wishlist and the
              first name you provide for sharing are stored in your own browser, not on our
              servers, until you choose to share or sign in.
            </li>
          </ul>
        </Section>

        <Section title="9. Changes to this policy">
          <p>
            We will post any material change here, with a new &quot;last updated&quot; date. For
            substantial changes that affect how we use your data, we will also email you if we have
            your address.
          </p>
        </Section>
      </div>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-serif text-2xl md:text-3xl tracking-tight mb-4">{title}</h2>
      <div className="space-y-4 text-text-muted">{children}</div>
    </section>
  );
}
