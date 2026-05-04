-- VIP WATCH — manually-curated related commissions per commission.
-- If null/empty, the public page falls back to auto (next 3 by position).

alter table commissions
  add column if not exists related_commission_ids uuid[] not null default '{}';
