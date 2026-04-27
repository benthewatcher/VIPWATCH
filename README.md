# VIP WATCH

Bilingual (EN default, FR) PWA for a luxury watch personalisation atelier.

Stack: Next.js 16 (App Router) · TypeScript · Tailwind v4 · shadcn/ui · Supabase · next-intl · Resend.

## Quick start

```bash
cp .env.local.example .env.local   # fill in Supabase + Resend keys
npm run dev                        # http://localhost:3000 → /en
```

## Apply database schema

Open Supabase SQL editor for project `edpidhthaunlmuktlkxl` and run, in order:

1. `supabase/migrations/0001_init.sql` (tables, indexes, triggers)
2. `supabase/migrations/0002_rls.sql` (RLS policies + `is_admin()` helper)

After signing in once with magic link, seed your admin row:

```sql
insert into profiles (id, email, full_name, role)
values (
  (select id from auth.users where email = 'bw@minc.watch'),
  'bw@minc.watch', 'Ben', 'owner'
);
```

Then regenerate types:

```bash
npx supabase gen types typescript --project-id edpidhthaunlmuktlkxl > lib/supabase/types.ts
```

## Project layout

Public site lives under `app/(public)/[locale]/...`, admin under `app/(admin)/admin/...`.

## Phase status

| Phase | What | Status |
|---|---|---|
| 0 | Scaffold + deps + shadcn | done |
| 1 | Schema + RLS (SQL written, paste into Supabase) | awaiting paste |
| 2–10 | Design system → forms → admin → PWA → deploy | pending |
