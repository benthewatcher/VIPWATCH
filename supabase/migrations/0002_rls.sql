-- VIP WATCH — RLS policies
-- Apply after 0001_init.sql.

alter table profiles enable row level security;
alter table commissions enable row level security;
alter table commission_images enable row level security;
alter table services enable row level security;
alter table testimonials enable row level security;
alter table faqs enable row level security;
alter table blog_posts enable row level security;
alter table blog_categories enable row level security;
alter table blog_post_categories enable row level security;
alter table pages enable row level security;
alter table legal_pages enable row level security;
alter table enquiries enable row level security;
alter table newsletter_subscribers enable row level security;
alter table settings enable row level security;
alter table audit_log enable row level security;
alter table brands enable row level security;

create or replace function is_admin() returns boolean
  language sql stable security definer as $$
    select exists (select 1 from profiles where id = auth.uid());
$$;

-- public read of published content
drop policy if exists "public read published commissions" on commissions;
create policy "public read published commissions" on commissions
  for select using (status = 'published');

drop policy if exists "public read commission images of published" on commission_images;
create policy "public read commission images of published" on commission_images
  for select using (
    exists (select 1 from commissions c where c.id = commission_id and c.status = 'published')
  );

drop policy if exists "public read services" on services;
create policy "public read services" on services for select using (status = 'published');

drop policy if exists "public read testimonials" on testimonials;
create policy "public read testimonials" on testimonials for select using (true);

drop policy if exists "public read faqs" on faqs;
create policy "public read faqs" on faqs for select using (status = 'published');

drop policy if exists "public read blog posts" on blog_posts;
create policy "public read blog posts" on blog_posts
  for select using (status = 'published' and published_at <= now());

drop policy if exists "public read blog categories" on blog_categories;
create policy "public read blog categories" on blog_categories for select using (true);

drop policy if exists "public read blog post categories" on blog_post_categories;
create policy "public read blog post categories" on blog_post_categories for select using (true);

drop policy if exists "public read pages" on pages;
create policy "public read pages" on pages for select using (true);

drop policy if exists "public read legal pages" on legal_pages;
create policy "public read legal pages" on legal_pages for select using (true);

drop policy if exists "public read brands" on brands;
create policy "public read brands" on brands for select using (true);

drop policy if exists "public read settings" on settings;
create policy "public read settings" on settings for select using (true);

-- public insert on enquiries + newsletter
drop policy if exists "anon insert enquiries" on enquiries;
create policy "anon insert enquiries" on enquiries for insert with check (true);

drop policy if exists "anon insert newsletter" on newsletter_subscribers;
create policy "anon insert newsletter" on newsletter_subscribers for insert with check (true);

-- admin full crud
do $$
declare t text;
begin
  for t in select unnest(array[
    'profiles','commissions','commission_images','services','testimonials','faqs',
    'blog_posts','blog_categories','blog_post_categories','pages','legal_pages',
    'enquiries','newsletter_subscribers','settings','audit_log','brands'
  ])
  loop
    execute format('drop policy if exists "admin all on %I" on %I;', t, t);
    execute format(
      'create policy "admin all on %I" on %I for all using (is_admin()) with check (is_admin());',
      t, t);
  end loop;
end$$;

-- self-read on profiles
drop policy if exists "self read profile" on profiles;
create policy "self read profile" on profiles
  for select using (id = auth.uid());
