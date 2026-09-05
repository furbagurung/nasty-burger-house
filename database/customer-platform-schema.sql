-- Nasty Burger House customer platform schema (PostgreSQL)
-- Authentication credentials should be owned by the selected auth provider.
-- Do not store raw passwords in these tables.

create extension if not exists pgcrypto;

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  auth_subject text unique,
  name text not null,
  email text not null unique,
  phone text not null,
  birthday date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists orders (
  id text primary key,
  request_id text not null unique,
  customer_id uuid references customers(id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  status text not null default 'received' check (status in ('received','preparing','ready','completed','cancelled')),
  fulfilment_type text not null default 'pickup' check (fulfilment_type = 'pickup'),
  pickup_label text not null,
  payment_method text not null default 'pay_at_pickup',
  payment_status text not null default 'unpaid',
  subtotal_cents integer not null check (subtotal_cents >= 0),
  notes text not null default '',
  admin_notification_status text not null default 'pending' check (admin_notification_status in ('pending','sent','failed','not-configured')),
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_customer_id_submitted_at_idx
  on orders(customer_id, submitted_at desc);

create table if not exists order_lines (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references orders(id) on delete cascade,
  item_id text not null,
  item_name text not null,
  image_path text,
  quantity integer not null check (quantity between 1 and 20),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  line_total_cents integer not null check (line_total_cents >= 0),
  configuration jsonb not null default '{}'::jsonb
);

create index if not exists order_lines_order_id_idx on order_lines(order_id);

create table if not exists drip_ledger (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  order_id text references orders(id) on delete set null,
  entry_type text not null check (entry_type in ('signup','order','redeem','adjustment')),
  points integer not null,
  description text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists drip_signup_once_per_customer_idx
  on drip_ledger(customer_id)
  where entry_type = 'signup';

create unique index if not exists drip_order_earn_once_idx
  on drip_ledger(customer_id, order_id)
  where entry_type = 'order';

create index if not exists drip_ledger_customer_created_at_idx
  on drip_ledger(customer_id, created_at desc);

create table if not exists reward_redemptions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  points_spent integer not null check (points_spent > 0),
  reward_code text not null unique,
  reward_type text not null,
  status text not null default 'issued' check (status in ('issued','used','cancelled','expired')),
  issued_at timestamptz not null default now(),
  used_at timestamptz
);

create index if not exists reward_redemptions_customer_idx
  on reward_redemptions(customer_id, issued_at desc);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  order_id text not null references orders(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  message text not null default '',
  status text not null default 'published' check (status in ('published','hidden','flagged')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(customer_id, order_id)
);

create index if not exists reviews_created_at_idx on reviews(created_at desc);
