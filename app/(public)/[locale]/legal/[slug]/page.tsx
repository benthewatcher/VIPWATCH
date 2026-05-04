
export default async function LegalPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  return (
    <article className="mx-auto max-w-3xl px-6 py-32">
      <h1 className="font-serif text-4xl">{slug}</h1>
      <p className="text-text-muted mt-8">Loaded from legal_pages in Phase 4.</p>
    </article>
  );
}
