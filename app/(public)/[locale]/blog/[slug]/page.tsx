
export default async function BlogPost({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  return (
    <article className="mx-auto max-w-3xl px-6 py-32">
      <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Journal</p>
      <h1 className="font-serif text-5xl mt-4">{slug}</h1>
      <p className="text-text-muted mt-8">Article body loads from Supabase in Phase 4.</p>
    </article>
  );
}
