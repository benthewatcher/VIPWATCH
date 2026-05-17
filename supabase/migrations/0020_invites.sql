-- VIP WATCH — invite-only public access.
-- Visitors arrive via a unique tap-link (/i/<token>). Tapping validates the
-- invite and sets a signed cookie that the middleware uses to admit them to
-- the rest of /[locale]/*. SMS-based re-auth (using `phone`) can be wired
-- later via Twilio without touching the schema.

create table if not exists invites (
  id uuid primary key default gen_random_uuid(),
  token text unique not null,          -- short URL-safe e.g. ABCD-EFGH-IJKL
  label text not null,                  -- "Roger Smith" / "FT press batch"
  phone text,                           -- optional, E.164 for future SMS re-auth
  email text,                           -- optional, for admin reference
  notes text,
  max_uses int,                         -- null = unlimited
  used_count int not null default 0,
  expires_at timestamptz not null default now() + interval '30 days',
  is_revoked boolean not null default false,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists invites_token_idx on invites(token);
create index if not exists invites_active_idx on invites(is_revoked, expires_at)
  where is_revoked = false;

create table if not exists invite_uses (
  id uuid primary key default gen_random_uuid(),
  invite_id uuid not null references invites(id) on delete cascade,
  ip_hash text,                         -- sha256(ip + salt)
  user_agent text,
  used_at timestamptz not null default now()
);

create index if not exists invite_uses_invite_idx on invite_uses(invite_id, used_at desc);

alter table invites enable row level security;
alter table invite_uses enable row level security;

-- Admin full crud; no public read (tokens stay private until clicked).
drop policy if exists "admin all on invites" on invites;
create policy "admin all on invites" on invites for all
  using (is_admin()) with check (is_admin());

drop policy if exists "admin all on invite_uses" on invite_uses;
create policy "admin all on invite_uses" on invite_uses for all
  using (is_admin()) with check (is_admin());
