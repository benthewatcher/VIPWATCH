-- VIP WATCH — commission_blocks
-- Block-based body content for commission detail pages.

create table if not exists commission_blocks (
  id uuid primary key default gen_random_uuid(),
  commission_id uuid not null references commissions(id) on delete cascade,
  position int not null default 0,
  type text not null check (type in ('paragraph','image','image_pair')),
  body_en text,
  body_fr text,
  image_url text,
  image_url_2 text,
  alt_en text,
  alt_fr text,
  created_at timestamptz not null default now()
);

create index if not exists commission_blocks_commission_id_position_idx
  on commission_blocks(commission_id, position);

alter table commission_blocks enable row level security;

drop policy if exists "public read commission blocks of published" on commission_blocks;
create policy "public read commission blocks of published" on commission_blocks
  for select using (
    exists (select 1 from commissions c where c.id = commission_id and c.status = 'published')
  );

drop policy if exists "admin all on commission_blocks" on commission_blocks;
create policy "admin all on commission_blocks" on commission_blocks
  for all using (is_admin()) with check (is_admin());
