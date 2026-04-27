'use client';

import { Field, BilingualField } from './Field';
import { ImageUpload } from './ImageUpload';

export type CommissionRow = {
  id?: string;
  slug?: string | null;
  client_initials?: string | null;
  watch_model?: string | null;
  year_started?: number | null;
  hero_image?: string | null;
  hero_video?: string | null;
  card_image?: string | null;
  position?: number | null;
  is_featured?: boolean | null;
  status?: 'draft' | 'published' | 'archived' | null;
  title_en?: string | null;
  title_fr?: string | null;
  summary_en?: string | null;
  summary_fr?: string | null;
  body_en?: string | null;
  body_fr?: string | null;
};

export function CommissionForm({
  row,
  action,
  submitLabel,
  onDelete,
}: {
  row: CommissionRow | null;
  action: (form: FormData) => void | Promise<void>;
  submitLabel: string;
  onDelete?: () => void | Promise<void>;
}) {
  const slug = row?.slug ?? '';
  return (
    <form action={action} className="grid gap-8 max-w-4xl">
      <div className="grid gap-6 md:grid-cols-3">
        <Field label="Slug" name="slug" defaultValue={slug} required placeholder="e.g. spider" />
        <Field label="Position" name="position" type="number" defaultValue={row?.position ?? 0} />
        <label className="block">
          <span className="text-xs uppercase tracking-[0.2em] text-text-muted">Status</span>
          <select
            name="status"
            defaultValue={row?.status ?? 'draft'}
            className="mt-2 w-full bg-bg-secondary border border-divider px-3 py-2 text-sm focus:border-accent focus:outline-none"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </label>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Field label="Client initials" name="client_initials" defaultValue={row?.client_initials ?? ''} placeholder="M. S.C.L." />
        <Field label="Watch model" name="watch_model" defaultValue={row?.watch_model ?? ''} placeholder="Daytona" />
        <Field label="Year started" name="year_started" type="number" defaultValue={row?.year_started ?? ''} placeholder="2024" />
      </div>

      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          name="is_featured"
          defaultChecked={!!row?.is_featured}
          className="accent-accent w-4 h-4"
        />
        <span>Feature on home page</span>
      </label>

      <div className="grid gap-6 md:grid-cols-2">
        <ImageUpload
          name="hero_image"
          defaultValue={row?.hero_image ?? ''}
          pathPrefix={slug ? `commissions/${slug}` : 'commissions/_new'}
          label="Hero image (detail page)"
        />
        <ImageUpload
          name="card_image"
          defaultValue={row?.card_image ?? ''}
          pathPrefix={slug ? `commissions/${slug}` : 'commissions/_new'}
          label="Card image (grid)"
        />
      </div>

      <Field label="Hero video URL (optional)" name="hero_video" defaultValue={row?.hero_video ?? ''} placeholder="https://… .mp4" />

      <BilingualField label="Title" field="title" row={row as Record<string, unknown> | null} required />
      <BilingualField label="Summary" field="summary" row={row as Record<string, unknown> | null} textarea rows={2} />
      <BilingualField label="Body / narrative" field="body" row={row as Record<string, unknown> | null} textarea rows={10} />

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
              if (confirm('Delete this commission and all its gallery images?')) onDelete();
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
