-- Run in Supabase SQL Editor before deploying the Studio checkout update.
create table if not exists public.studio_payment_orders (
  id uuid primary key default gen_random_uuid(),
  order_id text not null unique,
  studio_name text not null,
  plan text not null check (plan in ('basic', 'medium', 'premium')),
  amount_vnd integer not null check (amount_vnd > 0),
  status text not null default 'pending' check (status in ('pending', 'paid', 'cancelled')),
  sepay_order_id text,
  transaction_id text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.studio_payment_orders enable row level security;
create index if not exists studio_payment_orders_order_id_idx on public.studio_payment_orders(order_id);
