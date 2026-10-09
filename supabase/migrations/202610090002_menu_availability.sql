-- Nasty Burger House: live item availability only. No price/product editing.
-- Apply before switching items sold out in /admin/menu.
create table if not exists public.menu_availability (
  item_id text primary key check (char_length(item_id) between 1 and 100),
  is_sold_out boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.admin_users(user_id) on delete set null
);

create table if not exists public.menu_availability_audit (
  id bigint generated always as identity primary key,
  item_id text not null,
  is_sold_out boolean not null,
  changed_by uuid references public.admin_users(user_id) on delete set null,
  changed_at timestamptz not null default now()
);

create index if not exists menu_availability_audit_item_idx
  on public.menu_availability_audit(item_id, changed_at desc);

-- Public availability is served through our server route. Database service
-- credentials never reach the browser. Only verified admins can write.
alter table public.menu_availability enable row level security;
alter table public.menu_availability_audit enable row level security;
revoke all on table public.menu_availability from public, anon, authenticated;
revoke all on table public.menu_availability_audit from public, anon, authenticated;
grant select, insert, update on public.menu_availability to service_role;
grant select, insert on public.menu_availability_audit to service_role;

create or replace function public.record_menu_availability_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.menu_availability_audit(item_id, is_sold_out, changed_by)
    values (new.item_id, new.is_sold_out, new.updated_by);
  elsif new.is_sold_out is distinct from old.is_sold_out then
    insert into public.menu_availability_audit(item_id, is_sold_out, changed_by)
    values (new.item_id, new.is_sold_out, new.updated_by);
  end if;
  return new;
end;
$$;

revoke all on function public.record_menu_availability_change() from public, anon, authenticated;
drop trigger if exists menu_availability_audit_trigger on public.menu_availability;
create trigger menu_availability_audit_trigger
after insert or update on public.menu_availability
for each row execute function public.record_menu_availability_change();
