begin;

create table if not exists public.tlora_concept_albums (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete restrict,
  slug text not null,
  title text not null,
  excerpt text not null default '',
  cover_image_url text,
  images jsonb not null default '[]'::jsonb,
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  status public.cms_content_status not null default 'draft',
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (studio_id, slug)
);

create table if not exists public.tlora_concept_inquiries (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete restrict,
  album_id uuid references public.tlora_concept_albums(id) on delete set null,
  customer_name text not null,
  phone text not null,
  email text,
  note text,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create index if not exists tlora_concept_albums_public_idx
  on public.tlora_concept_albums(studio_id, status, is_featured desc, sort_order, published_at desc);
create index if not exists tlora_concept_inquiries_created_idx
  on public.tlora_concept_inquiries(studio_id, created_at desc);

alter table public.tlora_concept_albums enable row level security;
alter table public.tlora_concept_inquiries enable row level security;

drop policy if exists "Public reads published TLORA concept albums" on public.tlora_concept_albums;
drop policy if exists "TLORA admins manage concept albums" on public.tlora_concept_albums;
drop policy if exists "TLORA admins read concept inquiries" on public.tlora_concept_inquiries;

create policy "Public reads published TLORA concept albums"
on public.tlora_concept_albums for select
using (status = 'published' and public.is_tlora_studio(studio_id));

create policy "TLORA admins manage concept albums"
on public.tlora_concept_albums for all to authenticated
using (public.can_manage_tlora_cms())
with check (public.can_manage_tlora_cms() and public.is_tlora_studio(studio_id));

create policy "TLORA admins read concept inquiries"
on public.tlora_concept_inquiries for select to authenticated
using (public.can_manage_tlora_cms() and public.is_tlora_studio(studio_id));

insert into public.tlora_cms_menu_items(menu_id, label, href, is_enabled, sort_order)
select menu.id, 'Album Concept', '/album-concept', true, 35
from public.tlora_cms_menus menu
join public.studios studio on studio.id = menu.studio_id
where menu.menu_key = 'primary'
  and studio.studio_type = 'first_party'
  and studio.system_key = 'tlora'
  and not exists (
    select 1 from public.tlora_cms_menu_items item
    where item.menu_id = menu.id and item.href = '/album-concept'
  );

commit;
