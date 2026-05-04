-- VIP WATCH — singleton editorial blocks for the homepage.
-- One row per block_key. Fields are intentionally generic so the same shape
-- can power different sections (atelier intro, CTA strip, etc).

create table if not exists home_blocks (
  block_key text primary key check (block_key in ('atelier_intro', 'cta_strip', 'process_teaser')),
  is_visible boolean not null default true,
  eyebrow_en text,
  eyebrow_fr text,
  title_en text,
  title_fr text,
  body_en text,
  body_fr text,
  cta_label_en text,
  cta_label_fr text,
  cta_url text,
  image text,
  updated_at timestamptz not null default now()
);

alter table home_blocks enable row level security;

drop policy if exists "public read visible home_blocks" on home_blocks;
create policy "public read visible home_blocks" on home_blocks
  for select using (is_visible = true);

drop policy if exists "admin all on home_blocks" on home_blocks;
create policy "admin all on home_blocks" on home_blocks
  for all using (is_admin()) with check (is_admin());

-- Seed empty placeholder rows so the admin editor has something to load.
insert into home_blocks (block_key, is_visible) values
  ('atelier_intro', true),
  ('process_teaser', true),
  ('cta_strip', true)
on conflict (block_key) do nothing;
