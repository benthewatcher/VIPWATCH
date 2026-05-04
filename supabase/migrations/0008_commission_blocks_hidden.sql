-- VIP WATCH — add hidden flag to commission_blocks for soft-hide without delete.

alter table commission_blocks
  add column if not exists hidden boolean not null default false;

create index if not exists commission_blocks_visible_idx
  on commission_blocks(commission_id, position)
  where hidden = false;
