create type public.user_role as enum ('customer', 'staff', 'admin');
create type public.photo_status as enum ('pending_selection', 'selected', 'editing', 'completed');
create type public.ai_request_status as enum ('queued', 'processing', 'completed', 'failed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role public.user_role not null default 'customer',
  created_at timestamptz not null default now()
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

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.post_comments enable row level security;
alter table public.albums enable row level security;
alter table public.album_photos enable row level security;
alter table public.ai_requests enable row level security;

create policy "Public can read published posts" on public.posts for select using (published = true);
create policy "Users can read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can read own albums" on public.albums for select using (auth.uid() = customer_id);
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
create policy "Users can read own AI requests" on public.ai_requests for select using (auth.uid() = user_id);
create policy "Users can create own AI requests" on public.ai_requests for insert with check (auth.uid() = user_id);
