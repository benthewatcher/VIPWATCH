-- VIP WATCH — visitors can sign in with email OR phone, not both required.
alter table visitors add column if not exists phone text;
