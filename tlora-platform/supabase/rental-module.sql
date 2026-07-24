-- Independent TLORA Rental module. Disable at application level with NEXT_PUBLIC_RENTAL_ENABLED=false.
create table if not exists public.rental_orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null unique,
  status text not null default 'pending' check (status in ('pending','paid','ready','renting','returned','cancelled')),
  customer_name text not null,
  phone text not null,
  pickup_at timestamptz not null,
  duration_days numeric(3,1) not null check (duration_days >= .5 and duration_days <= 5.5),
  items jsonb not null default '[]'::jsonb,
  subtotal_vnd bigint not null default 0,
  discount_vnd bigint not null default 0,
  total_vnd bigint not null default 0,
  deposit_vnd bigint not null default 0,
  paid_deposit_vnd bigint not null default 0,
  remaining_vnd bigint not null default 0,
  promo_code text,
  transaction_id text,
  original_costume_count integer not null default 1,
  removed_costume_count integer not null default 0,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.rental_order_edits (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.rental_orders(id) on delete cascade,
  before_items jsonb not null,
  after_items jsonb not null,
  before_total_vnd bigint not null,
  after_total_vnd bigint not null,
  created_at timestamptz not null default now()
);
create index if not exists rental_orders_order_code_idx on public.rental_orders(order_code);
create index if not exists rental_orders_status_idx on public.rental_orders(status);
alter table public.rental_orders enable row level security;
alter table public.rental_order_edits enable row level security;

-- Staff-managed availability per product and size. Public clients only receive
-- the simplified boolean state through the rental availability API.
create table if not exists public.rental_inventory (
  product_id text not null,
  size text not null,
  is_available boolean not null default true,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (product_id, size)
);
create index if not exists rental_inventory_updated_at_idx on public.rental_inventory(updated_at desc);
alter table public.rental_inventory enable row level security;
