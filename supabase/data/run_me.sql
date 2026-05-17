-- VIP WATCH — pending data + schema changes.
-- Paste this whole file into the Supabase SQL Editor for project
-- edpidhthaunlmuktlkxl and click "Run". Idempotent — safe to re-run.
--
-- Sections:
--   1. Schema safety net (no-op if migrations already applied)
--   2. Process steps — 6-step canonical copy
--   3. CTA strip text — match the public site copy

-- ---------------------------------------------------------------------------
-- 1. Schema safety net
-- ---------------------------------------------------------------------------
-- All four migrations below were already marked as "applied" in the previous
-- session. The `if not exists` / `add column if not exists` guards make this
-- block a no-op if so. If any column or table is missing, this fixes it.

alter table commission_collections
  add column if not exists hero_video text,
  add column if not exists lookbook_position int not null default 0,
  add column if not exists cover_image_mobile text;

create table if not exists user_wishlist (
  user_id uuid not null references auth.users(id) on delete cascade,
  commission_id uuid not null references commissions(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, commission_id)
);

create table if not exists collage_tiles (
  image_path text primary key,
  position int not null default 0,
  updated_at timestamptz not null default now()
);

alter table commissions
  add column if not exists base_watch text,
  add column if not exists services_performed text,
  add column if not exists timeline text;

alter table pages
  add column if not exists success_title_en text,
  add column if not exists success_title_fr text,
  add column if not exists success_body_en text,
  add column if not exists success_body_fr text;

