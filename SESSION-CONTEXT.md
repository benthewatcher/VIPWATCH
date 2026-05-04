# VIP WATCH — session context

Last updated: 2026-05-04 (mid-day, after a long Vercel battle)

## How to start a fresh Claude Code session

```bash
cd "/Users/benedict/Documents/Projects/VIP WATCH"
claude
```

Then paste this brief into your first message:

> Read `SESSION-CONTEXT.md` and `docs/COPY.md`. Don't try to fix Vercel
> deploys yet — that's a known Next 15 + Vercel platform issue we've parked.
> Right now I admin via local dev tunneled to the web. The immediate goal
> is finishing the admin so I can ingest commissions and images. Tell me
> what you'd do next given the pending list at the bottom of SESSION-CONTEXT.

## Project at a glance

VIP WATCH is a bilingual (Arabic primary, English secondary) PWA for a luxury
watch personalisation atelier in Riyadh — bespoke modification of clients' own
timepieces. **Separate project from WATCHOS.** Different repo, different
Supabase, different brand.

- **Path:** `/Users/benedict/Documents/Projects/VIP WATCH`
- **Asset folder (gitignored, large):** `/Users/benedict/Documents/Projects/VIP WATCH-assets/Watches`
- **Stack:** Next.js 15.5, TypeScript, Tailwind v4, Supabase (`edpidhthaunlmuktlkxl`), next-themes, Anthropic SDK (Opus 4.7), Resend (planned)
- **Repo:** https://github.com/benthewatcher/VIPWATCH (public)
- **Vercel:** https://vipwatch.vercel.app (broken — see "Vercel status" below)
- **Default locale:** `ar` (Arabic). `/` redirects to `/ar`.
- **Brand voice:** locked v1 in `docs/COPY.md`.

## Where the working admin lives

The Vercel deploy returns 404 sitewide despite a clean build. Until that's
diagnosed, the admin runs on your laptop:

| URL | Behaviour |
|---|---|
| `http://localhost:3002/admin/login` | Local dev (`npm run dev` on port 3002) |
| `https://interactive-quite-wax-medicines.trycloudflare.com/admin/login` | Cloudflared tunnel pointing at localhost:3002. **URL changes if cloudflared restarts.** |

Both write to the same production Supabase, so anything you ingest is real.

### Starting local dev

```bash
cd "/Users/benedict/Documents/Projects/VIP WATCH"
PORT=3002 npm run dev
```

In a second terminal, expose to the web (optional):

```bash
cloudflared tunnel --url http://localhost:3002
```

### Generating a magic link (bypasses email rate limits)

```bash
node scripts/gen-magic-link.mjs bw@minc.watch \
  http://localhost:3002/admin/auth/callback
```

Paste the printed URL into the browser. It writes the session cookies and
hard-redirects to `/admin`.

The Supabase Auth Redirect URLs allow-list must include the callback URL
you pass. https://supabase.com/dashboard/project/edpidhthaunlmuktlkxl/auth/url-configuration

## What's working

| Area | Status |
|---|---|
| Admin login (magic link via gen-magic-link.mjs) | ✅ |
| Admin dashboard, commissions list | ✅ |
| Commission create/edit form with auto-slug from EN title | ✅ |
| AR fields optional in form (Arabic comes later) | ✅ |
| AI **Generate copy** button (Claude Opus 4.7, brand voice cached) | ✅ |
| Multi-image gallery: pick files, pick folder, **drag-drop folder** | ✅ |
| Per-image position with up/down arrows + number input | ✅ |
| Hero/card image upload via Supabase Storage `media` bucket | ✅ |
| Storage RLS (`is_admin()` helper, profile seeded) | ✅ |
| Local dev pages: `/ar` etc | ❌ legacy `next-intl` server lookup still triggers in some path; not blocking the admin |

## What's not working

| Area | Status / Notes |
|---|---|
| **Vercel deploy** | Latest deploy `Ready` but every route 404s. Build registers all 38 routes cleanly. Direct deploy URL also 404s. Same for `/_next/static`. Likely a Vercel project-config mismatch I can't see from CLI. **Stop chasing this — open the Vercel dashboard manually next time and check Framework Preset, Root Directory, Build Output settings before more code changes.** |
| Public site `/ar`, `/en`, `/` (locally) | 500 — `useTranslations` from `next-intl` is referenced somewhere that still triggers config lookup. Migrated all pages and known components but something lingers. Not blocking admin. |
| AR translation in admin form | Optional and empty-string-defaulted at DB layer until migration relaxes NOT NULL on `_fr` columns. Auto-translate is Phase 2. |

## Today's pending list (in order of priority)

1. **Confirm commission save now works** — the `_fr` empty-string default just landed (`app/(admin)/admin/commissions/actions.ts`). Try creating a commission with EN title only.
2. **Test AI generate copy** — needs `ANTHROPIC_API_KEY` in `.env.local` (already copied from WATCHOS). Click "✨ Generate copy" on the edit page after filling EN title + watch model. Make sure dev server was restarted after the key was added.
3. **Test multi-image upload** — drag a folder from Finder onto the gallery dropzone (only on **edit page**, not /new). Try `/Users/benedict/Documents/Projects/VIP WATCH-assets/Watches/Rolex/Daytona`.
4. **Public site fix** — chase the remaining `useTranslations` server-side reference. Likely either:
   - A page component still imports next-intl indirectly via a transitive dep
   - The PageHeader / SectionIntro / CommissionCard / ServiceTile components still pull next-intl
