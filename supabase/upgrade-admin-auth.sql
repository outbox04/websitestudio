-- Use this file if you already ran the first schema.sql before admin auth fields were added.

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists is_active boolean not null default true;
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

create unique index if not exists profiles_email_unique_idx on public.profiles (email) where email is not null;

update public.profiles profile
set email = auth_user.email
from auth.users auth_user
where profile.id = auth_user.id
  and profile.email is null;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
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

drop trigger if exists on_auth_user_created on auth.users;
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

drop policy if exists "Admins can read profiles" on public.profiles;
create policy "Admins can read profiles" on public.profiles for select using (public.current_user_role() in ('admin', 'staff'));

drop policy if exists "Admins can update profiles" on public.profiles;
create policy "Admins can update profiles" on public.profiles for update using (public.current_user_role() = 'admin');

drop policy if exists "Admins can manage albums" on public.albums;
create policy "Admins can manage albums" on public.albums for all using (public.current_user_role() in ('admin', 'staff'));

drop policy if exists "Admins can manage album photos" on public.album_photos;
create policy "Admins can manage album photos" on public.album_photos for all using (public.current_user_role() in ('admin', 'staff'));

drop policy if exists "Admins can manage posts" on public.posts;
create policy "Admins can manage posts" on public.posts for all using (public.current_user_role() in ('admin', 'staff'));

drop policy if exists "Admins can read AI requests" on public.ai_requests;
create policy "Admins can read AI requests" on public.ai_requests for select using (public.current_user_role() in ('admin', 'staff'));
