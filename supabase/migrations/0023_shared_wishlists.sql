-- VIP WATCH — shareable wishlists. Live by default: visiting the share URL
-- always shows the latest commission_ids, because the creator can update the
-- same row from /wishlist as they add/remove hearts. Identity capture is
-- light (name + optional email + optional note).

create table if not exists shared_wishlists (
  id uuid primary key default gen_random_uuid(),
  token text unique not null,                 -- short URL-safe identifier
  title text,                                  -- optional, e.g. "Cannes shortlist"
  message text,                                -- optional note to recipient
  sharer_name text,                            -- name they typed at share time
  sharer_email text,                           -- optional reply-to
  commission_ids uuid[] not null default '{}', -- ordered list of commissions
  invite_id uuid references invites(id) on delete set null,
  view_count int not null default 0,
  last_viewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shared_wishlists_token_idx on shared_wishlists(token);
create index if not exists shared_wishlists_created_idx on shared_wishlists(created_at desc);

alter table shared_wishlists enable row level security;

-- Public read by token only — selected through a dedicated function below to
-- prevent listing/enumeration.
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
