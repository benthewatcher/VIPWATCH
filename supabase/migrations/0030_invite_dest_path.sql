-- VIP WATCH — optional deep-link destination per invite. When set, tapping
-- the invite redirects there (after /welcome if applicable) instead of /en.
-- Stored as a path, not a full URL, so the host can change without rewriting
-- rows. Must start with "/".

alter table invites
  add column if not exists dest_path text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'invites_dest_path_starts_with_slash'
  ) then
    alter table invites
      add constraint invites_dest_path_starts_with_slash
      check (dest_path is null or dest_path like '/%');
  end if;
end $$;
