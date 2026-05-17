-- VIP WATCH — admin-authored notes delivered to a specific visitor.
-- Stored here as the canonical record; the same content can also be emailed
-- via Resend at send time. The on-site banner reads unread rows for the
-- current visitor and displays the most recent.

create table if not exists visitor_notifications (
  id uuid primary key default gen_random_uuid(),
  visitor_id uuid not null references visitors(id) on delete cascade,
  subject text,                          -- optional, used as email subject
  body text not null,
  sent_email boolean not null default false,
  sent_banner boolean not null default true,
  email_sent_at timestamptz,
  read_at timestamptz,                   -- when the visitor dismissed the banner
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
