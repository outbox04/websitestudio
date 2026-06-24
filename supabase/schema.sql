create type public.user_role as enum ('customer', 'staff', 'admin');
create type public.photo_status as enum ('pending_selection', 'selected', 'editing', 'completed');
create type public.ai_request_status as enum ('queued', 'processing', 'completed', 'failed');
create type public.gallery_photo_kind as enum ('raw', 'edited');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  phone text,
  address text,
  avatar_url text,
  credit_balance_vnd integer not null default 0 check (credit_balance_vnd >= 0),
  role public.user_role not null default 'customer',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  excerpt text,
  content text,
  cover_url text,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.post_likes (
  post_id uuid references public.posts(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table public.albums (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  google_drive_folder_id text not null,
  created_at timestamptz not null default now()
);

create table public.album_photos (
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

create table public.ai_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  source_image_url text,
  outfit_preset text not null,
  background_preset text not null,
  style_preset text not null,
  prompt text not null,
  result_image_url text,
  status public.ai_request_status not null default 'queued',
  created_at timestamptz not null default now()
);

create table public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount_vnd integer not null,
  type text not null check (type in ('top_up', 'ai_concept_charge', 'refund')),
  note text,
  created_at timestamptz not null default now()
);

create table public.customer_galleries (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_name_slug text unique not null,
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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.customer_gallery_photos (
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

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger set_customer_galleries_updated_at
before update on public.customer_galleries
for each row execute function public.set_updated_at();

create trigger set_customer_gallery_photos_updated_at
before update on public.customer_gallery_photos
for each row execute function public.set_updated_at();

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

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.current_user_role()
returns public.user_role
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid() and is_active = true
$$;

create policy "Public can read published posts" on public.posts for select using (published = true);
create policy "Users can read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Admins can read profiles" on public.profiles for select using (public.current_user_role() in ('admin', 'staff'));
create policy "Admins can update profiles" on public.profiles for update using (public.current_user_role() = 'admin');
create policy "Users can read own albums" on public.albums for select using (auth.uid() = customer_id);
create policy "Admins can manage albums" on public.albums for all using (public.current_user_role() in ('admin', 'staff'));
create policy "Users can read own album photos" on public.album_photos for select using (
  exists (
    select 1 from public.albums
    where albums.id = album_photos.album_id and albums.customer_id = auth.uid()
  )
);
create policy "Users can update own photo selection" on public.album_photos for update using (
  exists (
    select 1 from public.albums
    where albums.id = album_photos.album_id and albums.customer_id = auth.uid()
  )
);
create policy "Admins can manage album photos" on public.album_photos for all using (public.current_user_role() in ('admin', 'staff'));
create policy "Users can read own AI requests" on public.ai_requests for select using (auth.uid() = user_id);
create policy "Users can create own AI requests" on public.ai_requests for insert with check (auth.uid() = user_id);
create policy "Users can read own wallet transactions" on public.wallet_transactions for select using (auth.uid() = user_id);
create policy "Admins can manage posts" on public.posts for all using (public.current_user_role() in ('admin', 'staff'));
create policy "Admins can read AI requests" on public.ai_requests for select using (public.current_user_role() in ('admin', 'staff'));
create policy "Admins can read wallet transactions" on public.wallet_transactions for select using (public.current_user_role() in ('admin', 'staff'));
create policy "Public can read customer galleries" on public.customer_galleries for select using (true);
create policy "Public can read customer gallery photos" on public.customer_gallery_photos for select using (true);
create policy "Admins can manage customer galleries" on public.customer_galleries for all using (public.current_user_role() in ('admin', 'staff'));
create policy "Admins can manage customer gallery photos" on public.customer_gallery_photos for all using (public.current_user_role() in ('admin', 'staff'));
