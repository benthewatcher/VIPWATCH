-- VIP WATCH — separate mobile hero images. The desktop hero is composed wide
-- (16:10) and crops awkwardly on phones; mobile gets a 4:5 portrait variant.

alter table pages         add column if not exists hero_image_mobile text;
alter table commissions   add column if not exists hero_image_mobile text;
