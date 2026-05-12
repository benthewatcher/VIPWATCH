-- VIP WATCH — explicit ordering for the /collage page.
-- One row per image path (hero, card, or gallery url). Position is global
-- (0 = first tile, ascending). Admin manages from /admin/collage.

create table if not exists collage_tiles (
  image_path text primary key,
  position int not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists collage_tiles_position_idx on collage_tiles(position);

alter table collage_tiles enable row level security;

drop policy if exists "public read collage_tiles" on collage_tiles;
create policy "public read collage_tiles" on collage_tiles
  for select using (true);

drop policy if exists "admin all on collage_tiles" on collage_tiles;
create policy "admin all on collage_tiles" on collage_tiles
  for all using (is_admin()) with check (is_admin());