create table if not exists invites (
  id uuid primary key default gen_random_uuid(),
  token text unique not null,
  label text not null,
  phone text,
  email text,
  notes text,
  max_uses int,
  used_count int not null default 0,
  expires_at timestamptz not null default now() + interval '30 days',
  is_revoked boolean not null default false,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists invites_token_idx on invites(token);
create index if not exists invites_active_idx on invites(is_revoked, expires_at)
  where is_revoked = false;

create table if not exists invite_uses (
  id uuid primary key default gen_random_uuid(),
  invite_id uuid not null references invites(id) on delete cascade,
  ip_hash text,
  user_agent text,
  used_at timestamptz not null default now()
);

create index if not exists invite_uses_invite_idx on invite_uses(invite_id, used_at desc);

alter table invites enable row level security;
alter table invite_uses enable row level security;

drop policy if exists "admin all on invites" on invites;
create policy "admin all on invites" on invites for all
  using (is_admin()) with check (is_admin());

drop policy if exists "admin all on invite_uses" on invite_uses;
create policy "admin all on invite_uses" on invite_uses for all
  using (is_admin()) with check (is_admin());

create or replace function increment_invite_used(_invite_id uuid)
returns void language sql security definer as $$
  update invites set used_count = used_count + 1 where id = _invite_id;
$$;

create table if not exists phone_otps (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  code_hash text not null,
  invite_id uuid references invites(id) on delete set null,
  expires_at timestamptz not null,
  attempts int not null default 0,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists phone_otps_phone_idx on phone_otps(phone, created_at desc);

alter table phone_otps enable row level security;

drop policy if exists "admin all on phone_otps" on phone_otps;
create policy "admin all on phone_otps" on phone_otps for all
  using (is_admin()) with check (is_admin());

alter table enquiries
  add column if not exists invite_id uuid references invites(id) on delete set null;

create index if not exists enquiries_invite_idx on enquiries(invite_id);

create table if not exists shared_wishlists (
  id uuid primary key default gen_random_uuid(),
  token text unique not null,
  title text,
  message text,
  sharer_name text,
  sharer_email text,
  commission_ids uuid[] not null default '{}',
  invite_id uuid references invites(id) on delete set null,
  view_count int not null default 0,
  last_viewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shared_wishlists_token_idx on shared_wishlists(token);
create index if not exists shared_wishlists_created_idx on shared_wishlists(created_at desc);

alter table shared_wishlists enable row level security;

drop policy if exists "admin all on shared_wishlists" on shared_wishlists;
create policy "admin all on shared_wishlists" on shared_wishlists for all
  using (is_admin()) with check (is_admin());

create or replace function increment_shared_wishlist_view(_token text)
returns void language sql security definer as $$
  update shared_wishlists
  set view_count = view_count + 1,
      last_viewed_at = now()
  where token = _token;
$$;

create table if not exists visitors (
  id uuid primary key default gen_random_uuid(),
  invite_id uuid references invites(id) on delete set null,
  referred_by_name text,
  shared_wishlist_id uuid references shared_wishlists(id) on delete set null,
  name text,
  email text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  ip_hash text,
  user_agent text
);

create index if not exists visitors_invite_idx on visitors(invite_id);
create index if not exists visitors_recent_idx on visitors(last_seen_at desc);

alter table visitors enable row level security;

drop policy if exists "admin all on visitors" on visitors;
create policy "admin all on visitors" on visitors for all
  using (is_admin()) with check (is_admin());

alter table visitors add column if not exists phone text;
alter table invites add column if not exists is_personal boolean not null default false;

create table if not exists visitor_notifications (
  id uuid primary key default gen_random_uuid(),
  visitor_id uuid not null references visitors(id) on delete cascade,
  subject text,
  body text not null,
  sent_email boolean not null default false,
  sent_banner boolean not null default true,
  email_sent_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  created_by uuid references profiles(id)
);

create index if not exists visitor_notifications_visitor_idx
  on visitor_notifications(visitor_id, created_at desc);
create index if not exists visitor_notifications_unread_idx
  on visitor_notifications(visitor_id) where read_at is null;

alter table visitor_notifications enable row level security;

drop policy if exists "admin all on visitor_notifications" on visitor_notifications;
create policy "admin all on visitor_notifications" on visitor_notifications for all
  using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------------
-- 2. Process steps — replace with the canonical 6 steps
-- ---------------------------------------------------------------------------
delete from process_steps;

insert into process_steps (number, position, status, title_en, title_fr, copy_en, copy_fr) values
  ('01', 1, 'published', 'Enquiry', 'Enquiry',
   'You write to us with the watch you own and the brief in mind. We reply within two working days with an initial conversation.',
   'You write to us with the watch you own and the brief in mind. We reply within two working days with an initial conversation.'),
  ('02', 2, 'published', 'Consultation', 'Consultation',
   'A confidential meeting in person, online, or with our travelling watchmaker to translate the brief into specifications and confirm feasibility.',
   'A confidential meeting in person, online, or with our travelling watchmaker to translate the brief into specifications and confirm feasibility.'),
  ('03', 3, 'published', 'Design', 'Design',
   'Sketches, CAD renders, finish samples and material swatches. The file is iterated until you sign off in writing.',
   'Sketches, CAD renders, finish samples and material swatches. The file is iterated until you sign off in writing.'),
  ('04', 4, 'published', 'Quotation', 'Quotation',
   'A fixed-price quotation by department, with a delivery window. A 50% deposit confirms the commission.',
   'A fixed-price quotation by department, with a delivery window. A 50% deposit confirms the commission.'),
  ('05', 5, 'published', 'Commission', 'Commission',
   'Your watch arrives at the atelier under insured transport. Work proceeds department by department; you receive monthly photographic reports.',
   'Your watch arrives at the atelier under insured transport. Work proceeds department by department; you receive monthly photographic reports.'),
  ('06', 6, 'published', 'Delivery', 'Delivery',
   'Hand-delivered when geography allows, or insured-shipped with full provenance file, certificate, and our international warranty.',
   'Hand-delivered when geography allows, or insured-shipped with full provenance file, certificate, and our international warranty.');

-- ---------------------------------------------------------------------------
-- 3. CTA strip text — keep admin in sync with the hardcoded public copy
-- ---------------------------------------------------------------------------
-- The footer CTA renders the copy below regardless of what's in this row,
-- but updating these fields keeps /admin/home consistent so the admin form
-- doesn't display stale text. The background image stays whatever you
-- uploaded.
update home_blocks set
  eyebrow_en        = 'Your turn',
  eyebrow_fr        = 'À votre tour',
  title_en          = 'Begin a commission',
  title_fr          = 'Commencer une réalisation',
  body_en           = 'Send us your location and a brief idea — we will review within a week and arrange a time to talk.',
  body_fr           = 'Envoyez-nous votre localisation et une brève idée — nous vous répondrons dans la semaine pour convenir d''un échange.',
  cta_label_en      = 'Send a message',
  cta_label_fr      = 'Envoyer un message',
  cta_url           = '/contact'
where block_key = 'cta_strip';

-- If the cta_strip row doesn't exist yet, create it (image stays null).
insert into home_blocks (block_key, is_visible, eyebrow_en, eyebrow_fr, title_en, title_fr, body_en, body_fr, cta_label_en, cta_label_fr, cta_url)
select
  'cta_strip', true,
  'Your turn', 'À votre tour',
  'Begin a commission', 'Commencer une réalisation',
  'Send us your location and a brief idea — we will review within a week and arrange a time to talk.',
  'Envoyez-nous votre localisation et une brève idée — nous vous répondrons dans la semaine pour convenir d''un échange.',
  'Send a message', 'Envoyer un message',
  '/contact'
where not exists (select 1 from home_blocks where block_key = 'cta_strip');
