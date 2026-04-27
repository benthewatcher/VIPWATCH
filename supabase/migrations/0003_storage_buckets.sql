-- Storage buckets for VIP WATCH
-- Apply via Supabase SQL editor.

-- Public bucket for published assets (heroes, gallery, dial photos…)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 10485760, array['image/jpeg','image/png','image/webp','image/avif','video/mp4'])
on conflict (id) do update set public = excluded.public;

-- Private bucket for drafts / staging uploads
insert into storage.buckets (id, name, public, file_size_limit)
values ('uploads', 'uploads', false, 26214400)
on conflict (id) do update set public = excluded.public;

-- Storage RLS
-- Public bucket: anon can read, only admins can write.
drop policy if exists "media public read" on storage.objects;
create policy "media public read" on storage.objects
  for select using (bucket_id = 'media');

drop policy if exists "media admin write" on storage.objects;
create policy "media admin write" on storage.objects
  for insert with check (bucket_id = 'media' and is_admin());

drop policy if exists "media admin update" on storage.objects;
create policy "media admin update" on storage.objects
  for update using (bucket_id = 'media' and is_admin())
  with check (bucket_id = 'media' and is_admin());

drop policy if exists "media admin delete" on storage.objects;
create policy "media admin delete" on storage.objects
  for delete using (bucket_id = 'media' and is_admin());

-- Private bucket: only admins can do anything.
drop policy if exists "uploads admin all" on storage.objects;
create policy "uploads admin all" on storage.objects
  for all using (bucket_id = 'uploads' and is_admin())
  with check (bucket_id = 'uploads' and is_admin());
