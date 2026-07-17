begin;

alter table public.tlora_concept_albums
  add column if not exists tags text[] not null default '{}'::text[];

commit;
