-- VIP WATCH — homepage editorial blocks.

-- Department blocks: full-bleed image tiles on the homepage
create table if not exists home_departments (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title_en text not null,
  title_fr text not null default '',
  body_en text,
  body_fr text,
  image text,
  link_url text,
  link_label_en text,
  link_label_fr text,
  position int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists home_departments_position_idx on home_departments(position);

alter table home_departments enable row level security;

drop policy if exists "public read visible departments" on home_departments;
create policy "public read visible departments" on home_departments
  for select using (is_visible = true);

drop policy if exists "admin all on home_departments" on home_departments;
create policy "admin all on home_departments" on home_departments
  for all using (is_admin()) with check (is_admin());

-- Testimonials backdrop image (the watch they had work on)
alter table testimonials
  add column if not exists backdrop_image text;
