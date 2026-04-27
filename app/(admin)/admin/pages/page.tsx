import Link from 'next/link';
import { AdminHeader } from '@/components/admin/AdminHeader';

export const metadata = { title: 'Pages' };

const PAGES = [
  { key: 'home', label: 'Home', desc: 'Hero copy + CTA + intro' },
  { key: 'atelier', label: 'Atelier', desc: 'About / story / team' },
  { key: 'arts-and-crafts', label: 'Arts & Crafts', desc: 'Craft showcases' },
  { key: 'warranty', label: 'Warranty', desc: 'International warranty' },
  { key: 'process-intro', label: 'Process intro', desc: 'Header for the process page' },
];

export default function PagesAdmin() {
  return (
    <>
      <AdminHeader title="Pages" />
      <main className="p-10">
        <div className="grid gap-3 max-w-3xl">
          {PAGES.map((p) => (
            <Link
              key={p.key}
              href={`/admin/pages/${p.key}`}
              className="flex items-center justify-between border border-divider bg-bg-secondary px-6 py-5 hover:border-accent transition-colors"
            >
              <div>
                <p className="font-serif text-2xl">{p.label}</p>
                <p className="text-xs text-text-muted mt-1">{p.desc}</p>
              </div>
              <span className="text-xs uppercase tracking-[0.2em] text-text-muted">Edit →</span>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
