-- Run this before accepting registrations with a selected website theme.
alter table public.studio_payment_orders
  add column if not exists industry text check (industry in ('wedding', 'concept'));
alter table public.studio_payment_orders
  add column if not exists address text;
alter table public.profiles
  add column if not exists address text;
