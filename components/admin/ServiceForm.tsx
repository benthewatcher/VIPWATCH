'use client';

import { Field, BilingualField } from './Field';
import { ImageUpload } from './ImageUpload';

export type ServiceRow = {
  id?: string;
  slug?: string | null;
  icon_name?: string | null;
  hero_image?: string | null;
  position?: number | null;
  status?: 'draft' | 'published' | 'archived' | null;
  title_en?: string | null;
  title_fr?: string | null;
  summary_en?: string | null;
  summary_fr?: string | null;
  body_en?: string | null;
  body_fr?: string | null;
};

export function ServiceForm({
  row,
  action,
  submitLabel,
  onDelete,
}: {
  row: ServiceRow | null;
  action: (form: FormData) => void | Promise<void>;
  submitLabel: string;
  onDelete?: () => void | Promise<void>;
}) {
  const slug = row?.slug ?? '';
  return (
    <form action={action} className="grid gap-8 max-w-4xl">
      <div className="grid gap-6 md:grid-cols-3">
        <Field label="Slug" name="slug" defaultValue={slug} required placeholder="e.g. engraving" />
        <Field label="Position" name="position" type="number" defaultValue={row?.position ?? 0} />
        <label className="block">
          <span className="text-xs uppercase tracking-[0.2em] text-text-muted">Status</span>
          <select
            name="status"
            defaultValue={row?.status ?? 'published'}
            className="mt-2 w-full bg-bg-secondary border border-divider px-3 py-2 text-sm focus:border-accent focus:outline-none"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </label>
      </div>

      <Field
        label="Lucide icon name (e.g. PenTool, Sparkles, Layers, Gem, CircleDot, Hand, Wrench)"
        name="icon_name"
        defaultValue={row?.icon_name ?? ''}
      />

      <ImageUpload
        name="hero_image"
        defaultValue={row?.hero_image ?? ''}
        pathPrefix={slug ? `services/${slug}` : 'services/_new'}
        label="Hero image"
      />

      <BilingualField label="Title" field="title" row={row as Record<string, unknown> | null} required />
      <BilingualField label="Summary" field="summary" row={row as Record<string, unknown> | null} textarea rows={2} />
      <BilingualField label="Body" field="body" row={row as Record<string, unknown> | null} textarea rows={8} />

      <div className="flex items-center gap-3 pt-4 border-t border-divider">
        <button
          type="submit"
          className="border border-accent px-8 py-3 text-xs uppercase tracking-[0.25em] text-accent hover:bg-accent hover:text-bg-primary transition-colors"
        >
          {submitLabel}
        </button>
        {onDelete && (
          <button
            type="button"
            onClick={() => {
              if (confirm('Delete this service? This cannot be undone.')) onDelete();
            }}
            className="px-6 py-3 text-xs uppercase tracking-[0.25em] text-red-400 hover:text-red-300 ml-auto"
          >
            Delete
          </button>
        )}
      </div>
    </form>
  );
}
