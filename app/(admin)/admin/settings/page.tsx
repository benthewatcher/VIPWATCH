import { AdminHeader } from '@/components/admin/AdminHeader';

export const metadata = { title: 'Settings' };

export default function SettingsPage() {
  return (
    <>
      <AdminHeader title="Settings" />
      <main className="p-10 grid gap-8 max-w-3xl">
        <section className="border border-divider p-6">
          <h2 className="font-serif text-xl">Environment</h2>
          <p className="text-xs text-text-muted mt-2">
            Site-wide configuration (WhatsApp number, GA ID, Resend keys, Supabase keys) lives in
            Vercel → Project Settings → Environment Variables. Editing it from the admin would be
            a security risk — settings stay in code.
          </p>
        </section>
        <section className="border border-divider p-6">
          <h2 className="font-serif text-xl">Site address &amp; contact</h2>
          <p className="text-xs text-text-muted mt-2">
            The atelier address shown in the footer is stored in the
            <code className="px-1.5 py-0.5 bg-bg-secondary border border-divider mx-1 text-xs">settings</code>
            table (key <code>contact</code>). Edit via Supabase Table Editor for now — a form
            will follow once the copy is finalised.
          </p>
        </section>
      </main>
    </>
  );
}
