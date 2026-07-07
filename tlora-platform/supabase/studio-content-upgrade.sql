-- Run after production-schema.sql (or studio-posts.sql).
-- Content metadata is scoped to each post; website UI settings stay in studios.settings JSONB.
alter table public.posts add column if not exists keywords text;
alter table public.posts add column if not exists cover_image_url text;
