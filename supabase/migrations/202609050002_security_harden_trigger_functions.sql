create schema if not exists private;

revoke all on function public.handle_new_auth_user() from public, anon, authenticated;
revoke all on function public.sync_auth_user_email() from public, anon, authenticated;
revoke all on function public.seed_signup_drip_points() from public, anon, authenticated;
revoke all on function public.sync_order_drip_points() from public, anon, authenticated;

create or replace function private.is_admin(check_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public, private, pg_temp
as $$
  select exists(
    select 1 from public.admin_users where user_id = check_user
  );
$$;

revoke all on function private.is_admin(uuid) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_admin(uuid) to authenticated;

drop policy if exists orders_select_owner_or_admin on public.orders;
create policy orders_select_owner_or_admin
on public.orders for select to authenticated
using (
  (select auth.uid()) = customer_id
  or private.is_admin((select auth.uid()))
);

drop policy if exists order_lines_select_owner_or_admin on public.order_lines;
create policy order_lines_select_owner_or_admin
on public.order_lines for select to authenticated
using (
  private.is_admin((select auth.uid()))
  or exists (
    select 1 from public.orders o
    where o.id = order_id and o.customer_id = (select auth.uid())
  )
);

drop policy if exists drip_ledger_select_owner_or_admin on public.drip_ledger;
create policy drip_ledger_select_owner_or_admin
on public.drip_ledger for select to authenticated
using (
  (select auth.uid()) = customer_id
  or private.is_admin((select auth.uid()))
);

drop policy if exists reward_redemptions_select_owner_or_admin on public.reward_redemptions;
create policy reward_redemptions_select_owner_or_admin
on public.reward_redemptions for select to authenticated
using (
  (select auth.uid()) = customer_id
  or private.is_admin((select auth.uid()))
);

drop policy if exists reviews_select_owner_or_admin on public.reviews;
create policy reviews_select_owner_or_admin
on public.reviews for select to authenticated
using (
  (select auth.uid()) = customer_id
  or private.is_admin((select auth.uid()))
);

drop function if exists public.is_admin(uuid);
