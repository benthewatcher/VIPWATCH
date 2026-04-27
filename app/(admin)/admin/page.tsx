import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Dashboard' };

async function getCounts() {
  const supabase = await createClient();
  const tables = ['commissions', 'services', 'blog_posts', 'enquiries', 'newsletter_subscribers'] as const;
  const counts: Record<string, number> = {};
  await Promise.all(
    tables.map(async (t) => {
      const { count } = await supabase.from(t).select('*', { count: 'exact', head: true });
      counts[t] = count ?? 0;
    }),
  );
  return counts;
}

export default async function AdminDashboard() {
  const counts = await getCounts();

  const tiles = [
    { k: 'commissions', label: 'Commissions', href: '/admin/commissions' },
    { k: 'services', label: 'Services', href: '/admin/services' },
    { k: 'blog_posts', label: 'Blog posts', href: '/admin/blog' },
    { k: 'enquiries', label: 'Enquiries', href: '/admin/enquiries' },
    { k: 'newsletter_subscribers', label: 'Subscribers', href: '/admin/newsletter' },
  ];

  return (
    <main className="p-10">
      <h1 className="font-serif text-4xl">Dashboard</h1>
      <div className="mt-10 grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        {tiles.map((t) => (
          <Link
            key={t.k}
            href={t.href}
            className="block border border-divider bg-bg-secondary p-6 hover:border-accent transition-colors"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-text-muted">{t.label}</p>
            <p className="font-serif text-4xl mt-2">{counts[t.k] ?? 0}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
