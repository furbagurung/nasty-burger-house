-- Extend the existing singleton shop control with configurable daily Sydney hours.
-- Text HH:MM preserves exact precision across PostgREST and browser time inputs.
alter table public.shop_control
  add column opens_at text not null default '11:00',
  add column closes_at text not null default '21:45';

alter table public.shop_control
  add constraint shop_control_open_clock_check check (opens_at ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  add constraint shop_control_close_clock_check check (closes_at ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  add constraint shop_control_hours_order_check check (opens_at < closes_at);

alter table public.shop_control_audit
  add column previous_opens_at text,
  add column previous_closes_at text,
  add column opens_at text,
  add column closes_at text;

-- Audit schedule edits as well as manual mode changes without changing grants/RLS.
create or replace function public.record_shop_control_change() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if (new.mode, new.opens_at, new.closes_at)
     is distinct from (old.mode, old.opens_at, old.closes_at) then
    insert into public.shop_control_audit (
      previous_mode, mode, previous_opens_at, previous_closes_at,
      opens_at, closes_at, changed_by
    ) values (
      old.mode, new.mode, old.opens_at, old.closes_at,
      new.opens_at, new.closes_at, new.updated_by
    );
  end if;
  return new;
end;
$$;
