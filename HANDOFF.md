# VIP WATCH — handoff

A bespoke watch atelier site (Next.js 15.5, App Router, Supabase, Tailwind v4).
Domain: **forvip.watch**. Vercel project: `vipwatch.vercel.app`. Supabase project ID: `edpidhthaunlmuktlkxl`.

Read this top-to-bottom before touching anything. It's tuned for someone arriving cold.

---

## 1. Run it locally

```bash
git clone <repo>
cd "VIP WATCH"
cp .env.local.example .env.local
# fill in real values (see "Env vars" below)
npm install
npm run dev
```

If anything looks weird after editing a lot of files:

```bash
rm -rf .next && npm run dev
```

Always do that after middleware changes or auth-cookie changes — Webpack's persistent cache otherwise serves stale chunks.

---

## 2. Architecture in one diagram

```
public visitor
    │
    ▼  middleware.ts gates everything except /i/*, /admin/*, /waitlist, /api/*, /_next/*
    │  - / → /en
    │  - /ar/* → /en/*
    │  - no vipw_session cookie? → /waitlist
    │
    ├──► /i/<token>  → app/i/[token]/route.ts validates invite, sets signed cookie, → /en
    │
    ├──► /en/...     → app/(public)/[locale]/* pages
    │
    ├──► /waitlist   → app/waitlist/page.tsx (the only public-public page)
    │
    └──► /admin/*    → app/(admin)/admin/* (Supabase Auth magic-link gated)
                       Sign in at /admin/login. Uses Resend SMTP (custom SMTP in Supabase Auth).
                       Bypass for testing: node scripts/gen-magic-link.mjs <email> <redirect_url>

data:
  Supabase (Postgres + Storage + Auth). Project edpidhthaunlmuktlkxl.
  All migrations in supabase/migrations/*.sql.
  Schema-only run-everything file: supabase/data/run_me.sql (idempotent; paste-and-run).

attribution & invites:
  invites + invite_uses tables (signed cookie session, no Supabase Auth on public side).
  Admin manages at /admin/invites.

mail:
  Contact form: components/site/ContactView.tsx + app/(public)/[locale]/contact/actions.ts.
  Sends via Resend to bespoke@forvip.watch + bw@minc.watch, auto-confirms enquirer.
  Also writes to enquiries table.

analytics:
  GA4 inlined in app/layout.tsx (head). Set NEXT_PUBLIC_GA_ID in Vercel env.
```

---

## 3. Env vars

Mirror these in both `.env.local` and Vercel → Project Settings → Environment Variables.

| Var | Where | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | both | `https://edpidhthaunlmuktlkxl.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | both | from Supabase Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | both | secret. Used by `/i/<token>` route + scripts. |
| `NEXT_PUBLIC_SITE_URL` | both | `https://forvip.watch` in prod, `http://localhost:3000` locally |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | both | `447521808964` (no `+`) |
| `NEXT_PUBLIC_GA_ID` | both | `G-18KKNC3F3V`. Leave blank locally if you don't want dev hits polluting GA. |
| `INVITE_SESSION_SECRET` | both | 64-char random hex. Generate with `openssl rand -hex 32`. Signs the invite session cookie. **Must be set in Production** — fallback in code is only for dev. |
| `RESEND_API_KEY` | both | secret. Used by contact form. |
| `RESEND_FROM_EMAIL` | both | e.g. `VIP WATCH <bespoke@forvip.watch>` — must use a Resend-verified domain. |
| `ANTHROPIC_API_KEY` | both | for admin's "AI generate copy" buttons on commissions. |

---

## 4. Database

All schema lives in `supabase/migrations/*.sql`. The most useful migrations to know:

- `0001_init.sql` — core tables (commissions, brands, pages, settings, etc.)
- `0010_commission_collections.sql` — collections + pivot
- `0015_lookbook.sql` — `hero_video`, `lookbook_position`, `user_wishlist`
- `0016_collection_cover_mobile.sql` — `cover_image_mobile` on collections
- `0017_collage_tiles.sql` — saved layout for /collage
- `0018_commission_spec.sql` — `base_watch`, `services_performed`, `timeline` on commissions
- `0019_contact_success.sql` — `success_title_en/fr`, `success_body_en/fr` on `pages`
- `0020_invites.sql` — invite-only access tables (this session)

