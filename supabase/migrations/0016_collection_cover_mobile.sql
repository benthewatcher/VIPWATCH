-- VIP WATCH — separate mobile cover image for collections, matching the
-- pattern in 0014 for pages/commissions. Optional: when null, the desktop
-- cover_image is auto-cropped (Supabase image transforms) on the client.

alter table commission_collections add column if not exists cover_image_mobile text;
