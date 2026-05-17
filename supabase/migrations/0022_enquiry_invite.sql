-- VIP WATCH — attribute enquiries to the invite that brought the visitor in.
-- The contact-form server action reads the visitor's `vipw_session` cookie
-- and stamps the matching invite_id onto the enquiry row.

alter table enquiries
  add column if not exists invite_id uuid references invites(id) on delete set null;

create index if not exists enquiries_invite_idx on enquiries(invite_id);