**Single-paste catch-up file**: `supabase/data/run_me.sql`.
Open the Supabase SQL Editor for the project, paste the entire file, click Run. Idempotent — safe to re-run after any schema change. Also seeds the canonical 6 process steps and the CTA strip copy.

**Image storage**: Supabase Storage bucket `media`. Public bucket, RLS allows admin upload. Public URL pattern: `${SUPABASE_URL}/storage/v1/object/public/media/<path>`.

**Image transformations**: `lib/utils/storage.ts` exposes `publicMediaUrl()`, `transformedMediaUrl()`, `mobileCoverUrl()`. The transformed variants use Supabase's image-transformation endpoint (`/storage/v1/render/image/...`) — requires the **Image Transformations** add-on on Pro plan, otherwise it falls back to the original.

---

## 5. Public routes

| Path | Purpose |
|---|---|
| `/` | redirects to `/en` |
| `/ar/*` | redirects to `/en/*` (we hard-forced English) |
| `/waitlist` | only public-public page; shown when no valid invite cookie |
| `/i/<token>` | tap-link sign-in (validates invite, sets cookie, → /en) |
| `/en` | home — hero carousel of collections + featured commissions |
| `/en/commissions` | grid of all commissions |
| `/en/commissions/<slug>` | commission detail page |
| `/en/collections` | grid of collections (currently not in nav) |
| `/en/collections/<slug>` | collection detail |
| `/en/lookbook` | scroll-through carousel of collection videos |
| `/en/collage` | the colour-sorted Spectrum wall |
| `/en/wishlist` | localStorage-backed wishlist (loaded client-side) |
| `/en/atelier` | static editorial page (DB-backed via `pages.atelier`) |
| `/en/arts-and-crafts` | same pattern (`pages.arts-and-crafts`) |
| `/en/warranty` | same pattern (`pages.warranty`) |
| `/en/process` | DB-driven 6-step process |
| `/en/contact` | enquiry form |

All routes except `/waitlist` and `/i/*` are gated by the invite session cookie. The "Begin a commission" CTA appears at the foot of every public page (mounted in the locale layout).

---

## 6. Admin routes

Magic-link sign-in at `/admin/login`. The active admin is `bw@minc.watch` (in the `profiles` table). Once signed in, the sidebar shows everything.

Each admin section maps to a table or a curated subset:

| Sidebar | Path | Notes |
|---|---|---|
| Dashboard | `/admin` | counts only |
| Home page | `/admin/home` | atelier-intro, process-teaser, cta-strip home_blocks; previews collection hero carousel |
| Commissions | `/admin/commissions` | drag to reorder, AI-generate copy, body blocks, gallery, related, services picker |
| Collections | `/admin/collections` | cover + mobile + lookbook video, lookbook_position, pivot manager |
| Collage | `/admin/collage` | drag-reorder tiles, "Auto-sort by colour" button |
| Departments | `/admin/departments` | currently hidden on home page (false-gated) |
| Services | `/admin/services` | hidden on home page (false-gated) |
| Process | `/admin/process` | 6 steps editable |
| Pages | `/admin/pages` | static pages: home / atelier / arts-and-crafts / warranty / process-intro / contact |
| Testimonials | `/admin/testimonials` | |
| Blog | `/admin/blog` | |
| FAQ | `/admin/faq` | |
| Enquiries | `/admin/enquiries` | read-only list from `enquiries` |
| Newsletter | `/admin/newsletter` | read-only list of subscribers |
| **Invites** | `/admin/invites` | **NEW — create / list / revoke tap-links** |
| Legal | `/admin/legal` | placeholder |
| Media | `/admin/media` | bucket browser + uploader |
| Team | `/admin/team` | profiles table view |
| Settings | `/admin/settings` | placeholder |

Sidebar also has "Hidden from public nav" preview links to Services / Arts & Crafts / Journal (those routes still resolve, just not linked from top nav).

---

## 7. Auth flows

### Public visitors → invite cookie

1. Visit `/en/anything` → middleware redirects to `/waitlist`.
2. Admin creates an invite in `/admin/invites` → gets `/i/ABCD-EFGH-IJKL`.
3. Admin shares that URL however (WhatsApp, iMessage, email).
4. Recipient taps → `app/i/[token]/route.ts` validates → signs cookie → `/en`.
5. Cookie lasts **60 days inactivity**. Persists in their browser.

