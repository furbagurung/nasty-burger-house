-- Nasty Burger House production customer platform for Supabase.
-- Run with Supabase migrations or paste into the Supabase SQL editor on a new project.

create extension if not exists pgcrypto;

create table if not exists public.customers (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  email text not null,
  phone text not null default '',
  birthday date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists customers_email_lower_uidx
  on public.customers (lower(email));

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id text primary key,
  request_id text not null unique,
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  status text not null default 'received'
    check (status in ('received','preparing','ready','completed','cancelled')),
  fulfilment_type text not null default 'pickup' check (fulfilment_type = 'pickup'),
  pickup_label text not null,
  payment_method text not null default 'pay_at_pickup',
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid','paid','refunded','void')),
  subtotal_cents integer not null check (subtotal_cents >= 0),
  notes text not null default '',
  admin_notification_status text not null default 'pending'
    check (admin_notification_status in ('pending','sent','failed','not-configured')),
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_customer_id_submitted_at_idx
  on public.orders(customer_id, submitted_at desc);
create index if not exists orders_status_submitted_at_idx
  on public.orders(status, submitted_at desc);

create table if not exists public.order_lines (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders(id) on delete cascade,
  item_id text not null,
  item_name text not null,
  image_path text,
  quantity integer not null check (quantity between 1 and 20),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  line_total_cents integer not null check (line_total_cents >= 0),
  configuration jsonb not null default '{}'::jsonb
);

create index if not exists order_lines_order_id_idx
  on public.order_lines(order_id);

create table if not exists public.drip_ledger (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  order_id text references public.orders(id) on delete set null,
  entry_type text not null
    check (entry_type in ('signup','order','redeem','adjustment')),
  points integer not null,
  points_status text not null default 'available'
    check (points_status in ('pending','available','void')),
  description text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists drip_signup_once_per_customer_idx
  on public.drip_ledger(customer_id)
  where entry_type = 'signup';

create unique index if not exists drip_order_earn_once_idx
  on public.drip_ledger(customer_id, order_id)
  where entry_type = 'order';

create index if not exists drip_ledger_customer_created_at_idx
  on public.drip_ledger(customer_id, created_at desc);

create table if not exists public.reward_redemptions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  points_spent integer not null check (points_spent > 0),
  reward_code text not null unique,
  reward_type text not null,
  status text not null default 'issued'
    check (status in ('issued','used','cancelled','expired')),
  issued_at timestamptz not null default now(),
  used_at timestamptz
);

create index if not exists reward_redemptions_customer_idx
  on public.reward_redemptions(customer_id, issued_at desc);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  order_id text not null references public.orders(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  message text not null default '',
  status text not null default 'published'
    check (status in ('published','hidden','flagged')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(customer_id, order_id)
);

create index if not exists reviews_created_at_idx
  on public.reviews(created_at desc);

-- Generic updated_at trigger.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Admin membership is intentionally stored in the database, not in editable
-- user metadata. This helper is safe to use inside RLS policies.
create or replace function public.is_admin(check_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists(
    select 1 from public.admin_users where user_id = check_user
  );
$$;

revoke all on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to authenticated;

-- Create the public customer profile automatically when Supabase Auth creates
-- a user. No password or auth credential is copied into public tables.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  birthday_value date;
begin
  birthday_value := case
    when coalesce(new.raw_user_meta_data ->> 'birthday', '') ~ '^\d{4}-\d{2}-\d{2}$'
      then (new.raw_user_meta_data ->> 'birthday')::date
    else null
  end;

  insert into public.customers (id, name, email, phone, birthday)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), split_part(coalesce(new.email, ''), '@', 1)),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    birthday_value
  )
  on conflict (id) do update set
    email = excluded.email,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.sync_auth_user_email()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.email is distinct from old.email then
    update public.customers
      set email = coalesce(new.email, email), updated_at = now()
      where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
after update of email on auth.users
for each row execute function public.sync_auth_user_email();

-- 500 welcome points are granted once per real auth user.
create or replace function public.seed_signup_drip_points()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.drip_ledger (
    customer_id,
    entry_type,
    points,
    points_status,
    description
  )
  values (
    new.id,
    'signup',
    500,
    'available',
    'Welcome to Drip Points'
  )
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_customer_created_drip_bonus on public.customers;
create trigger on_customer_created_drip_bonus
after insert on public.customers
for each row execute function public.seed_signup_drip_points();

-- Order earning rule: 10 points per whole AUD spent. Points are pending while
-- an order is active, become available when completed, and are voided if the
-- order is cancelled. This prevents cancelled orders from farming rewards.
create or replace function public.sync_order_drip_points()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  earned_points integer;
  ledger_status text;
