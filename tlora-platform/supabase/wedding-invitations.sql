create table if not exists public.wedding_invitations (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid references public.studios(id) on delete cascade,
  slug text not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  groom_name text not null default '',
  bride_name text not null default '',
  event_date date,
  event_time time,
  venue_name text not null default '',
  venue_address text not null default '',
  cover_image_url text,
  theme text not null default 'rose',
  config jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.wedding_invitations enable row level security;

drop trigger if exists set_wedding_invitations_updated_at on public.wedding_invitations;
create trigger set_wedding_invitations_updated_at
before update on public.wedding_invitations
for each row execute function public.set_updated_at();

create index if not exists wedding_invitations_studio_id_idx
on public.wedding_invitations(studio_id);

create index if not exists wedding_invitations_status_idx
on public.wedding_invitations(status);

create unique index if not exists wedding_invitations_studio_slug_uidx
on public.wedding_invitations(coalesce(studio_id, '00000000-0000-0000-0000-000000000000'::uuid), slug);

drop policy if exists "Public can read published wedding invitations" on public.wedding_invitations;
create policy "Public can read published wedding invitations"
on public.wedding_invitations
for select
using (status = 'published');

drop policy if exists "Studio members can manage wedding invitations" on public.wedding_invitations;
create policy "Studio members can manage wedding invitations"
on public.wedding_invitations
for all
using (public.is_studio_member(studio_id))
with check (public.is_studio_member(studio_id));