5. **Vercel deploy diagnosis** — open the dashboard and check Framework Preset = Next.js, Root Directory empty, Build & Output Settings all default. If clean, file a Vercel support ticket.
6. **Drop NOT NULL on `_fr` columns** (migration) — replace the empty-string workaround with proper nullable columns. Do via Supabase SQL editor or new migration file `supabase/migrations/0007_fr_nullable.sql`.
7. **AR auto-translate** (Phase 2) — extend `lib/ai/generate-commission.ts` to accept "EN only" mode and produce AR via a separate translate pass when needed.
8. **Public site Arabic copy** — `messages/ar.json` is currently a copy of the old French file. Replace with real Arabic strings from `docs/COPY.md`.

## Key files / where things live

- `middleware.ts` — **deleted** (Vercel Edge __dirname crash). Auth gate is in admin layout server-side; locale redirect is `app/page.tsx`.
- `app/(admin)/admin/auth/callback/page.tsx` — client component, handles both `?code=` (PKCE) and `#access_token=` (legacy verify) flows; uses `window.location.href` hard-redirect.
- `app/(admin)/admin/commissions/{actions.ts,new/page.tsx,[id]/page.tsx}` — CRUD + gallery wiring.
- `components/admin/CommissionForm.tsx` — auto-slugify, AI generate button.
- `components/admin/CommissionGallery.tsx` — multi-file picker, folder picker, drag-drop folder, position controls.
- `components/admin/Field.tsx` — `BilingualField` renders EN required + AR (optional, dir="rtl").
- `lib/ai/voice.ts` — locked brand voice excerpt for prompt caching.
- `lib/ai/generate-commission.ts` — Anthropic SDK call (Opus 4.7, adaptive thinking, output_config json_schema).
- `lib/ai/commission-schema.ts` — Zod schema for AI output.
- `lib/i18n/{config,t,navigation,routing}.ts` — locale config + `getT(locale, ns)` helper. `navigation.ts` and `routing.ts` still reference next-intl (only `defineRouting` and `createNavigation`); not imported by any page anymore.
- `messages/{en,ar}.json` — UI strings. ar.json is a placeholder, copy from `docs/COPY.md`.
- `docs/COPY.md` — locked v1 site copy in EN + AR homepage. Source of truth.
- `scripts/gen-magic-link.mjs` — admin-API magic link generator (no email).
- `scripts/seed-profile.mjs` — seeds the `profiles` row required by `is_admin()`.
- `scripts/check-storage.mjs` / `scripts/fix-media-bucket.mjs` — storage diagnostics.
- `supabase/migrations/0001…0006…sql` — all applied. Need 0007 to drop NOT NULL on `_fr`.

## Branch state

- `main` — what Vercel auto-deploys from. Latest: title_fr empty-string workaround.
- `deploy-refactor` — earlier WIP from when we tried dropping next-intl entirely. Largely superseded by main now. Can probably delete.

## Things deliberately deferred

- AR translation pass (Phase 2)
- WYSIWYG editor for body
- Drag-reorder for services / process / gallery (use position int input)
- Real enquiry / newsletter form submission (Resend)
- Resend domain DKIM
- Sentry, Plausible
- PWA service worker via @serwist/next (manifest exists)
- `supabase gen types typescript` to replace hand-rolled types
- Custom domain
- Vercel Production environment variables sync (currently 5 set; ANTHROPIC_API_KEY is local-only — must be added to Vercel before AI works in prod)

## Known traps for next session

1. **Magic-link email rate limit (~3-4/hour).** Don't click "Send magic link" in the form — use `node scripts/gen-magic-link.mjs` which calls the admin API and bypasses the limit.
2. **Magic-link redirect_to is overridden.** If `http://localhost:3002/admin/auth/callback` isn't in Supabase's Redirect URLs allow-list, Supabase silently replaces it with the Site URL (currently `vipwatch.vercel.app`, which is broken). Always check the URL the script prints — manually edit `redirect_to=` if needed.
3. **Hard-redirect in callback, not router.replace.** Soft Next nav left the page stuck on "Signing you in…" because the dashboard's RSC fetch was slow; `window.location.href` forces a fresh server round-trip with the new cookies.
4. **AR is non-mandatory for now.** Form labels say "(optional)". Server defaults `_fr` columns to empty string '' to dodge NOT NULL until migration 0007.
5. **Don't add middleware.ts back.** Every variant we tried — Edge default, Node runtime, ESM, hand-rolled — produced either `__dirname is not defined` or routing 404s on Vercel. The locale redirect is in `app/page.tsx` (root-only); admin doesn't need a middleware gate because RLS protects all data.
6. **`title_fr`/`summary_fr`/`body_fr` are NOT NULL in DB.** Until migration 0007 lands, the parse function defaults missing AR fields to `''` (empty string). Any new schema changes that touch these columns should keep that in mind.
7. **Watches/ folder is gitignored.** All 982MB of source images live at `../VIP WATCH-assets/Watches`, NOT in the repo. Drop into the admin via the gallery dropzone, not git.
