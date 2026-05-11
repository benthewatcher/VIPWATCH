-- VIP WATCH — lookbook + wishlist.
-- Adds video background and independent ordering to commission_collections for
-- the new /lookbook page, and a per-user wishlist of liked commissions.

alter table commission_collections
  add column if not exists hero_video text,
  add column if not exists lookbook_position int not null default 0;

create index if not exists commission_collections_lookbook_idx
  on commission_collections(is_private, lookbook_position) where is_private = false;

create table if not exists user_wishlist (
  user_id uuid not null references auth.users(id) on delete cascade,
  commission_id uuid not null references commissions(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, commission_id)
);

create index if not exists user_wishlist_user_idx on user_wishlist(user_id, created_at desc);

alter table user_wishlist enable row level security;

drop policy if exists "user reads own wishlist" on user_wishlist;
create policy "user reads own wishlist" on user_wishlist
  for select using (auth.uid() = user_id);

drop policy if exists "user inserts own wishlist" on user_wishlist;
create policy "user inserts own wishlist" on user_wishlist
  for insert with check (auth.uid() = user_id);

drop policy if exists "user deletes own wishlist" on user_wishlist;
create policy "user deletes own wishlist" on user_wishlist
  for delete using (auth.uid() = user_id);
