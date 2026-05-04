-- VIP WATCH — per-commission and per-collection theme override.
-- 'system' (default) = honour visitor's chosen theme
-- 'light' / 'dark' = force on this page regardless

alter table commissions
  add column if not exists theme text not null default 'system'
    check (theme in ('system', 'light', 'dark'));

alter table commission_collections
  add column if not exists theme text not null default 'system'
    check (theme in ('system', 'light', 'dark'));
