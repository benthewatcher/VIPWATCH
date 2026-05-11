export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <section className="mx-auto max-w-7xl px-6 pt-10 pb-8 md:pt-14 md:pb-10">
      <h1 className="font-serif text-4xl md:text-5xl tracking-tight">{title}</h1>
      {subtitle && (
        <p className="mt-3 max-w-2xl text-sm md:text-base text-text-muted">{subtitle}</p>
      )}
    </section>
  );
}
