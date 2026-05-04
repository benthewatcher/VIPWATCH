-- VIP WATCH — commission collections.
-- A collection groups commissions under a Name + Project tag, with curated
-- ordering. Private collections are admin-only (not listed on public site).

create table if not exists commission_collections (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_en text not null,
  name_fr text not null default '',
  project_en text,
  project_fr text,
  description_en text,
  description_fr text,
  cover_image text,
  is_private boolean not null default false,
  is_featured boolean not null default false,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists commission_collections_public_idx
  on commission_collections(is_private, position) where is_private = false;
create index if not exists commission_collections_featured_idx
  on commission_collections(is_featured) where is_featured = true;

create table if not exists collection_commissions (
  collection_id uuid not null references commission_collections(id) on delete cascade,
  commission_id uuid not null references commissions(id) on delete cascade,
  position int not null default 0,
  primary key (collection_id, commission_id)
);

create index if not exists collection_commissions_collection_idx
  on collection_commissions(collection_id, position);

alter table commission_collections enable row level security;
alter table collection_commissions enable row level security;

-- public read of non-private collections
drop policy if exists "public read non-private collections" on commission_collections;
create policy "public read non-private collections" on commission_collections
  for select using (is_private = false);

drop policy if exists "public read collection_commissions of public" on collection_commissions;
create policy "public read collection_commissions of public" on collection_commissions
  for select using (
    exists (select 1 from commission_collections c where c.id = collection_id and c.is_private = false)
  );

-- admin full crud
drop policy if exists "admin all on commission_collections" on commission_collections;
create policy "admin all on commission_collections" on commission_collections
  for all using (is_admin()) with check (is_admin());

drop policy if exists "admin all on collection_commissions" on collection_commissions;
create policy "admin all on collection_commissions" on collection_commissions
  for all using (is_admin()) with check (is_admin());
