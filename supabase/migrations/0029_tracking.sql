-- VIP WATCH — visitor tracking & analytics
--
-- Adds:
--   visitor_events       — every page view, wishlist toggle, share tap, enquiry submit, etc.
--   wishlist_items       — server-synced wishlist (browser localStorage stays the source of truth
--                          until the visitor is identified; then we mirror it here)
--   invite_uses.visitor_id — link each tap to the visitor it produced
--   visitor_notifications delivery columns — Resend/Twilio webhooks land here

-- 1. visitor_events: time-ordered timeline per visitor.
create table if not exists visitor_events (
  id uuid primary key default gen_random_uuid(),
  visitor_id uuid not null references visitors(id) on delete cascade,
  event_type text not null,            -- e.g. 'pageview', 'wishlist_add', 'wishlist_remove',
                                       --     'share_tap', 'enquiry_submit', 'cta_click'
  path text,                           -- e.g. '/en/commissions/atelier-no-3'
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists visitor_events_visitor_idx
  on visitor_events(visitor_id, created_at desc);
create index if not exists visitor_events_type_idx
  on visitor_events(event_type, created_at desc);

alter table visitor_events enable row level security;

drop policy if exists "admin all on visitor_events" on visitor_events;
create policy "admin all on visitor_events" on visitor_events for all
  using (is_admin()) with check (is_admin());

-- Anon can insert their own events (server route validates the visitor cookie
-- before calling; client-side inserts are blocked by RLS without service role).
drop policy if exists "anon insert visitor_events" on visitor_events;
create policy "anon insert visitor_events" on visitor_events for insert with check (false);
-- ^ false on purpose: all writes go through service-role API route which bypasses RLS.

-- 2. wishlist_items: persistent wishlist for identified visitors.
create table if not exists wishlist_items (
  id uuid primary key default gen_random_uuid(),
  visitor_id uuid not null references visitors(id) on delete cascade,
  commission_id uuid not null references commissions(id) on delete cascade,
  added_at timestamptz not null default now(),
  removed_at timestamptz,
  unique (visitor_id, commission_id)
);

create index if not exists wishlist_items_visitor_idx
  on wishlist_items(visitor_id, added_at desc);
create index if not exists wishlist_items_commission_idx
  on wishlist_items(commission_id);

alter table wishlist_items enable row level security;

drop policy if exists "admin all on wishlist_items" on wishlist_items;
create policy "admin all on wishlist_items" on wishlist_items for all
  using (is_admin()) with check (is_admin());

-- 3. Link invite_uses → visitor_id so we can ask "who tapped this share?"
alter table invite_uses
  add column if not exists visitor_id uuid references visitors(id) on delete set null,
  add column if not exists shared_wishlist_id uuid references shared_wishlists(id) on delete set null;

create index if not exists invite_uses_visitor_idx on invite_uses(visitor_id);
create index if not exists invite_uses_shared_wishlist_idx on invite_uses(shared_wishlist_id);

-- 4. Email/SMS delivery columns on visitor_notifications (webhook-fed).
alter table visitor_notifications
  add column if not exists email_message_id text,         -- Resend message id
  add column if not exists email_delivered_at timestamptz,
  add column if not exists email_opened_at timestamptz,
  add column if not exists email_clicked_at timestamptz,
  add column if not exists email_bounced_at timestamptz,
  add column if not exists sms_message_id text,           -- Twilio MessageSid
  add column if not exists sms_status text,               -- queued / sent / delivered / failed / undelivered
  add column if not exists sms_delivered_at timestamptz,
  add column if not exists sms_failed_reason text;

create index if not exists visitor_notifications_email_msgid_idx
  on visitor_notifications(email_message_id)
  where email_message_id is not null;
create index if not exists visitor_notifications_sms_msgid_idx
  on visitor_notifications(sms_message_id)
  where sms_message_id is not null;
