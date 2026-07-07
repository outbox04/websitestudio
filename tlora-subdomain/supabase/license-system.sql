create extension if not exists pgcrypto;

create table if not exists public.licenses (
  id uuid primary key default gen_random_uuid(),
  license_key text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'suspended', 'expired')),
  plan text not null default 'standard',
  max_devices integer not null default 1 check (max_devices > 0),
  duration_days integer not null default 30 check (duration_days > 0),
  activated_at timestamptz,
  expires_at timestamptz,
  last_renewed_at timestamptz,
  renewal_count integer not null default 0 check (renewal_count >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.licenses add column if not exists duration_days integer not null default 30 check (duration_days > 0);
alter table public.licenses add column if not exists activated_at timestamptz;
alter table public.licenses add column if not exists last_renewed_at timestamptz;
alter table public.licenses add column if not exists renewal_count integer not null default 0 check (renewal_count >= 0);

create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  license_id uuid not null references public.licenses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id text not null,
  device_name text,
  platform text,
  status text not null default 'active' check (status in ('active', 'revoked')),
  activated_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (license_id, device_id)
);

create table if not exists public.license_renewal_orders (
  id uuid primary key default gen_random_uuid(),
  order_id text not null unique,
  license_id uuid not null references public.licenses(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  amount_vnd integer not null check (amount_vnd > 0),
  duration_days integer not null check (duration_days > 0),
  status text not null default 'pending' check (status in ('pending', 'paid', 'cancelled')),
  transaction_id text,
  paid_at timestamptz,
  previous_expires_at timestamptz,
  renewed_expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists licenses_user_id_idx on public.licenses(user_id);
create index if not exists licenses_status_idx on public.licenses(status);
create index if not exists licenses_expires_at_idx on public.licenses(expires_at);
create index if not exists devices_user_device_idx on public.devices(user_id, device_id);
create index if not exists devices_license_id_idx on public.devices(license_id);
create index if not exists license_renewal_orders_order_id_idx on public.license_renewal_orders(order_id);
create index if not exists license_renewal_orders_license_id_idx on public.license_renewal_orders(license_id);

alter table public.licenses enable row level security;
alter table public.devices enable row level security;
alter table public.license_renewal_orders enable row level security;

drop policy if exists "Users can read own licenses" on public.licenses;
create policy "Users can read own licenses"
on public.licenses for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can read own devices" on public.devices;
create policy "Users can read own devices"
on public.devices for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can read own license renewal orders" on public.license_renewal_orders;
create policy "Users can read own license renewal orders"
on public.license_renewal_orders for select
to authenticated
using (user_id = auth.uid());