**Cookie**: `vipw_session`, signed with `INVITE_SESSION_SECRET` (HMAC-SHA256, Web Crypto). Format `<base64url(payload)>.<hex(sig)>` where payload is `{iid, iat, exp}`. Validation in `lib/auth/invite-session.ts`.

Edge cases handled in `/i/[token]`: invalid token, revoked, expired, max-uses reached. Each redirects to `/waitlist?reason=<x>`.

**To unblock yourself locally**: `node scripts/gen-magic-link.mjs bw@minc.watch http://localhost:3000/admin/auth/callback` — that uses the service-role key to mint an admin magic link without going through email. For the public side, you can also bypass the gate by signing in via /admin then going to /admin/invites, generate yourself an invite, copy the URL, open it.

### Admin → Supabase magic link

1. `/admin/login` → enter email.
2. Supabase Auth sends magic link via custom SMTP (Resend). If Resend domain isn't verified, you'll get 500 — use `node scripts/gen-magic-link.mjs` as the bypass.
3. Click link → `/admin/auth/callback` exchanges code → cookie session → `/admin`.

**Supabase URL Configuration must include**:
- Site URL: `https://forvip.watch`
- Redirect URLs: `https://forvip.watch/admin/auth/callback`, `https://forvip.watch/en/auth/callback`, plus localhost equivalents during dev.

### SMS re-auth (deferred — not built yet)

Designed but not implemented. Once you have a Twilio account (Account SID, Auth Token, Messaging Service SID):
- Wire Supabase Auth → Phone Provider → Twilio.
- Add `/signin` page that takes a phone, sends OTP, on success sets a fresh `vipw_session` cookie tied to whichever active invite has matching `phone`.
- This lets users re-enter the site if they clear cookies or get a new device, **without** the admin issuing a fresh invite.

---

## 8. Contact form / enquiries

- `app/(public)/[locale]/contact/page.tsx` is a thin server wrapper.
- `components/site/ContactView.tsx` is the client form. After submit it replaces the entire header + form with a success block (copy editable in `/admin/pages/contact` → "Success message" group).
- `app/(public)/[locale]/contact/actions.ts` is the server action: validates → inserts into `enquiries` → sends two emails via Resend (atelier notification + auto-confirm to enquirer). Resend failure is non-fatal — DB write still succeeds.

To change recipients, edit the `TO_ADDRESSES` constant in `contact/actions.ts`.

---

## 9. Image performance pipeline

Three layers were added for image optimisation. All shipped, all explained inside `scripts/optimise-media.mjs` and `components/admin/ImageUpload.tsx`:

1. **Public render**: every `<img>` on public pages was replaced with `<Image>` (next/image). `/_next/image` serves AVIF/WebP at the requested width with caching.
2. **Upload-time resize**: `components/admin/ImageUpload.tsx` resizes new uploads to max 2400px long-edge and converts to WebP at q=0.82 before sending to Supabase Storage.
3. **Bulk catch-up**: `scripts/optimise-media.mjs` walks the entire `media` bucket, backs up originals under `originals/<path>`, and re-encodes anything ≥ 500 KB.
   Run: `npm i -D sharp` then `node scripts/optimise-media.mjs --apply --max-edge 2400 --quality 82`.

---

## 10. Known oddities

- The site is set to `noindex, nofollow` sitewide via `app/layout.tsx` metadata + `app/robots.ts`. Remove both when you're ready to launch publicly.
- `messages/ar.json` is actually French content despite the filename — historical artifact. The `ar` locale is currently redirected to `en` by middleware, so it doesn't render. Don't waste effort fixing the Arabic strings.
- `lib/supabase/types.ts` is hand-rolled (not generated). Most newer tables aren't in it. Most queries use `as any` to sidestep that. To regenerate properly: `npx supabase gen types typescript --project-id edpidhthaunlmuktlkxl > lib/supabase/types.ts`.
- The "VIP WATCH" word-mark in the nav links to `/`. With the invite gate, an unauthenticated visitor clicking it will see `/waitlist`. That's intentional.

---

## 11. Common gotchas, learned the hard way

