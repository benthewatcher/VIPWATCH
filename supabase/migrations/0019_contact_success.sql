-- VIP WATCH — admin-editable contact success message.
-- Adds optional columns so /admin/pages/contact can override the post-submit
-- thank-you screen on /[locale]/contact. All nullable; blank falls back to
-- the hardcoded defaults in the component.

alter table pages
  add column if not exists success_title_en text,
  add column if not exists success_title_fr text,
  add column if not exists success_body_en text,
  add column if not exists success_body_fr text;
