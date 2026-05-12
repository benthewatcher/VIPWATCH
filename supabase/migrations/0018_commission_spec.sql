-- VIP WATCH — commission spec fields.
-- Free-text specifications shown on each commission detail page:
-- the client's base watch, the services performed, and the project timeline.

alter table commissions
  add column if not exists base_watch text,
  add column if not exists services_performed text,
  add column if not exists timeline text;
