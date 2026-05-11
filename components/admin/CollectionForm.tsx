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

export type CollectionRow = {
  id?: string;
  slug?: string | null;
  name_en?: string | null;
  name_fr?: string | null;
  project_en?: string | null;
  project_fr?: string | null;
  description_en?: string | null;
  description_fr?: string | null;
  cover_image?: string | null;
  hero_video?: string | null;
  is_private?: boolean | null;
  is_featured?: boolean | null;
  position?: number | null;
  lookbook_position?: number | null;
};

export function CollectionForm({
  row,
  action,
  submitLabel,
  onDelete,
}: {
  row: CollectionRow | null;
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
    const nameEn = form.elements.namedItem('name_en') as HTMLInputElement | null;
    if (!nameEn) return;
    function onInput() {
      if (slugDirty) return;
      setSlug(slugify(nameEn!.value));
    }
    nameEn.addEventListener('input', onInput);
    return () => nameEn.removeEventListener('input', onInput);
  }, [slugDirty]);

  return (
    <form ref={formRef} action={action} className="grid gap-8 max-w-4xl">
      <div className="grid gap-6 md:grid-cols-3">
        <label className="block">
          <span className="text-xs uppercase tracking-[0.2em] text-text-muted">
            Slug{!slugDirty && <span className="ml-2 text-text-muted/60 normal-case tracking-normal">(auto from name)</span>}
          </span>
          <input
            name="slug"
            value={slug}
            onChange={(e) => {
              setSlug(slugify(e.target.value));
              setSlugDirty(true);
            }}
            placeholder="e.g. pink-editions"
            className="mt-2 w-full bg-bg-secondary border border-divider px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
        </label>
        <Field label="Position" name="position" type="number" defaultValue={row?.position ?? 0} />
        <Field
          label="Lookbook order"
          name="lookbook_position"
          type="number"
          defaultValue={row?.lookbook_position ?? 0}
        />
        <div className="flex items-end gap-6">
          <label className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-text-muted">
            <input type="checkbox" name="is_private" defaultChecked={!!row?.is_private} />
            Private
          </label>
          <label className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-text-muted">
            <input type="checkbox" name="is_featured" defaultChecked={!!row?.is_featured} />
            Featured on home
          </label>
          <label className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-text-muted">
            Theme
            <select
              name="theme"
              defaultValue={(row as { theme?: string } | null)?.theme ?? 'system'}
              className="bg-bg-secondary border border-divider px-2 py-1 text-xs normal-case tracking-normal"
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ImageUpload
          name="cover_image"
          defaultValue={row?.cover_image ?? undefined}
          pathPrefix={`collections/${row?.slug ?? 'new'}`}
          label="Cover image (optional)"
          hint="900×1200 px · 3:4 portrait · used on collection cards and detail hero"
        />
        <ImageUpload
          name="hero_video"
          defaultValue={row?.hero_video ?? undefined}
          pathPrefix={`collections/${row?.slug ?? 'new'}/video`}
          label="Lookbook video (optional)"
          hint="MP4 · 16:9 or 9:16 · muted loop · background for the /lookbook section"
        />
      </div>

      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Name</p>
        <div className="mt-2 grid gap-3 md:grid-cols-2">
          <Field label="EN" name="name_en" defaultValue={row?.name_en ?? ''} required />
          <Field label="AR (optional)" name="name_fr" defaultValue={row?.name_fr ?? ''} dir="rtl" />
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-text-muted">
          Project <span className="ml-2 text-text-muted/60 normal-case tracking-normal">(short tag, e.g. &ldquo;Series&rdquo; or &ldquo;Sapphire&rdquo;)</span>
        </p>
        <div className="mt-2 grid gap-3 md:grid-cols-2">
          <Field label="EN" name="project_en" defaultValue={row?.project_en ?? ''} placeholder="e.g. Series" />
          <Field label="AR (optional)" name="project_fr" defaultValue={row?.project_fr ?? ''} dir="rtl" />
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Description (optional)</p>
        <div className="mt-2 grid gap-3 md:grid-cols-2">
          <Field label="EN" name="description_en" defaultValue={row?.description_en ?? ''} textarea rows={3} />
          <Field label="AR (optional)" name="description_fr" defaultValue={row?.description_fr ?? ''} textarea rows={3} dir="rtl" />
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
              if (confirm('Delete this collection? Commissions are not deleted.')) onDelete();
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
