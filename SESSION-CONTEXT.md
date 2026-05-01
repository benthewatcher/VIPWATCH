# VIP WATCH — session context

Last updated: 2026-05-01

## Project at a glance

VIP WATCH is a bilingual (EN default, FR) PWA for a luxury watch personalisation atelier — bespoke modification of clients' own timepieces. **Separate project from WATCHOS.** Different repo, different Supabase, different brand.

- **Path:** `/Users/benedict/Documents/Projects/VIP WATCH`
- **Stack:** Next.js 16 (App Router), TypeScript, Tailwind v4, Supabase (`edpidhthaunlmuktlkxl`), next-intl, next-themes, Resend (planned), Framer Motion (`motion` package)
- **Repo:** https://github.com/benthewatcher/VIPWATCH (public)
- **Vercel:** https://vipwatch.vercel.app (team `ben-s-projects-fc91948e`, project `vipwatch`)
- **Default locale:** EN. Root `/` redirects to `/en`. FR strings complete.

## Status snapshot

| Phase | What | Status |
|---|---|---|
| 0 | Scaffold + deps + shadcn | ✅ |
| 1 | Schema + RLS + types | ✅ (migrations 0001–0006 all applied) |
| 2 | Design system + light/dark theme | ✅ |
| 3 | Public pages (services, process, FAQ, contact, etc) | ✅ |
| 4 | Wire pages to Supabase (services, process, commissions, home) | ✅ |
| 5 | Forms + Resend emails | ❌ enquiry/newsletter forms are stubs (no real submit yet) |
| 6 | Admin auth (magic link, proxy gate) | ✅ |
| 7 | Admin CRUD: services, commissions (+gallery), process, pages | ✅ |
| 8 | PWA (manifest done, no serwist SW yet) | partial |
| 9 | SEO sitemap/robots/Sentry | ❌ |
| 10 | Live on Vercel | 🟡 in progress (deploy lyst1bj15 building when laptop restarted) |

## Last commit

```
a1707d7 fix(middleware): use relative imports so Vercel Edge can bundle
```

Two fix commits chained:
1. `1798b85` — renamed `proxy.ts` → `middleware.ts` (Next 16 deprecates middleware.ts in favour of proxy.ts, but Vercel Edge routing only invokes the file when named middleware.ts)
2. `a1707d7` — switched middleware imports from `@/...` to `./...` (Edge bundler doesn't resolve the path alias)

## What's pending (when you resume)

### 1. Verify the live deploy
```bash
cd "/Users/benedict/Documents/Projects/VIP WATCH"
vercel ls vipwatch | head -5
curl -s -o /dev/null -w "%{http_code}\n" https://vipwatch.vercel.app/en
```
Expect `200` if the `a1707d7` deploy succeeded. If still 404 or Error, pull logs:
```bash
vercel inspect <latest-url> --logs | tail -30
```

### 2. Configure Supabase Auth for production
https://supabase.com/dashboard/project/edpidhthaunlmuktlkxl/auth/url-configuration

- Site URL: `https://vipwatch.vercel.app`
- Redirect URLs: add `https://vipwatch.vercel.app/admin/auth/callback`

Without this, magic-link sign-in fails on the live site.

### 3. First admin sign-in + seed profile
1. Visit https://vipwatch.vercel.app/admin/login
2. Enter `bw@minc.watch`, click magic link in email
3. You'll land at `/admin/login?error=not_authorised` — expected
4. Run in Supabase SQL editor:
```sql
insert into profiles (id, email, full_name, role)
values (
  (select id from auth.users where email = 'bw@minc.watch'),
  'bw@minc.watch', 'Ben', 'owner'
);
```
5. Sign in again — lands on dashboard

### 4. Local dev (when needed)
```bash
cd "/Users/benedict/Documents/Projects/VIP WATCH"
PORT=3002 npm run dev
# → http://localhost:3002
```

## Key files / where things live

- `middleware.ts` — locale routing + admin auth gate (uses relative imports!)
- `lib/i18n/{config,routing,request,pick}.ts` — next-intl setup
- `lib/supabase/{client,server,admin,anon,middleware,types}.ts` — Supabase clients (admin = service role; anon = build-time SSG; types = hand-rolled until `supabase gen types` runs)
- `app/(public)/[locale]/...` — public pages
- `app/(admin)/admin/...` — admin pages, all gated by middleware + `is_admin()` SQL helper
- `components/site/...` — public components (Nav, Footer, Hero, FadeUp, ThemeToggle, ThemeProvider, etc)
- `components/admin/...` — admin components (Field, BilingualField, ImageUpload, ServiceForm, CommissionForm, CommissionGallery, ProcessStepForm)
- `supabase/migrations/0001_init.sql … 0006_process_steps.sql` — all applied
- `messages/{en,fr}.json` — UI strings
- `app/globals.css` — light/dark theme tokens (CSS vars swap on `.dark` class)

## Env vars

Locally in `.env.local` (gitignored). On Vercel production: 5 set (URL, anon, service_role, FROM_EMAIL, SITE_URL). `RESEND_API_KEY` not yet set — needed when implementing real form submissions.

## Things deliberately deferred

- WYSIWYG editor (currently plain textarea, line breaks render via `whitespace-pre-line`)
- Drag-reorder for services / process / gallery (edit `position` int manually)
- Real enquiry form submission (server action + Resend) — UI is stub
- Newsletter form submission — same
- Resend domain DKIM setup
- Sentry, Plausible analytics
- PWA service worker via `@serwist/next` (manifest exists, no offline cache yet)
- `supabase gen types typescript --project-id edpidhthaunlmuktlkxl` to replace hand-rolled types
- Custom domain (currently on `vipwatch.vercel.app`)

## Known traps for next session

1. **Don't import `@/` in `middleware.ts`** — Vercel Edge can't resolve. Use `./` relative paths.
2. **Don't use `cookies()` in `generateStaticParams`** — runs at build time, no request. Use `createAnonClient()` from `lib/supabase/anon.ts` instead.
3. **The `proxy.ts` filename** is the Next 16 way but breaks Vercel routing. Stay with `middleware.ts`.
4. **Wrong directory trap:** Bash session may start in WATCHOS worktree. Always `cd "/Users/benedict/Documents/Projects/VIP WATCH"` first.
