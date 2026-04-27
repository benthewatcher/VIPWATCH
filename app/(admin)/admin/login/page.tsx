import { Suspense } from 'react';
import { LoginForm } from './login-form';

export const metadata = { title: 'Sign in' };

export default function AdminLogin() {
  return (
    <main className="min-h-screen flex items-center justify-center p-10 bg-bg-primary text-text-primary">
      <div className="w-full max-w-sm">
        <div className="font-serif text-2xl tracking-[0.25em] uppercase text-center">VIP WATCH</div>
        <h1 className="text-center mt-10 text-xs uppercase tracking-[0.25em] text-text-muted">
          Atelier Admin
        </h1>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
