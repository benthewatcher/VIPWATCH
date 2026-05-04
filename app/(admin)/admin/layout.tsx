import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { signOut } from './actions';

const adminNav = [
  { label: 'Dashboard', href: '/admin' },
  { label: 'Home page', href: '/admin/home' },
  { label: 'Commissions', href: '/admin/commissions' },
  { label: 'Collections', href: '/admin/collections' },
  { label: 'Departments', href: '/admin/departments' },
  { label: 'Services', href: '/admin/services' },
  { label: 'Process', href: '/admin/process' },
  { label: 'Pages', href: '/admin/pages' },
  { label: 'Testimonials', href: '/admin/testimonials' },
  { label: 'Blog', href: '/admin/blog' },
  { label: 'FAQ', href: '/admin/faq' },
  { label: 'Enquiries', href: '/admin/enquiries' },
  { label: 'Newsletter', href: '/admin/newsletter' },
  { label: 'Legal', href: '/admin/legal' },
  { label: 'Media', href: '/admin/media' },
  { label: 'Team', href: '/admin/team' },
  { label: 'Settings', href: '/admin/settings' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // The proxy gates protected admin routes. /admin/login and /admin/auth/* render
  // without chrome (no user yet); render children only.
  if (!user) return <>{children}</>;

  return (
    <div className="min-h-screen flex bg-bg-primary text-text-primary">
      <aside className="w-64 border-r border-divider px-6 py-8 hidden lg:flex flex-col">
        <div className="font-serif text-xl tracking-[0.25em] uppercase mb-10">VIP WATCH</div>
        <nav className="flex flex-col gap-1 flex-1">
          {adminNav.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              className="text-sm py-2 text-text-muted hover:text-text-primary transition-colors"
            >
              {i.label}
            </Link>
          ))}
        </nav>
        <div className="pt-6 border-t border-divider">
          <p className="text-xs text-text-muted truncate">{user.email}</p>
          <form action={signOut}>
            <button
              type="submit"
              className="mt-3 text-xs uppercase tracking-[0.2em] text-text-muted hover:text-accent"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
