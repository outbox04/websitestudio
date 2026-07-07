-- Run after multitenant-studios.sql.
alter table public.posts add column if not exists studio_id uuid references public.studios(id) on delete cascade;
create index if not exists posts_studio_id_idx on public.posts(studio_id);
create unique index if not exists posts_studio_slug_unique_idx on public.posts(studio_id, lower(slug)) where studio_id is not null;
