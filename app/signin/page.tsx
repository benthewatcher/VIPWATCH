import type { Metadata } from 'next';
import { SignInForm } from '@/components/site/SignInForm';

export const metadata: Metadata = {
  title: 'Sign in — VIP WATCH',
  robots: { index: false, follow: false },
};

export default function SignInPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-24 bg-bg-primary text-text-primary">
      <div className="max-w-md w-full text-center">
        <p className="text-[11px] uppercase tracking-[0.4em] text-accent">VIP WATCH</p>
        <h1 className="font-serif text-4xl md:text-5xl mt-6 tracking-tight leading-[1.05]">
          Sign in
        </h1>
        <p className="mt-6 text-text-primary/75 text-sm md:text-base leading-relaxed">
          Enter the phone number associated with your invitation. We&apos;ll send you a
          one-time code by SMS.
        </p>

        <SignInForm />
      </div>
    </main>
  );
}
