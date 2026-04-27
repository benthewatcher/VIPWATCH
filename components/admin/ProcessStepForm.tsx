'use client';

import { Field, BilingualField } from './Field';

export type ProcessStepRow = {
  id?: string;
  number?: string | null;
  position?: number | null;
  status?: 'draft' | 'published' | 'archived' | null;
  title_en?: string | null;
  title_fr?: string | null;
  copy_en?: string | null;
  copy_fr?: string | null;
};

export function ProcessStepForm({
  row,
  action,
  submitLabel,
  onDelete,
}: {
  row: ProcessStepRow | null;
  action: (form: FormData) => void | Promise<void>;
  submitLabel: string;
  onDelete?: () => void | Promise<void>;
}) {
  return (
    <form action={action} className="grid gap-8 max-w-3xl">
      <div className="grid gap-6 md:grid-cols-3">
        <Field label="Number (display)" name="number" defaultValue={row?.number ?? ''} required placeholder="01" />
        <Field label="Position (sort)" name="position" type="number" defaultValue={row?.position ?? 0} />
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

      <BilingualField label="Title" field="title" row={row as Record<string, unknown> | null} required />
      <BilingualField label="Copy" field="copy" row={row as Record<string, unknown> | null} textarea rows={5} required />

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
              if (confirm('Delete this step?')) onDelete();
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