begin
  if new.customer_id is null then
    return new;
  end if;

  earned_points := floor(new.subtotal_cents / 10.0)::integer;
  ledger_status := case
    when new.status = 'completed' then 'available'
    when new.status = 'cancelled' then 'void'
    else 'pending'
  end;

  insert into public.drip_ledger (
    customer_id,
    order_id,
    entry_type,
    points,
    points_status,
    description
  )
  values (
    new.customer_id,
    new.id,
    'order',
    earned_points,
    ledger_status,
    'Drip Points from order ' || new.id
  )
  on conflict (customer_id, order_id) where entry_type = 'order'
  do update set
    points = excluded.points,
    points_status = excluded.points_status,
    description = excluded.description,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_order_drip_points on public.orders;
create trigger on_order_drip_points
after insert or update of status, subtotal_cents, customer_id on public.orders
for each row execute function public.sync_order_drip_points();

-- updated_at triggers

drop trigger if exists customers_updated_at on public.customers;
create trigger customers_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

drop trigger if exists reviews_updated_at on public.reviews;
create trigger reviews_updated_at
before update on public.reviews
for each row execute function public.set_updated_at();

-- RLS and minimal grants.
alter table public.customers enable row level security;
alter table public.admin_users enable row level security;
alter table public.orders enable row level security;
alter table public.order_lines enable row level security;
alter table public.drip_ledger enable row level security;
alter table public.reward_redemptions enable row level security;
alter table public.reviews enable row level security;

revoke all on table public.customers from anon, authenticated;
revoke all on table public.admin_users from anon, authenticated;
revoke all on table public.orders from anon, authenticated;
revoke all on table public.order_lines from anon, authenticated;
revoke all on table public.drip_ledger from anon, authenticated;
revoke all on table public.reward_redemptions from anon, authenticated;
revoke all on table public.reviews from anon, authenticated;

grant select, update on table public.customers to authenticated;
grant select on table public.admin_users to authenticated;
grant select on table public.orders to authenticated;
grant select on table public.order_lines to authenticated;
grant select on table public.drip_ledger to authenticated;
grant select on table public.reward_redemptions to authenticated;
grant select, insert, update on table public.reviews to authenticated;

-- Customers can only access their own profile.
drop policy if exists customers_select_self on public.customers;
create policy customers_select_self
on public.customers for select to authenticated
using ((select auth.uid()) = id);

drop policy if exists customers_update_self on public.customers;
create policy customers_update_self
on public.customers for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- Users can see whether their own account is an admin. The is_admin() helper
-- performs all broader admin checks under SECURITY DEFINER.
drop policy if exists admin_users_select_self on public.admin_users;
create policy admin_users_select_self
on public.admin_users for select to authenticated
using ((select auth.uid()) = user_id);

-- Orders and lines belong to the authenticated customer; admins can read all.
drop policy if exists orders_select_owner_or_admin on public.orders;
create policy orders_select_owner_or_admin
on public.orders for select to authenticated
using (
  (select auth.uid()) = customer_id
  or public.is_admin((select auth.uid()))
);

drop policy if exists order_lines_select_owner_or_admin on public.order_lines;
create policy order_lines_select_owner_or_admin
on public.order_lines for select to authenticated
using (
  public.is_admin((select auth.uid()))
  or exists (
    select 1 from public.orders o
    where o.id = order_id and o.customer_id = (select auth.uid())
  )
);

-- Loyalty activity is private to the member and admins.
drop policy if exists drip_ledger_select_owner_or_admin on public.drip_ledger;
create policy drip_ledger_select_owner_or_admin
on public.drip_ledger for select to authenticated
using (
  (select auth.uid()) = customer_id
  or public.is_admin((select auth.uid()))
);

drop policy if exists reward_redemptions_select_owner_or_admin on public.reward_redemptions;
create policy reward_redemptions_select_owner_or_admin
on public.reward_redemptions for select to authenticated
using (
  (select auth.uid()) = customer_id
  or public.is_admin((select auth.uid()))
);

-- Reviews are private account data in this phase. Customers can only review a
-- completed order that belongs to them. Admin moderation can use the secret key.
drop policy if exists reviews_select_owner_or_admin on public.reviews;
create policy reviews_select_owner_or_admin
on public.reviews for select to authenticated
using (
  (select auth.uid()) = customer_id
  or public.is_admin((select auth.uid()))
);

drop policy if exists reviews_insert_completed_order on public.reviews;
create policy reviews_insert_completed_order
on public.reviews for insert to authenticated
with check (
  (select auth.uid()) = customer_id
  and exists (
    select 1 from public.orders o
    where o.id = order_id
      and o.customer_id = (select auth.uid())
      and o.status = 'completed'
  )
);

drop policy if exists reviews_update_self on public.reviews;
create policy reviews_update_self
on public.reviews for update to authenticated
using ((select auth.uid()) = customer_id)
with check (
  (select auth.uid()) = customer_id
  and exists (
    select 1 from public.orders o
    where o.id = order_id
      and o.customer_id = (select auth.uid())
      and o.status = 'completed'
  )
);

-- After creating the owner's auth account, promote it manually once:
-- insert into public.admin_users(user_id)
-- select id from auth.users where lower(email) = lower('owner@example.com')
-- on conflict do nothing;
