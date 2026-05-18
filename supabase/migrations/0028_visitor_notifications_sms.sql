-- VIP WATCH — extend visitor_notifications with SMS channel, banner send timestamp,
-- and soft-delete column. SMS bodies reuse the existing `body` column.

alter table visitor_notifications
  add column if not exists sent_sms boolean not null default false,
  add column if not exists sms_sent_at timestamptz,
  add column if not exists banner_sent_at timestamptz,
  add column if not exists deleted_at timestamptz;

-- Re-target the unread-banner index to also exclude soft-deleted rows so the
-- banner query stays cheap.
drop index if exists visitor_notifications_unread_idx;
create index if not exists visitor_notifications_unread_idx
  on visitor_notifications(visitor_id)
  where read_at is null and deleted_at is null;
