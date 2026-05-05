'use client';

import { useEffect, useRef, useState } from 'react';
import { Field } from './Field';
import { ImageUpload } from './ImageUpload';

function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

export type DepartmentRow = {
  id?: string;
  slug?: string | null;
  title_en?: string | null;
  title_fr?: string | null;
  body_en?: string | null;
  body_fr?: string | null;
  image?: string | null;
  link_url?: string | null;
  link_label_en?: string | null;
  link_label_fr?: string | null;
  position?: number | null;
  is_visible?: boolean | null;
};

export function DepartmentForm({
  row,
  action,
  submitLabel,
  onDelete,
}: {
  row: DepartmentRow | null;
  action: (form: FormData) => void | Promise<void>;
  submitLabel: string;
  onDelete?: () => void | Promise<void>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const initialSlug = row?.slug ?? '';
  const [slug, setSlug] = useState(initialSlug);
  const [slugDirty, setSlugDirty] = useState(!!initialSlug);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const titleEn = form.elements.namedItem('title_en') as HTMLInputElement | null;
    if (!titleEn) return;
    function onInput() {
      if (slugDirty) return;
      setSlug(slugify(titleEn!.value));
    }
    titleEn.addEventListener('input', onInput);
    return () => titleEn.removeEventListener('input', onInput);
  }, [slugDirty]);

  return (
    <form ref={formRef} action={action} className="grid gap-8 max-w-4xl">
      <div className="grid gap-6 md:grid-cols-3">
        <label className="block">
          <span className="text-xs uppercase tracking-[0.2em] text-text-muted">
            Slug{!slugDirty && <span className="ml-2 text-text-muted/60 normal-case tracking-normal">(auto)</span>}
          </span>
          <input
            name="slug"
            value={slug}
            onChange={(e) => {
              setSlug(slugify(e.target.value));
              setSlugDirty(true);
            }}
            placeholder="e.g. case-modification"
            className="mt-2 w-full bg-bg-secondary border border-divider px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
        </label>
        <Field label="Position" name="position" type="number" defaultValue={row?.position ?? 0} />
        <label className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-text-muted self-end">
          <input type="checkbox" name="is_visible" defaultChecked={row?.is_visible ?? true} />
          Visible on home
        </label>
      </div>

      <div>
        <ImageUpload
          name="image"
          defaultValue={row?.image ?? undefined}
          pathPrefix={`departments/${row?.slug ?? 'new'}`}
          label="Image"
          hint="1600×1280 px · 5:4 landscape · full-bleed tile"
        />
      </div>

      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Title</p>
        <div className="mt-2 grid gap-3 md:grid-cols-2">
          <Field label="EN" name="title_en" defaultValue={row?.title_en ?? ''} required />
          <Field label="AR (optional)" name="title_fr" defaultValue={row?.title_fr ?? ''} dir="rtl" />
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Body</p>
        <div className="mt-2 grid gap-3 md:grid-cols-2">
          <Field label="EN" name="body_en" defaultValue={row?.body_en ?? ''} textarea rows={3} />
          <Field label="AR (optional)" name="body_fr" defaultValue={row?.body_fr ?? ''} textarea rows={3} dir="rtl" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Field label="Link URL (optional)" name="link_url" defaultValue={row?.link_url ?? ''} placeholder="/services/case-modification" />
        <Field label="Link label EN" name="link_label_en" defaultValue={row?.link_label_en ?? ''} placeholder="Explore" />
        <Field label="Link label AR" name="link_label_fr" defaultValue={row?.link_label_fr ?? ''} dir="rtl" />
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
              if (confirm('Delete this department?')) onDelete();
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
