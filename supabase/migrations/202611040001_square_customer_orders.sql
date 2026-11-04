-- Keep Square checkout history separate from legacy Supabase orders and points triggers.
-- Apply before deploying code. Only the authenticated owner can read a row.
create table if not exists public.customer_square_orders (
  square_order_id text primary key,
  customer_id uuid not null references public.customers(id) on delete cascade,
  order_id text not null,
  payment_id text not null,
  status text not null check (status in ('received', 'preparing', 'ready', 'completed', 'cancelled')),
  submitted_at timestamptz not null,
  snapshot jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists customer_square_orders_owner_date_idx
  on public.customer_square_orders(customer_id, submitted_at desc);

alter table public.customer_square_orders enable row level security;
revoke all on table public.customer_square_orders from anon, authenticated;
grant select on table public.customer_square_orders to authenticated;

drop policy if exists customer_square_orders_select_own on public.customer_square_orders;
create policy customer_square_orders_select_own
  on public.customer_square_orders for select to authenticated
  using (customer_id = (select auth.uid()));

-- Updates/inserts are intentionally service-role only. Customer payment state
-- is never writable from a browser, including by the row owner.