- **Cleared `.next` after middleware edits**: not optional. Webpack persistent cache will serve old chunks otherwise. `rm -rf .next && npm run dev`.
- **Anything `node:crypto`**: do not import in any file that middleware touches. Middleware runs on Edge runtime. Use Web Crypto (`crypto.subtle`) only. See `lib/auth/invite-session.ts` for the pattern.
- **Supabase magic-link rate limit**: 4/hr on the default sender. If you're stuck out, use `node scripts/gen-magic-link.mjs`. Or wire Resend as custom SMTP (Supabase → Auth → Email → SMTP Settings). Resend has 3000/mo free.
- **Resend "Domain not verified" error**: forvip.watch must show green/Verified in Resend → Domains. If not, change Supabase's Sender email to `onboarding@resend.dev` temporarily.
- **`/_next/image` 400 errors**: only widths in Next's `imageSizes` (16,32,48,64,96,128,256,384) or `deviceSizes` (640,750,828,1080,1200,1920,2048,3840) are allowed. Anything else returns 400. If a thumbnail is broken, check the `w=` param.
- **Migrations on production DB**: the Supabase MCP tooling has been pointed at the wrong project before. Verify the URL says `edpidhthaunlmuktlkxl` before running any DDL via the MCP. Safe path: paste `run_me.sql` into the Supabase SQL Editor manually.

---

## 12. What's queued but not done

- **SMS re-auth via Twilio**. Tables exist (`invites.phone`), UX designed in the chat history, not built.
- **Invite-claim form on `/waitlist`** (a request-for-access flow that lands in `access_requests`). User decided invite-only is enough — but if you want an open request form, the table doesn't exist yet.
- **Dedicated `/en/departments` page**. Sections hidden on home for now; nothing built for the standalone page.
- **Real Legal admin editor** at `/admin/legal`. Placeholder only.
- **Proper Settings editor** at `/admin/settings`. Placeholder only.

---

## 13. Where each big feature lives, quick map

| Feature | Files |
|---|---|
| Invite system | `middleware.ts`, `lib/auth/invite-session.ts`, `app/i/[token]/route.ts`, `app/waitlist/page.tsx`, `app/(admin)/admin/invites/*`, `components/admin/NewInviteForm.tsx`, `components/admin/InviteActions.tsx` |
| Lookbook | `app/(public)/[locale]/lookbook/page.tsx`, `components/site/lookbook/*` |
| Collage | `app/(public)/[locale]/collage/page.tsx`, `components/site/collage/CollageGrid.tsx`, `app/(admin)/admin/collage/*`, `components/admin/CollageEditor.tsx` |
| Hero carousel (home) | `components/site/HeroCarousel.tsx`, `app/(public)/[locale]/page.tsx`, `lib/queries/home.ts::getCollectionsForHeroCarousel` |
| Contact + email | `app/(public)/[locale]/contact/*`, `components/site/ContactView.tsx`, Resend SDK |
| Wishlist | `lib/wishlist/local.ts`, `components/site/lookbook/LikeButton.tsx`, `app/(public)/[locale]/wishlist/page.tsx` |
| WhatsApp button | `components/site/WhatsAppButton.tsx`, mounted in locale layout |
| Begin-a-commission CTA | `components/site/BeginCommissionCTA.tsx`, mounted in locale layout |
| Commission spec section | `components/site/CommissionSpec.tsx`, `lib/commission/services.ts`, `components/admin/ServicesPicker.tsx` |
| GA4 | inlined in `app/layout.tsx` `<head>` |

---

## 14. First five things a new dev should do

1. Sign in to Supabase, Vercel, Resend, Twilio. Get familiar with each project's dashboard.
2. Pull the repo, `npm install`, copy `.env.local.example` → `.env.local`, fill the values.
3. Open `supabase/data/run_me.sql` and skim it — it tells you the whole schema-extensions story in one file.
4. `npm run dev`, hit http://localhost:3000 → should bounce to `/waitlist`.
5. In another tab: `node scripts/gen-magic-link.mjs bw@minc.watch http://localhost:3000/admin/auth/callback` → paste URL → sign into admin → `/admin/invites` → create an invite → copy URL → open in incognito → confirm you reach `/en`. That's the end-to-end loop.
