-- VIP WATCH — flag for personal invites where the recipient's details are
-- pre-filled in admin. On tap, the visitor row is seeded with name/email/phone
-- from the invite, so they skip /welcome entirely.

alter table invites add column if not exists is_personal boolean not null default false;
