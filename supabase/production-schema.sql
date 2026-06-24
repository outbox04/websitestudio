-- TLORA Studio Production Database Schema
-- Unified schema containing all tables, types, indexes, functions, triggers, and RLS policies
-- Run this in your Supabase SQL Editor to set up the database from scratch.

create extension if not exists pgcrypto;

-- =========================================================================
-- 1. CUSTOM TYPES & ENUMS
-- =========================================================================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('customer', 'staff', 'admin');
  end if;
  if not exists (select 1 from pg_type where typname = 'photo_status') then
    create type public.photo_status as enum ('pending_selection', 'selected', 'editing', 'completed');
  end if;
  if not exists (select 1 from pg_type where typname = 'ai_request_status') then
    create type public.ai_request_status as enum ('queued', 'processing', 'completed', 'failed');
  end if;
  if not exists (select 1 from pg_type where typname = 'gallery_photo_kind') then
    create type public.gallery_photo_kind as enum ('raw', 'edited');
  end if;
end $$;

-- =========================================================================
-- 2. CORE SAAS & TENANT TABLES
-- =========================================================================

-- Studios Table (Tenant boundary. One subdomain/domain maps to one row here)
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

-- User Profiles Table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  phone text,
  address text,
  avatar_url text,
  credit_balance_vnd integer not null default 0 check (credit_balance_vnd >= 0),
  role public.user_role not null default 'customer',
  is_active boolean not null default true,
  username text,
  is_platform_admin boolean not null default false,
  default_studio_id uuid references public.studios(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Studio Members Table (Binds users to studios)
create table if not exists public.studio_members (
  studio_id uuid not null references public.studios(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'staff' check (role in ('owner', 'admin', 'staff')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (studio_id, user_id)
);

-- =========================================================================
-- 3. LICENSING SYSTEM
-- =========================================================================

-- Software Licenses Table
create table if not exists public.licenses (
  id uuid primary key default gen_random_uuid(),
  license_key text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'suspended', 'expired')),
  plan text not null default 'standard',
  max_devices integer not null default 1 check (max_devices > 0),
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  studio_id uuid references public.studios(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Activated Devices Table
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

-- =========================================================================
-- 4. SALES, CHECKOUT & PAYMENTS
-- =========================================================================

-- Studio Subscription Payment Orders Table
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
  representative_name text,
  industry text check (industry in ('wedding', 'concept')),
  email text,
  phone text,
  address text,
  username text,
  domain text,
  license_key text,
  activation_email_sent_at timestamptz,
  studio_id uuid references public.studios(id) on delete set null,
  owner_user_id uuid references auth.users(id) on delete set null,
  license_id uuid references public.licenses(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- General Studio Payment settings (VNPAY / Bank parameters)
create table if not exists public.payment_settings (
  id smallint primary key default 1 check (id = 1),
  bank_bin text not null,
  bank_name text not null,
  account_number text not null,
  account_name text not null,
  updated_at timestamptz not null default now()
);

-- =========================================================================
-- 5. CONTENT MANAGEMENT & MARKETING (BLOG / NEWS)
-- =========================================================================

-- Studio Blog/News Posts Table
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  title text not null,
  excerpt text,
  content text,
  cover_url text,
  published boolean not null default false,
  studio_id uuid references public.studios(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Post Likes Table
create table if not exists public.post_likes (
  post_id uuid references public.posts(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- Post Comments Table
create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

-- =========================================================================
-- 6. LEGACY ALBUMS & AI CREATIVE MODULE
-- =========================================================================

-- Legacy customer albums Table
create table if not exists public.albums (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  google_drive_folder_id text not null,
  studio_id uuid references public.studios(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Album photos Table
create table if not exists public.album_photos (
  id uuid primary key default gen_random_uuid(),
  album_id uuid references public.albums(id) on delete cascade,
  drive_file_id text not null,
  name text not null,
  thumbnail_url text,
  full_url text,
  status public.photo_status not null default 'pending_selection',
  selected boolean not null default false,
  edit_note text,
  created_at timestamptz not null default now()
);

-- AI Generation Requests Table
create table if not exists public.ai_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  source_image_url text,
  outfit_preset text not null,
  background_preset text not null,
  style_preset text not null,
  prompt text not null,
  result_image_url text,
  status public.ai_request_status not null default 'queued',
  studio_id uuid references public.studios(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Wallet credit Transactions Table (AI charge and top-ups)
create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount_vnd integer not null,
  type text not null check (type in ('top_up', 'ai_concept_charge', 'refund')),
  note text,
  studio_id uuid references public.studios(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- =========================================================================
-- 7. THE SAAS MULTI-TENANT STUDIO CUSTOMER PORTAL
-- =========================================================================

-- Customer galleries Table
create table if not exists public.customer_galleries (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_name_slug text not null,
  shoot_date date not null,
  cover_url text,
  root_drive_folder_id text not null,
  raw_drive_folder_id text not null,
  edited_drive_folder_id text not null,
  root_drive_folder_url text not null,
  raw_drive_folder_url text not null,
  edited_drive_folder_url text not null,
  raw_download_enabled boolean not null default false,
  edited_download_enabled boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  studio_id uuid references public.studios(id) on delete cascade,
  total_cost_vnd integer not null default 0 check (total_cost_vnd >= 0),
  deposit_paid_vnd integer not null default 0 check (deposit_paid_vnd >= 0),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'pending', 'paid')),
  payment_order_id text unique,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Customer gallery photos Table
create table if not exists public.customer_gallery_photos (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references public.customer_galleries(id) on delete cascade,
  drive_file_id text not null,
  file_name text not null,
  thumbnail_url text,
  preview_url text,
  download_url text,
  kind public.gallery_photo_kind not null default 'raw',
  selected boolean not null default false,
  edit_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (gallery_id, drive_file_id)
);

-- Studio Google Drive connections parameters Table
create table if not exists public.studio_google_drive_connections (
  studio_id uuid primary key references public.studios(id) on delete cascade,
  google_account_email text,
  root_folder_id text not null unique,
  refresh_token_ciphertext text not null,
  token_expires_at timestamptz,
  connected_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================================
-- 8. INDEXES & CONSTRAINTS
-- =========================================================================

-- Unique indexes
create unique index if not exists customer_galleries_slug_studio_unique_idx
  on public.customer_galleries (studio_id, customer_name_slug) where studio_id is not null;
create unique index if not exists customer_galleries_slug_null_studio_unique_idx
  on public.customer_galleries (customer_name_slug) where studio_id is null;

create unique index if not exists posts_studio_slug_unique_idx
  on public.posts(studio_id, lower(slug)) where studio_id is not null;
create unique index if not exists posts_null_studio_slug_unique_idx
  on public.posts(lower(slug)) where studio_id is null;

create unique index if not exists profiles_username_unique_idx
  on public.profiles (lower(username)) where username is not null;
create unique index if not exists profiles_phone_unique_idx
  on public.profiles(phone) where phone is not null;
create unique index if not exists profiles_email_unique_idx
  on public.profiles (email) where email is not null;

create unique index if not exists studio_payment_orders_username_unique_idx
  on public.studio_payment_orders(lower(username)) where username is not null;
create unique index if not exists studio_payment_orders_email_unique_idx
  on public.studio_payment_orders(lower(email)) where email is not null;
create unique index if not exists studio_payment_orders_basic_domain_unique_idx
  on public.studio_payment_orders(lower(domain)) where domain is not null and plan = 'basic' and status in ('pending', 'paid');

-- Operational indexes
create index if not exists studios_owner_user_id_idx on public.studios(owner_user_id);
create index if not exists studio_members_user_id_idx on public.studio_members(user_id);
create index if not exists studio_payment_orders_studio_id_idx on public.studio_payment_orders(studio_id);
create index if not exists studio_payment_orders_owner_user_id_idx on public.studio_payment_orders(owner_user_id);
create index if not exists licenses_studio_id_idx on public.licenses(studio_id);
create index if not exists licenses_user_id_idx on public.licenses(user_id);
create index if not exists licenses_status_idx on public.licenses(status);
create index if not exists devices_user_device_idx on public.devices(user_id, device_id);
create index if not exists devices_license_id_idx on public.devices(license_id);
create index if not exists albums_studio_id_idx on public.albums(studio_id);
create index if not exists customer_galleries_studio_id_idx on public.customer_galleries(studio_id);
create index if not exists customer_galleries_payment_order_id_idx on public.customer_galleries (payment_order_id) where payment_order_id is not null;
create index if not exists ai_requests_studio_id_idx on public.ai_requests(studio_id);
create index if not exists wallet_transactions_studio_id_idx on public.wallet_transactions(studio_id);
create index if not exists posts_studio_id_idx on public.posts(studio_id);
create index if not exists studio_payment_orders_order_id_idx on public.studio_payment_orders(order_id);

-- =========================================================================
-- 9. GENERAL FUNCTIONS & TRIGGER IMPLEMENTATIONS
-- =========================================================================

-- Updated-at helper trigger function
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Trigger configurations
drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_customer_galleries_updated_at on public.customer_galleries;
create trigger set_customer_galleries_updated_at before update on public.customer_galleries
for each row execute function public.set_updated_at();

drop trigger if exists set_customer_gallery_photos_updated_at on public.customer_gallery_photos;
create trigger set_customer_gallery_photos_updated_at before update on public.customer_gallery_photos
for each row execute function public.set_updated_at();

drop trigger if exists set_studios_updated_at on public.studios;
create trigger set_studios_updated_at before update on public.studios
for each row execute function public.set_updated_at();

drop trigger if exists set_studio_members_updated_at on public.studio_members;
create trigger set_studio_members_updated_at before update on public.studio_members
for each row execute function public.set_updated_at();

drop trigger if exists set_payment_settings_updated_at on public.payment_settings;
create trigger set_payment_settings_updated_at before update on public.payment_settings
for each row execute function public.set_updated_at();

drop trigger if exists set_studio_google_drive_connections_updated_at on public.studio_google_drive_connections;
create trigger set_studio_google_drive_connections_updated_at before update on public.studio_google_drive_connections
for each row execute function public.set_updated_at();

-- Auto profile creation trigger function
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'customer')
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Utility check function
create or replace function public.current_user_role()
returns public.user_role
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid() and is_active = true
$$;

-- SaaS helper predicates
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

-- =========================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.post_comments enable row level security;
alter table public.albums enable row level security;
alter table public.album_photos enable row level security;
alter table public.ai_requests enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.customer_galleries enable row level security;
alter table public.customer_gallery_photos enable row level security;
alter table public.studios enable row level security;
alter table public.studio_members enable row level security;
alter table public.studio_payment_orders enable row level security;
alter table public.licenses enable row level security;
alter table public.devices enable row level security;
alter table public.payment_settings enable row level security;
alter table public.studio_google_drive_connections enable row level security;

-- General Profiles policies
drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile" on public.profiles for select using (auth.uid() = id);
drop policy if exists "Admins can read profiles" on public.profiles;
create policy "Admins can read profiles" on public.profiles for select using (public.current_user_role() in ('admin', 'staff'));
drop policy if exists "Admins can update profiles" on public.profiles;
create policy "Admins can update profiles" on public.profiles for update using (public.current_user_role() = 'admin');

-- General posts policies
drop policy if exists "Public can read published posts" on public.posts;
create policy "Public can read published posts" on public.posts for select using (published = true);
drop policy if exists "Admins can manage posts" on public.posts;
create policy "Admins can manage posts" on public.posts for all using (public.current_user_role() in ('admin', 'staff'));

-- General album photos policies
drop policy if exists "Users can read own album photos" on public.album_photos;
create policy "Users can read own album photos" on public.album_photos for select using (
  exists (
    select 1 from public.albums
    where albums.id = album_photos.album_id and albums.customer_id = auth.uid()
  )
);
drop policy if exists "Users can update own photo selection" on public.album_photos;
create policy "Users can update own photo selection" on public.album_photos for update using (
  exists (
    select 1 from public.albums
    where albums.id = album_photos.album_id and albums.customer_id = auth.uid()
  )
);
drop policy if exists "Admins can manage album photos" on public.album_photos;
create policy "Admins can manage album photos" on public.album_photos for all using (public.current_user_role() in ('admin', 'staff'));

-- General AI requests policies
drop policy if exists "Users can read own AI requests" on public.ai_requests;
create policy "Users can read own AI requests" on public.ai_requests for select using (auth.uid() = user_id);
drop policy if exists "Users can create own AI requests" on public.ai_requests;
create policy "Users can create own AI requests" on public.ai_requests for insert with check (auth.uid() = user_id);
drop policy if exists "Admins can read AI requests" on public.ai_requests;
create policy "Admins can read AI requests" on public.ai_requests for select using (public.current_user_role() in ('admin', 'staff'));

-- General wallet transactions policies
drop policy if exists "Users can read own wallet transactions" on public.wallet_transactions;
create policy "Users can read own wallet transactions" on public.wallet_transactions for select using (auth.uid() = user_id);
drop policy if exists "Admins can read wallet transactions" on public.wallet_transactions;
create policy "Admins can read wallet transactions" on public.wallet_transactions for select using (public.current_user_role() in ('admin', 'staff'));

-- General payment settings policies
drop policy if exists "Only admins can manage payment settings" on public.payment_settings;
create policy "Only admins can manage payment settings" on public.payment_settings for all
using (public.current_user_role() = 'admin') with check (public.current_user_role() = 'admin');

-- General licensing policies
drop policy if exists "Users can read own licenses" on public.licenses;
create policy "Users can read own licenses" on public.licenses for select to authenticated using (user_id = auth.uid());
drop policy if exists "Users can read own devices" on public.devices;
create policy "Users can read own devices" on public.devices for select to authenticated using (user_id = auth.uid());

-- Tenant studios RLS
drop policy if exists "Studio members can read studios" on public.studios;
create policy "Studio members can read studios" on public.studios for select
to authenticated using (public.is_studio_member(id));
drop policy if exists "Studio managers can update studios" on public.studios;
create policy "Studio managers can update studios" on public.studios for update
to authenticated using (public.can_manage_studio(id)) with check (public.can_manage_studio(id));

-- Tenant studio members RLS
drop policy if exists "Members can read own studio members" on public.studio_members;
create policy "Members can read own studio members" on public.studio_members for select
to authenticated using (public.is_studio_member(studio_id));
drop policy if exists "Managers can manage studio members" on public.studio_members;
create policy "Managers can manage studio members" on public.studio_members for all
to authenticated using (public.can_manage_studio(studio_id)) with check (public.can_manage_studio(studio_id));

-- Tenant operational details RLS
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
