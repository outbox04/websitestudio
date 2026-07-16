begin;

create table if not exists public.tlora_concept_categories (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete restrict,
  name text not null,
  slug text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (studio_id, slug)
);

alter table public.tlora_concept_albums
  add column if not exists category_id uuid references public.tlora_concept_categories(id) on delete set null;

alter table public.tlora_concept_inquiries
  add column if not exists shooting_date date;

create index if not exists tlora_concept_albums_category_idx
  on public.tlora_concept_albums(studio_id, category_id, status, sort_order);

alter table public.tlora_concept_categories enable row level security;

drop policy if exists "Public reads TLORA concept categories" on public.tlora_concept_categories;
drop policy if exists "TLORA admins manage concept categories" on public.tlora_concept_categories;

create policy "Public reads TLORA concept categories"
on public.tlora_concept_categories for select
using (public.is_tlora_studio(studio_id));

create policy "TLORA admins manage concept categories"
on public.tlora_concept_categories for all to authenticated
using (public.can_manage_tlora_cms())
with check (public.can_manage_tlora_cms() and public.is_tlora_studio(studio_id));

with tlora as (
  select id from public.studios
  where studio_type = 'first_party' and system_key = 'tlora'
)
insert into public.tlora_concept_categories(studio_id, name, slug)
select tlora.id, seed.name, seed.slug
from tlora
cross join (values
  ('Sinh nhật', 'sinh-nhat'),
  ('Fashion', 'fashion'),
  ('Chân dung', 'chan-dung'),
  ('Couple', 'couple'),
  ('Gia đình', 'gia-dinh')
) as seed(name, slug)
on conflict (studio_id, slug) do nothing;

commit;
