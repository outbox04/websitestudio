-- Run after multitenant-studios.sql.
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

alter table public.studio_google_drive_connections enable row level security;

-- OAuth credentials are only read by server routes using the Supabase Service Role.
drop trigger if exists set_studio_google_drive_connections_updated_at on public.studio_google_drive_connections;
create trigger set_studio_google_drive_connections_updated_at before update on public.studio_google_drive_connections
for each row execute function public.set_updated_at();
