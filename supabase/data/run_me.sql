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
