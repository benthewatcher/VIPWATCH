-- ============================================================
-- VIP WATCH — initial schema
-- Apply via Supabase SQL Editor for project edpidhthaunlmuktlkxl
-- Run as one transaction.
-- ============================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- enums
do $$ begin create type publish_status as enum ('draft', 'published', 'archived'); exception when duplicate_object then null; end $$;
do $$ begin create type enquiry_status as enum ('new', 'in_progress', 'qualified', 'won', 'lost', 'spam'); exception when duplicate_object then null; end $$;
do $$ begin create type admin_role as enum ('owner', 'editor'); exception when duplicate_object then null; end $$;
do $$ begin create type locale_code as enum ('fr', 'en'); exception when duplicate_object then null; end $$;

-- profiles
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  role admin_role not null default 'editor',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- brands
create table if not exists brands (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

-- commissions
create table if not exists commissions (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  client_initials text,
  brand_id uuid references brands(id) on delete set null,
  watch_model text,
  year_started int,
  hero_image text,
  hero_video text,
  card_image text,
  title_fr text not null,
  title_en text not null,
  summary_fr text,
  summary_en text,
  body_fr text,
  body_en text,
  status publish_status not null default 'draft',
  is_featured boolean not null default false,
  position int not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists commissions_status_published_idx on commissions(status, published_at desc);
create index if not exists commissions_featured_idx on commissions(is_featured) where is_featured = true;
create index if not exists commissions_slug_idx on commissions(slug);

create table if not exists commission_images (
  id uuid primary key default gen_random_uuid(),
  commission_id uuid not null references commissions(id) on delete cascade,
  url text not null,
  alt_fr text,
  alt_en text,
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists commission_images_commission_idx on commission_images(commission_id, position);

-- services
create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  icon_name text,
  hero_image text,
  title_fr text not null,
  title_en text not null,
  summary_fr text,
  summary_en text,
  body_fr text,
  body_en text,
  position int not null default 0,
  status publish_status not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- testimonials
create table if not exists testimonials (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  client_role text,
  photo_url text,
  quote_fr text not null,
  quote_en text not null,
  position int not null default 0,
  is_featured boolean not null default true,
  created_at timestamptz not null default now()
);

-- faqs
create table if not exists faqs (
  id uuid primary key default gen_random_uuid(),
  category text,
  question_fr text not null,
  question_en text not null,
  answer_fr text not null,
  answer_en text not null,
  position int not null default 0,
  status publish_status not null default 'published',
  created_at timestamptz not null default now()
);
create index if not exists faqs_category_position_idx on faqs(category, position);

-- blog
create table if not exists blog_categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_fr text not null,
  name_en text not null,
  position int not null default 0
);

create table if not exists blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  hero_image text,
  author_id uuid references profiles(id) on delete set null,
  title_fr text not null,
  title_en text not null,
  excerpt_fr text,
  excerpt_en text,
  body_fr text,
  body_en text,
  status publish_status not null default 'draft',
  published_at timestamptz,
  reading_minutes int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists blog_posts_status_published_idx on blog_posts(status, published_at desc);

create table if not exists blog_post_categories (
  blog_post_id uuid not null references blog_posts(id) on delete cascade,
  category_id uuid not null references blog_categories(id) on delete cascade,
  primary key (blog_post_id, category_id)
);

-- pages (singletons)
create table if not exists pages (
  key text primary key,
  hero_image text,
  hero_video text,
  title_fr text,
  title_en text,
  hero_heading_fr text,
  hero_heading_en text,
  hero_cta_label_fr text,
  hero_cta_label_en text,
  hero_cta_href text,
  body_fr text,
  body_en text,
  meta_title_fr text,
  meta_title_en text,
  meta_description_fr text,
  meta_description_en text,
  updated_at timestamptz not null default now()
);

-- legal pages
create table if not exists legal_pages (
  slug text primary key,
  title_fr text not null,
  title_en text not null,
  body_fr text not null,
  body_en text not null,
  updated_at timestamptz not null default now()
);

-- enquiries
create table if not exists enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  country text,
  watch_brand text,
  watch_model text,
  watch_reference text,
  message text not null,
  budget_band text,
  preferred_contact text,
  source_locale locale_code not null default 'en',
  source_path text,
  source_referrer text,
  status enquiry_status not null default 'new',
  assigned_to uuid references profiles(id) on delete set null,
  internal_notes text,
  user_agent text,
  ip_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists enquiries_status_created_idx on enquiries(status, created_at desc);
create index if not exists enquiries_email_idx on enquiries(email);

-- newsletter subscribers
create table if not exists newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email citext unique not null,
  locale locale_code not null default 'en',
  source text,
  subscribed_at timestamptz not null default now(),
  unsubscribed_at timestamptz,
  resend_contact_id text
);

-- settings
create table if not exists settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
insert into settings (key, value) values
  ('contact', '{"address_line_1": "", "city": "", "country": "Switzerland", "email": "", "phone": ""}'::jsonb),
  ('social', '{"instagram": "", "youtube": "", "linkedin": "", "tiktok": ""}'::jsonb),
  ('seo', '{"site_name": "VIP WATCH", "default_og_image": ""}'::jsonb)
on conflict (key) do nothing;

-- audit log
create table if not exists audit_log (
  id bigserial primary key,
  actor_id uuid references profiles(id) on delete set null,
  action text not null,
  entity_table text not null,
  entity_id text,
  diff jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_log_entity_idx on audit_log(entity_table, entity_id);
create index if not exists audit_log_actor_idx on audit_log(actor_id, created_at desc);

-- updated_at trigger
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare t text;
begin
  for t in select unnest(array[
    'profiles','commissions','services','blog_posts','pages','legal_pages',
    'enquiries','settings'
  ])
  loop
    execute format(
      'drop trigger if exists trg_%I_updated_at on %I;
       create trigger trg_%I_updated_at before update on %I
       for each row execute function set_updated_at();', t, t, t, t);
  end loop;
end$$;
