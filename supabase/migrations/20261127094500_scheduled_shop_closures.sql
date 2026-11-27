-- Apply before deploying the scheduled shop closure application code.
alter table public.shop_control add column closures jsonb not null default '[]'::jsonb
  check (jsonb_typeof(closures) = 'array' and jsonb_array_length(closures) <= 100);
alter table public.shop_control_audit add column previous_closures jsonb, add column closures jsonb;
create or replace function public.record_shop_control_change() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if (new.mode, new.opens_at, new.closes_at, new.closures)
     is distinct from (old.mode, old.opens_at, old.closes_at, old.closures) then
    insert into public.shop_control_audit (
      previous_mode, mode, previous_opens_at, previous_closes_at,
      opens_at, closes_at, previous_closures, closures, changed_by
    ) values (
      old.mode, new.mode, old.opens_at, old.closes_at,
      new.opens_at, new.closes_at, old.closures, new.closures, new.updated_by
    );
  end if;
  return new;
end;
$$;
