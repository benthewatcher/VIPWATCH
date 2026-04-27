export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24 md:py-32 lg:py-40">
      <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl tracking-tight">{title}</h1>
      {subtitle && (
        <p className="mt-6 max-w-2xl text-lg text-text-muted">{subtitle}</p>
      )}
    </section>
  );
}
