import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  COOKIE_NAME,
  verifySessionCookie,
} from '@/lib/auth/invite-session';
import { getVisitor } from '@/lib/auth/visitor';
import { WelcomeForm } from '@/components/site/WelcomeForm';

export const metadata: Metadata = {
  title: 'Welcome — VIP WATCH',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const cookieStore = await cookies();
  const session = await verifySessionCookie(cookieStore.get(COOKIE_NAME)?.value);

  // No session means the visitor never tapped a valid invite. Send them away.
  if (!session) redirect('/waitlist');

  // Already named? Skip the welcome step.
  let inviter: string | null = null;
  if (session.vid) {
    const visitor = await getVisitor(session.vid);
    if (visitor?.name) redirect(next?.startsWith('/') ? next : '/en');
    inviter = visitor?.referred_by_name ?? null;
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-24 bg-bg-primary text-text-primary">
      <div className="max-w-md w-full text-center">
        <p className="text-[11px] uppercase tracking-[0.4em] text-accent">VIP WATCH</p>
        <h1 className="font-serif text-4xl md:text-5xl mt-6 tracking-tight leading-[1.05]">
          {inviter ? `You've been invited by ${inviter}` : 'Welcome'}
        </h1>
        <p className="mt-6 text-text-primary/80 text-sm md:text-base leading-relaxed">
          Let&apos;s start with your name.
        </p>
        <WelcomeForm next={next ?? '/en'} />
      </div>
    </main>
  );
}
