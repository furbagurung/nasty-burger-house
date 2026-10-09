-- Admin-only catalogue drafts. This does NOT change the public menu or
-- Square checkout prices. Apply separately before using Menu Management.
create table if not exists public.menu_item_drafts (
  item_id text primary key check (char_length(item_id) between 1 and 100),
  name text not null check (char_length(name) between 2 and 100),
  description text not null check (char_length(description) between 1 and 1500),
  price_cents integer not null check (price_cents between 0 and 200000),
  image_path text check (image_path is null or char_length(image_path) <= 255),
  featured boolean not null default false,
  is_available boolean not null default true,
  version integer not null default 1 check (version >= 1),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.admin_users(user_id) on delete set null
);

create table if not exists public.menu_item_draft_history (
  id bigint generated always as identity primary key,
  item_id text not null,
  changed_at timestamptz not null default now(),
  changed_by uuid references public.admin_users(user_id) on delete set null,
  before_state jsonb,
  after_state jsonb not null
);

create index if not exists menu_item_draft_history_item_created_idx
  on public.menu_item_draft_history(item_id, changed_at desc);

-- The API uses a verified admin session and server-side service role.
-- Prevent public Data API reads or writes, including by signed-in customers.
alter table public.menu_item_drafts enable row level security;
alter table public.menu_item_draft_history enable row level security;
revoke all on table public.menu_item_drafts from public, anon, authenticated;
revoke all on table public.menu_item_draft_history from public, anon, authenticated;
grant select, insert, update on table public.menu_item_drafts to service_role;
grant select, insert on table public.menu_item_draft_history to service_role;

create or replace function public.record_menu_item_draft_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.menu_item_draft_history
    (item_id, changed_by, before_state, after_state)
  values
    (new.item_id, new.updated_by,
     case when tg_op = 'UPDATE' then to_jsonb(old) else null end,
     to_jsonb(new));
  return new;
end;
$$;

revoke all on function public.record_menu_item_draft_change() from public, anon, authenticated;
drop trigger if exists record_menu_draft_change on public.menu_item_drafts;
create trigger record_menu_draft_change
after insert or update on public.menu_item_drafts
for each row execute function public.record_menu_item_draft_change();
