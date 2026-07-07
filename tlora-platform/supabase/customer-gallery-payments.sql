-- Run in Supabase SQL Editor. Adds payment state per customer gallery.
alter table public.customer_galleries
  add column if not exists total_cost_vnd integer not null default 0 check (total_cost_vnd >= 0),
  add column if not exists deposit_paid_vnd integer not null default 0 check (deposit_paid_vnd >= 0),
  add column if not exists payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'pending', 'paid')),
  add column if not exists payment_order_id text unique,
  add column if not exists paid_at timestamptz;

create index if not exists customer_galleries_payment_order_id_idx
on public.customer_galleries (payment_order_id)
where payment_order_id is not null;
