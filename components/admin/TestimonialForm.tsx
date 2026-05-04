'use client';

import { Field } from './Field';
import { ImageUpload } from './ImageUpload';

export type TestimonialRow = {
  id?: string;
  client_name?: string | null;
  client_role?: string | null;
  photo_url?: string | null;
  backdrop_image?: string | null;
  quote_en?: string | null;
  quote_fr?: string | null;
  position?: number | null;
  is_featured?: boolean | null;
};

export function TestimonialForm({
  row,
  action,
  submitLabel,
  onDelete,
}: {
  row: TestimonialRow | null;
  action: (form: FormData) => void | Promise<void>;
  submitLabel: string;
  onDelete?: () => void | Promise<void>;
}) {
  return (
    <form action={action} className="grid gap-8 max-w-4xl">
      <div className="grid gap-6 md:grid-cols-3">
        <Field label="Client name" name="client_name" defaultValue={row?.client_name ?? ''} required placeholder="O.A.M." />
        <Field label="Role / location (optional)" name="client_role" defaultValue={row?.client_role ?? ''} placeholder="Riyadh" />
        <Field label="Position" name="position" type="number" defaultValue={row?.position ?? 0} />
      </div>

      <label className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-text-muted">
        <input type="checkbox" name="is_featured" defaultChecked={row?.is_featured ?? true} />
        Show on home
      </label>

      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-text-muted">
          Backdrop image <span className="ml-2 text-text-muted/60 normal-case tracking-normal">(the watch — shown faded behind the quote)</span>
        </p>
        <ImageUpload
          name="backdrop_image"
          defaultValue={row?.backdrop_image ?? undefined}
          pathPrefix={`testimonials/${row?.id ?? 'new'}`}
        />
      </div>

      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Client photo (optional)</p>
        <ImageUpload
          name="photo_url"
          defaultValue={row?.photo_url ?? undefined}
          pathPrefix={`testimonials/${row?.id ?? 'new'}/photo`}
        />
      </div>

      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Quote</p>
        <div className="mt-2 grid gap-3 md:grid-cols-2">
          <Field label="EN" name="quote_en" defaultValue={row?.quote_en ?? ''} textarea rows={4} required />
          <Field label="AR (optional)" name="quote_fr" defaultValue={row?.quote_fr ?? ''} textarea rows={4} dir="rtl" />
        </div>
      </div>

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
              if (confirm('Delete this testimonial?')) onDelete();
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
