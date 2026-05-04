'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { Field, BilingualField } from './Field';
import { ImageUpload } from './ImageUpload';
import { generateCommissionCopy } from '@/lib/ai/generate-commission';
import { Sparkles } from 'lucide-react';

/** URL-safe slug: lowercase, dashes for whitespace, strip everything else. */
function slugify(input: string): string {
  return input
    .normalize('NFKD')                    // strip accents (é → e)
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')          // any non-alphanumeric → dash
    .replace(/^-+|-+$/g, '')              // trim leading/trailing dashes
    .replace(/-+/g, '-');                 // collapse multi-dashes
}

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
  const initialSlug = row?.slug ?? '';
  const formRef = useRef<HTMLFormElement>(null);
  const [generating, startGenerate] = useTransition();
  const [genError, setGenError] = useState<string | null>(null);

  // Slug auto-sync: derive from EN title until the user types in the slug field.
  const [slug, setSlug] = useState(initialSlug);
  const [slugDirty, setSlugDirty] = useState(!!initialSlug);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const titleEn = form.elements.namedItem('title_en') as HTMLInputElement | null;
    if (!titleEn) return;
    function onTitleInput() {
      if (slugDirty) return;
      setSlug(slugify(titleEn!.value));
    }
    titleEn.addEventListener('input', onTitleInput);
    return () => titleEn.removeEventListener('input', onTitleInput);
  }, [slugDirty]);

  function handleGenerate(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    setGenError(null);
    const form = formRef.current;
    if (!form) return;

    const data = new FormData(form);
    const ctx = {
      title_en: (data.get('title_en') as string) || undefined,
      watch_model: (data.get('watch_model') as string) || undefined,
      client_initials: (data.get('client_initials') as string) || undefined,
    };

    if (!ctx.title_en && !ctx.watch_model && !ctx.client_initials) {
      setGenError('Fill in at least the title, watch model, or client initials first.');
      return;
    }

    startGenerate(async () => {
      try {
        const copy = await generateCommissionCopy(ctx);
        const set = (name: string, value: string) => {
          const el = form.elements.namedItem(name) as
            | HTMLInputElement
            | HTMLTextAreaElement
            | null;
          if (el) {
            el.value = value;
            // Notify React listeners (defensive — fields are uncontrolled)
            el.dispatchEvent(new Event('input', { bubbles: true }));
          }
        };
        set('summary_en', copy.summary_en);
        set('summary_fr', copy.summary_ar);
        set('body_en', copy.body_en);
        set('body_fr', copy.body_ar);
      } catch (err) {
        setGenError(
          err instanceof Error ? err.message : 'Generation failed. Try again.',
        );
      }
    });
  }

  return (
    <form ref={formRef} action={action} className="grid gap-8 max-w-4xl">
      <div className="grid gap-6 md:grid-cols-3">
        <label className="block">
          <span className="text-xs uppercase tracking-[0.2em] text-text-muted">
            Slug{!slugDirty && <span className="ml-2 text-text-muted/60 normal-case tracking-normal">(auto from title)</span>}
          </span>
          <input
            name="slug"
            value={slug}
            onChange={(e) => {
              setSlug(slugify(e.target.value));
              setSlugDirty(true);
            }}
            required
            placeholder="e.g. sapphire-daytona-box"
            pattern="[a-z0-9-]+"
            className="mt-2 w-full bg-bg-secondary border border-divider px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
        </label>
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

      {/* AI generate panel — sits between Title and Summary */}
      <div className="border border-divider bg-bg-secondary/40 px-4 py-3 flex items-center justify-between gap-4">
        <div className="text-xs text-text-muted">
          Fill title + watch model first, then let Claude draft summary + body in EN and AR.
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2 border border-accent px-4 py-2 text-xs uppercase tracking-[0.2em] text-accent hover:bg-accent hover:text-bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          <Sparkles size={14} />
          {generating ? 'Generating…' : 'Generate copy'}
        </button>
      </div>
      {genError && <p className="text-xs text-red-400 -mt-4">{genError}</p>}

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
