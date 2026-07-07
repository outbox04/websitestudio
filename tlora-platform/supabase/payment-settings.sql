-- Run this file in Supabase SQL Editor before using the payment settings dashboard.
create table if not exists public.payment_settings (
  id smallint primary key default 1 check (id = 1),
  bank_bin text not null,
  bank_name text not null,
  account_number text not null,
  account_name text not null,
  updated_at timestamptz not null default now()
);

alter table public.payment_settings enable row level security;

drop policy if exists "Only admins can manage payment settings" on public.payment_settings;
create policy "Only admins can manage payment settings"
on public.payment_settings
for all
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop trigger if exists set_payment_settings_updated_at on public.payment_settings;
create trigger set_payment_settings_updated_at
before update on public.payment_settings
for each row execute function public.set_updated_at();
