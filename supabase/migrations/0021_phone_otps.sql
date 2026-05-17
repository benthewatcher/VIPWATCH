-- VIP WATCH — short-lived OTP codes for invite-holders re-authing via SMS.
-- The code is stored hashed (HMAC-SHA256 with INVITE_SESSION_SECRET). Each
-- request consumes/invalidates older codes for the same phone.

create table if not exists phone_otps (
  id uuid primary key default gen_random_uuid(),
  phone text not null,                -- E.164
  code_hash text not null,
  invite_id uuid references invites(id) on delete set null,
  expires_at timestamptz not null,
  attempts int not null default 0,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists phone_otps_phone_idx on phone_otps(phone, created_at desc);

alter table phone_otps enable row level security;

-- No public read; everything goes through the service role API.
drop policy if exists "admin all on phone_otps" on phone_otps;
create policy "admin all on phone_otps" on phone_otps for all
  using (is_admin()) with check (is_admin());
