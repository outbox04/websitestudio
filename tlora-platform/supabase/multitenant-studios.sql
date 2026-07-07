-- TLORA Studio Platform: multi-tenant SaaS foundation
-- Run ONCE in Supabase SQL Editor, after schema.sql, license-system.sql,
-- studio-payment-orders.sql and the existing ALTER statements for payment orders.
-- This migration preserves existing rows. New records must always include studio_id.

create extension if not exists pgcrypto;

-- 1) A studio is the tenant boundary. One Vercel wildcard subdomain maps to one row here.
create table if not exists public.studios (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$'),
  display_name text not null,
  primary_domain text unique,
  plan text not null default 'basic' check (plan in ('basic', 'medium', 'premium')),
  status text not null default 'pending' check (status in ('pending', 'active', 'suspended', 'cancelled')),
  owner_user_id uuid references auth.users(id) on delete set null,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.studio_members (
  studio_id uuid not null references public.studios(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'staff' check (role in ('owner', 'admin', 'staff')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (studio_id, user_id)
);

-- 2) Preserve registration data and connect payments, auth and licenses.
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists is_platform_admin boolean not null default false;
alter table public.profiles add column if not exists default_studio_id uuid references public.studios(id) on delete set null;
alter table public.studio_payment_orders add column if not exists representative_name text;
alter table public.studio_payment_orders add column if not exists email text;
alter table public.studio_payment_orders add column if not exists phone text;
alter table public.studio_payment_orders add column if not exists username text;
alter table public.studio_payment_orders add column if not exists domain text;
alter table public.studio_payment_orders add column if not exists license_key text;
alter table public.studio_payment_orders add column if not exists activation_email_sent_at timestamptz;
alter table public.studio_payment_orders add column if not exists studio_id uuid references public.studios(id) on delete set null;
alter table public.studio_payment_orders add column if not exists owner_user_id uuid references auth.users(id) on delete set null;
alter table public.studio_payment_orders add column if not exists license_id uuid references public.licenses(id) on delete set null;
alter table public.licenses add column if not exists studio_id uuid references public.studios(id) on delete set null;

-- 3) Tenant ownership for operational data. Existing data stays unassigned until you
-- decide which Studio owns it; it remains accessible only to platform admins after RLS below.
alter table public.albums add column if not exists studio_id uuid references public.studios(id) on delete cascade;
alter table public.customer_galleries add column if not exists studio_id uuid references public.studios(id) on delete cascade;
alter table public.ai_requests add column if not exists studio_id uuid references public.studios(id) on delete cascade;
alter table public.wallet_transactions add column if not exists studio_id uuid references public.studios(id) on delete cascade;

create unique index if not exists profiles_username_unique_idx
  on public.profiles (lower(username)) where username is not null;
create index if not exists studios_owner_user_id_idx on public.studios(owner_user_id);
create index if not exists studio_members_user_id_idx on public.studio_members(user_id);
create index if not exists studio_payment_orders_studio_id_idx on public.studio_payment_orders(studio_id);
create index if not exists studio_payment_orders_owner_user_id_idx on public.studio_payment_orders(owner_user_id);
create index if not exists licenses_studio_id_idx on public.licenses(studio_id);
create index if not exists albums_studio_id_idx on public.albums(studio_id);
create index if not exists customer_galleries_studio_id_idx on public.customer_galleries(studio_id);
create index if not exists ai_requests_studio_id_idx on public.ai_requests(studio_id);
create index if not exists wallet_transactions_studio_id_idx on public.wallet_transactions(studio_id);

-- 4) Updated-at support.
drop trigger if exists set_studios_updated_at on public.studios;
create trigger set_studios_updated_at before update on public.studios
for each row execute function public.set_updated_at();
drop trigger if exists set_studio_members_updated_at on public.studio_members;
create trigger set_studio_members_updated_at before update on public.studio_members
for each row execute function public.set_updated_at();

-- 5) Reusable RLS predicates. SECURITY DEFINER avoids recursive policy checks.
create or replace function public.is_platform_operator()
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_active = true and is_platform_admin = true
  );
$$;

create or replace function public.is_studio_member(target_studio_id uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select public.is_platform_operator() or exists (
    select 1 from public.studio_members
    where studio_id = target_studio_id and user_id = auth.uid() and is_active = true
  );
$$;

create or replace function public.can_manage_studio(target_studio_id uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select public.is_platform_operator() or exists (
    select 1 from public.studio_members
    where studio_id = target_studio_id and user_id = auth.uid()
      and is_active = true and role in ('owner', 'admin')
  );
$$;

-- 6) RLS: a signed-in studio only reads/writes its own tenant data.
alter table public.studios enable row level security;
alter table public.studio_members enable row level security;

drop policy if exists "Studio members can read studios" on public.studios;
create policy "Studio members can read studios" on public.studios for select
to authenticated using (public.is_studio_member(id));
drop policy if exists "Studio managers can update studios" on public.studios;
create policy "Studio managers can update studios" on public.studios for update
to authenticated using (public.can_manage_studio(id)) with check (public.can_manage_studio(id));

drop policy if exists "Members can read own studio members" on public.studio_members;
create policy "Members can read own studio members" on public.studio_members for select
to authenticated using (public.is_studio_member(studio_id));
drop policy if exists "Managers can manage studio members" on public.studio_members;
create policy "Managers can manage studio members" on public.studio_members for all
to authenticated using (public.can_manage_studio(studio_id)) with check (public.can_manage_studio(studio_id));

drop policy if exists "Studio members can read orders" on public.studio_payment_orders;
create policy "Studio members can read orders" on public.studio_payment_orders for select
to authenticated using (public.is_studio_member(studio_id));
drop policy if exists "Studio members can read licenses" on public.licenses;
create policy "Studio members can read licenses" on public.licenses for select
to authenticated using (public.is_studio_member(studio_id) or user_id = auth.uid());

drop policy if exists "Studio members can manage albums" on public.albums;
create policy "Studio members can manage albums" on public.albums for all
to authenticated using (public.is_studio_member(studio_id)) with check (public.is_studio_member(studio_id));
drop policy if exists "Studio members can manage galleries" on public.customer_galleries;
create policy "Studio members can manage galleries" on public.customer_galleries for all
to authenticated using (public.is_studio_member(studio_id)) with check (public.is_studio_member(studio_id));
drop policy if exists "Studio members can manage AI requests" on public.ai_requests;
create policy "Studio members can manage AI requests" on public.ai_requests for all
to authenticated using (public.is_studio_member(studio_id)) with check (public.is_studio_member(studio_id));
drop policy if exists "Studio members can read wallet transactions" on public.wallet_transactions;
create policy "Studio members can read wallet transactions" on public.wallet_transactions for select
to authenticated using (public.is_studio_member(studio_id));

-- The website fetches public gallery pages through server routes using the service key.
-- Remove broad anon read access so one studio cannot enumerate another studio's galleries.
drop policy if exists "Public can read customer galleries" on public.customer_galleries;
drop policy if exists "Public can read customer gallery photos" on public.customer_gallery_photos;

-- 7) Use this only for legacy data after you have created its target Studio:
-- update public.customer_galleries set studio_id = '<studio-uuid>' where studio_id is null;
-- update public.albums set studio_id = '<studio-uuid>' where studio_id is null;
-- update public.licenses set studio_id = '<studio-uuid>' where studio_id is null;
