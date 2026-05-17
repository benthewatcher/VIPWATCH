-- VIP WATCH — visitors who arrived via an invite or a shared wishlist.
-- One row per (browser + invite) pair, identified by a visitor_id we mint on
-- first tap. Name is captured on the /welcome page. The invite cookie carries
-- both invite_id (iid) and visitor_id (vid).

create table if not exists visitors (
  id uuid primary key default gen_random_uuid(),
  invite_id uuid references invites(id) on delete set null,
  referred_by_name text,                  -- "Alice" when arriving via her wishlist
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
