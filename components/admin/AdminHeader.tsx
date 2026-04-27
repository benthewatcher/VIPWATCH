import Link from 'next/link';

export function AdminHeader({
  title,
  back,
  actions,
}: {
  title: string;
  back?: { href: string; label: string };
  actions?: React.ReactNode;
}) {
  return (
    <header className="border-b border-divider px-10 py-6 flex items-center justify-between gap-6">
      <div>
        {back && (
          <Link
            href={back.href}
            className="text-xs uppercase tracking-[0.2em] text-text-muted hover:text-text-primary"
          >
            ← {back.label}
          </Link>
        )}
        <h1 className="font-serif text-3xl mt-2">{title}</h1>
      </div>
      {actions && <div className="flex gap-3">{actions}</div>}
    </header>
  );
}
