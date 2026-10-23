-- Only the verified-admin API can change the singleton ordering control.
create table public.shop_control (
  id smallint primary key default 1 check (id = 1),
  mode text not null default 'auto' check (mode in ('auto', 'open', 'closed')),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.admin_users(user_id) on delete set null
);
create table public.shop_control_audit (
  id bigint generated always as identity primary key,
  previous_mode text,
  mode text not null,
  changed_by uuid references public.admin_users(user_id) on delete set null,
  changed_at timestamptz not null default now()
);
alter table public.shop_control enable row level security;
alter table public.shop_control_audit enable row level security;
revoke all on public.shop_control, public.shop_control_audit from public, anon, authenticated;
grant select, update on public.shop_control to service_role;
grant select, insert on public.shop_control_audit to service_role;
grant usage on sequence public.shop_control_audit_id_seq to service_role;

create function public.record_shop_control_change() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if new.mode is distinct from old.mode then
    insert into public.shop_control_audit(previous_mode, mode, changed_by)
    values (old.mode, new.mode, new.updated_by);
  end if;
  return new;
end;
$$;
revoke all on function public.record_shop_control_change() from public, anon, authenticated;
create trigger shop_control_audit_trigger after update on public.shop_control
for each row execute function public.record_shop_control_change();
-- Preserve the current schedule until an admin explicitly changes it.
insert into public.shop_control (id, mode) values (1, 'auto');
