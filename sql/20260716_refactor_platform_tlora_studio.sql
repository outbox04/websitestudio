-- TLORA Release A: platform / first-party / studio boundary
-- Review and run the pre-flight queries in docs/database-migration-runbook.md first.
-- Change the next value to 'preflight' to validate and force a rollback before mutations persist.
begin;
set local lock_timeout = '10s';
set local statement_timeout = '15min';
set local tlora.migration_mode = 'apply';
select pg_advisory_xact_lock(hashtext('tlora:20260716:scope-refactor'));

-- =========================================================
-- 00. PRE-FLIGHT VALIDATION
-- =========================================================
do $preflight$
declare
  duplicate_count bigint;
  orphan_count bigint;
begin
  if to_regclass('public.studios') is null
    or to_regclass('public.profiles') is null
    or to_regclass('public.studio_members') is null then
    raise exception 'TLORA pre-flight failed: core tables studios/profiles/studio_members are required';
  end if;

  select count(*) into duplicate_count
  from (select lower(slug) from public.studios group by lower(slug) having count(*) > 1) duplicates;
  if duplicate_count > 0 then
    raise exception 'TLORA pre-flight failed: % duplicate studio slugs', duplicate_count;
  end if;

  select count(*) into duplicate_count
  from (select lower(primary_domain) from public.studios where primary_domain is not null
        group by lower(primary_domain) having count(*) > 1) duplicates;
  if duplicate_count > 0 then
    raise exception 'TLORA pre-flight failed: % duplicate primary domains', duplicate_count;
  end if;

  select count(*) into orphan_count
  from public.profiles p left join public.studios s on s.id = p.default_studio_id
  where p.default_studio_id is not null and s.id is null;
  if orphan_count > 0 then
    raise exception 'TLORA pre-flight failed: % profiles reference a missing default studio', orphan_count;
  end if;

  if to_regclass('public.customer_galleries') is not null then
    select count(*) into orphan_count
    from public.customer_galleries g left join public.studios s on s.id = g.studio_id
    where g.studio_id is not null and s.id is null;
    if orphan_count > 0 then
      raise exception 'TLORA pre-flight failed: % galleries reference a missing studio', orphan_count;
    end if;
  end if;

  if to_regclass('public.licenses') is not null then
    select count(*) into duplicate_count
    from (select license_key from public.licenses group by license_key having count(*) > 1) duplicates;
    if duplicate_count > 0 then
      raise exception 'TLORA pre-flight failed: % duplicate license keys', duplicate_count;
    end if;
  end if;
end
$preflight$;

-- =========================================================
-- 01. BACKUP / SAFETY TABLES
-- =========================================================
create table if not exists public.platform_migration_runs (
  migration_key text primary key,
  phase text not null,
  status text not null check (status in ('running', 'completed', 'rolled_back')),
  audit jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.platform_migration_backups (
  migration_key text not null,
  source_table text not null,
  source_id text not null,
  row_data jsonb not null,
  backed_up_at timestamptz not null default now(),
  primary key (migration_key, source_table, source_id)
);

insert into public.platform_migration_runs (migration_key, phase, status, audit)
values (
  '20260716_scope_refactor',
  'release_a',
  'running',
  jsonb_build_object(
    'studios', (select count(*) from public.studios),
    'profiles', (select count(*) from public.profiles),
    'studio_members', (select count(*) from public.studio_members)
  )
)
on conflict (migration_key) do update
set phase = excluded.phase, status = 'running', started_at = now(), completed_at = null;

insert into public.platform_migration_backups (migration_key, source_table, source_id, row_data)
select '20260716_scope_refactor', 'studios', id::text, to_jsonb(s)
from public.studios s
on conflict do nothing;

insert into public.platform_migration_backups (migration_key, source_table, source_id, row_data)
select '20260716_scope_refactor', 'posts', id::text, to_jsonb(p)
from public.posts p where p.studio_id is null
on conflict do nothing;

-- =========================================================
-- 02. CREATE REQUIRED ENUMS
-- =========================================================
do $types$
begin
  if not exists (select 1 from pg_type where typname = 'studio_type') then
    create type public.studio_type as enum ('first_party', 'tenant');
  end if;
  if not exists (select 1 from pg_type where typname = 'cms_content_status') then
    create type public.cms_content_status as enum ('draft', 'published', 'archived');
  end if;
end
$types$;

-- =========================================================
-- 03. ALTER PLATFORM TABLES
-- =========================================================
alter table public.studios add column if not exists studio_type public.studio_type not null default 'tenant';
alter table public.studios add column if not exists system_key text;
create unique index if not exists studios_system_key_uidx
  on public.studios (lower(system_key)) where system_key is not null;
do $studio_scope_constraint$
begin
  if not exists (select 1 from pg_constraint where conname = 'studios_scope_identity_check') then
    alter table public.studios add constraint studios_scope_identity_check check (
      (studio_type = 'tenant' and system_key is null)
      or (studio_type = 'first_party' and system_key is not null)
    ) not valid;
    alter table public.studios validate constraint studios_scope_identity_check;
  end if;
end
$studio_scope_constraint$;

-- Core names stay stable in Release A because they are referenced throughout checkout,
-- license verification, host resolution, and tenant membership.

-- =========================================================
-- 04. RENAME PLATFORM TABLES
-- =========================================================
-- Intentionally deferred. studios, studio_members, profiles, licenses, devices,
-- license_renewal_orders and studio_payment_orders retain their current names.

-- =========================================================
-- 05. RENAME STUDIO TABLES
-- =========================================================
create table if not exists public.studio_drive_connections (
  studio_id uuid primary key references public.studios(id) on delete cascade,
  google_account_email text,
  root_folder_id text not null unique,
  refresh_token_ciphertext text not null,
  token_expires_at timestamptz,
  connected_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $drive_copy$
begin
  if to_regclass('public.studio_google_drive_connections') is not null then
    execute $sql$
      insert into public.studio_drive_connections
      select * from public.studio_google_drive_connections
      on conflict (studio_id) do update set
        google_account_email = excluded.google_account_email,
        root_folder_id = excluded.root_folder_id,
        refresh_token_ciphertext = excluded.refresh_token_ciphertext,
        token_expires_at = excluded.token_expires_at,
        connected_by = excluded.connected_by,
        updated_at = excluded.updated_at
    $sql$;
  end if;
end
$drive_copy$;

-- =========================================================
-- 06. CREATE TLORA CMS TABLES
-- =========================================================
create table if not exists public.tlora_cms_pages (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete restrict,
  page_key text not null,
  slug text not null,
  title text not null,
  status public.cms_content_status not null default 'draft',
  seo_title text,
  seo_description text,
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (studio_id, page_key),
  unique (studio_id, slug)
);

create table if not exists public.tlora_cms_page_sections (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.tlora_cms_pages(id) on delete cascade,
  section_key text not null,
  section_type text not null,
  draft_content jsonb not null default '{}'::jsonb,
  published_content jsonb not null default '{}'::jsonb,
  schema_version integer not null default 1 check (schema_version > 0),
  is_enabled boolean not null default true,
  sort_order integer not null default 0,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (page_id, section_key)
);

create table if not exists public.tlora_cms_page_versions (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.tlora_cms_pages(id) on delete cascade,
  version_number bigint generated always as identity,
  snapshot jsonb not null,
  change_note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (page_id, version_number)
);

create table if not exists public.tlora_cms_posts (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete restrict,
  legacy_post_id uuid unique,
  slug text not null,
  title text not null,
  excerpt text,
  draft_content jsonb not null default '{}'::jsonb,
  published_content jsonb not null default '{}'::jsonb,
  cover_image_url text,
  seo_title text,
  seo_description text,
  keywords text[] not null default '{}',
  status public.cms_content_status not null default 'draft',
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (studio_id, slug)
);

create table if not exists public.tlora_cms_post_categories (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete restrict,
  slug text not null,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  unique (studio_id, slug)
);

create table if not exists public.tlora_cms_post_category_links (
  post_id uuid not null references public.tlora_cms_posts(id) on delete cascade,
  category_id uuid not null references public.tlora_cms_post_categories(id) on delete cascade,
  primary key (post_id, category_id)
);

create table if not exists public.tlora_cms_post_versions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.tlora_cms_posts(id) on delete cascade,
  version_number bigint generated always as identity,
  snapshot jsonb not null,
  change_note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (post_id, version_number)
);

create table if not exists public.tlora_cms_media_assets (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete restrict,
  storage_bucket text not null default 'tlora-cms-media',
  storage_path text not null,
  public_url text,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  width integer,
  height integer,
  alt_text text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (storage_bucket, storage_path)
);

create table if not exists public.tlora_cms_menus (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete restrict,
  menu_key text not null,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (studio_id, menu_key)
);

create table if not exists public.tlora_cms_menu_items (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null references public.tlora_cms_menus(id) on delete cascade,
  parent_id uuid references public.tlora_cms_menu_items(id) on delete cascade,
  label text not null,
  href text not null,
  is_enabled boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tlora_cms_settings (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete restrict,
  setting_key text not null,
  draft_value jsonb not null default '{}'::jsonb,
  published_value jsonb not null default '{}'::jsonb,
  schema_version integer not null default 1,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (studio_id, setting_key)
);

create table if not exists public.tlora_cms_activity_logs (
  id bigint generated always as identity primary key,
  studio_id uuid not null references public.studios(id) on delete restrict,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  before_value jsonb,
  after_value jsonb,
  request_id text,
  created_at timestamptz not null default now()
);

-- =========================================================
-- 07. MIGRATE LEGACY DATA
-- =========================================================
insert into public.studios (slug, display_name, plan, status, studio_type, system_key, settings)
values ('tlora', 'TLORA Studio', 'premium', 'active', 'first_party', 'tlora', '{}'::jsonb)
on conflict (slug) do update set
  studio_type = 'first_party',
  system_key = 'tlora',
  status = case when public.studios.status = 'cancelled' then public.studios.status else 'active' end,
  updated_at = now();

do $seed$
declare
  tlora_id uuid;
begin
  select id into strict tlora_id from public.studios
  where studio_type = 'first_party' and system_key = 'tlora';

  update public.customer_galleries set studio_id = tlora_id where studio_id is null;
  update public.posts set studio_id = tlora_id where studio_id is null;
  if to_regclass('public.albums') is not null then
    execute format('update public.albums set studio_id = %L where studio_id is null', tlora_id);
  end if;
  if to_regclass('public.wedding_invitations') is not null then
    execute format('update public.wedding_invitations set studio_id = %L where studio_id is null', tlora_id);
  end if;

  insert into public.tlora_cms_pages (studio_id, page_key, slug, title, status)
  values (tlora_id, 'home', '/', 'Trang chủ', 'draft')
  on conflict (studio_id, page_key) do nothing;

  insert into public.tlora_cms_page_sections
    (page_id, section_key, section_type, draft_content, published_content, sort_order)
  select p.id, seed.section_key, seed.section_type, seed.content, seed.content, seed.sort_order
  from public.tlora_cms_pages p
  cross join (values
    ('hero', 'hero', '{"title":"TLORA Studio","description":"Nơi cá tính trở thành nghệ thuật.","ctaLabel":"Khám phá dịch vụ","ctaHref":"/dich-vu"}'::jsonb, 10),
    ('about', 'editorial', '{"title":"Một studio, một câu chuyện riêng","description":"Trải nghiệm nhiếp ảnh được thiết kế theo cá tính của từng khách hàng."}'::jsonb, 20),
    ('services', 'collection', '{"title":"Dịch vụ nổi bật","items":[]}'::jsonb, 30),
    ('gallery', 'gallery', '{"title":"Album chọn lọc","items":[]}'::jsonb, 40),
    ('contact', 'contact', '{"title":"Đặt lịch cùng TLORA","phone":"","email":"","address":""}'::jsonb, 50)
  ) as seed(section_key, section_type, content, sort_order)
  where p.studio_id = tlora_id and p.page_key = 'home'
  on conflict (page_id, section_key) do nothing;

  insert into public.tlora_cms_posts
    (studio_id, legacy_post_id, slug, title, excerpt, draft_content, published_content,
     cover_image_url, keywords, status, published_at, created_at)
  select tlora_id, p.id, p.slug, p.title, p.excerpt,
    jsonb_build_object('html', coalesce(p.content, '')),
    case when p.published then jsonb_build_object('html', coalesce(p.content, '')) else '{}'::jsonb end,
    p.cover_image_url,
    case when nullif(trim(p.keywords), '') is null then '{}'::text[]
         else string_to_array(p.keywords, ',') end,
    case when p.published then 'published'::public.cms_content_status else 'draft'::public.cms_content_status end,
    case when p.published then p.created_at else null end,
    p.created_at
  from public.posts p
  where p.studio_id = tlora_id
  on conflict (legacy_post_id) do nothing;
end
$seed$;

-- =========================================================
-- 08. UPDATE FOREIGN KEYS
-- =========================================================
alter table public.customer_galleries add column if not exists share_token text;
update public.customer_galleries
set share_token = encode(gen_random_bytes(24), 'hex')
where share_token is null;
alter table public.customer_galleries alter column share_token set default encode(gen_random_bytes(24), 'hex');
alter table public.customer_galleries alter column share_token set not null;
create unique index if not exists customer_galleries_share_token_uidx
  on public.customer_galleries (share_token);

-- =========================================================
-- 09. CREATE INDEXES
-- =========================================================
create index if not exists tlora_cms_pages_status_idx on public.tlora_cms_pages(status);
create index if not exists tlora_cms_sections_page_sort_idx on public.tlora_cms_page_sections(page_id, sort_order);
create index if not exists tlora_cms_posts_status_published_idx on public.tlora_cms_posts(status, published_at desc);
create index if not exists tlora_cms_media_created_idx on public.tlora_cms_media_assets(created_at desc);
create index if not exists tlora_cms_activity_entity_idx on public.tlora_cms_activity_logs(entity_type, entity_id);

-- =========================================================
-- 10. CREATE FUNCTIONS
-- =========================================================
create or replace function public.get_first_party_studio(target_system_key text default 'tlora')
returns public.studios
language sql security definer stable set search_path = public
as $$
  select s from public.studios s
  where s.studio_type = 'first_party' and s.system_key = target_system_key
  limit 1
$$;

create or replace function public.is_tlora_studio(target_studio_id uuid)
returns boolean language sql security definer stable set search_path = public
as $$
  select exists (
    select 1 from public.studios
    where id = target_studio_id and studio_type = 'first_party' and system_key = 'tlora'
  )
$$;

create or replace function public.can_manage_tlora_cms()
returns boolean language sql security definer stable set search_path = public
as $$
  select current_setting('request.jwt.claim.role', true) = 'service_role'
    or public.is_platform_operator() or exists (
    select 1
    from public.studio_members m
    join public.studios s on s.id = m.studio_id
    where m.user_id = auth.uid() and m.is_active = true and m.role in ('owner', 'admin')
      and s.studio_type = 'first_party' and s.system_key = 'tlora'
  )
$$;

create or replace function public.publish_tlora_cms_page(target_page_id uuid, change_note text default null)
returns void language plpgsql security definer set search_path = public
as $$
declare
  snapshot_value jsonb;
begin
  if not public.can_manage_tlora_cms() then raise exception 'forbidden'; end if;
  if not exists (
    select 1 from public.tlora_cms_pages p
    where p.id = target_page_id and public.is_tlora_studio(p.studio_id)
  ) then raise exception 'invalid TLORA page'; end if;

  select jsonb_build_object(
    'page', to_jsonb(p),
    'sections', coalesce(jsonb_agg(to_jsonb(s) order by s.sort_order), '[]'::jsonb)
  ) into snapshot_value
  from public.tlora_cms_pages p
  left join public.tlora_cms_page_sections s on s.page_id = p.id
  where p.id = target_page_id
  group by p.id;

  insert into public.tlora_cms_page_versions(page_id, snapshot, change_note, created_by)
  values (target_page_id, snapshot_value, change_note, auth.uid());

  update public.tlora_cms_page_sections
  set published_content = draft_content, updated_at = now(), updated_by = auth.uid()
  where page_id = target_page_id;

  update public.tlora_cms_pages
  set status = 'published', published_at = now(), updated_at = now(), updated_by = auth.uid()
  where id = target_page_id;
end
$$;

create or replace function public.get_tlora_public_page(target_page_key text default 'home')
returns jsonb language sql security definer stable set search_path = public
as $$
  select jsonb_build_object(
    'page', jsonb_build_object(
      'page_key', p.page_key, 'slug', p.slug, 'title', p.title,
      'seo_title', p.seo_title, 'seo_description', p.seo_description,
      'published_at', p.published_at
    ),
    'sections', coalesce(jsonb_agg(jsonb_build_object(
      'section_key', s.section_key,
      'section_type', s.section_type,
      'content', s.published_content,
      'schema_version', s.schema_version,
      'sort_order', s.sort_order
    ) order by s.sort_order) filter (where s.id is not null and s.is_enabled), '[]'::jsonb)
  )
  from public.tlora_cms_pages p
  left join public.tlora_cms_page_sections s on s.page_id = p.id
  where p.page_key = target_page_key and p.status = 'published' and public.is_tlora_studio(p.studio_id)
  group by p.id
$$;

create or replace function public.get_tlora_public_post(target_slug text)
returns jsonb language sql security definer stable set search_path = public
as $$
  select jsonb_build_object(
    'id', p.id, 'slug', p.slug, 'title', p.title, 'excerpt', p.excerpt,
    'content', p.published_content, 'cover_image_url', p.cover_image_url,
    'seo_title', p.seo_title, 'seo_description', p.seo_description,
    'keywords', p.keywords, 'published_at', p.published_at
  )
  from public.tlora_cms_posts p
  where p.slug = target_slug and p.status = 'published' and public.is_tlora_studio(p.studio_id)
  limit 1
$$;

create or replace function public.list_tlora_public_posts()
returns setof jsonb language sql security definer stable set search_path = public
as $$
  select jsonb_build_object(
    'id', p.id, 'slug', p.slug, 'title', p.title, 'excerpt', p.excerpt,
    'cover_image_url', p.cover_image_url, 'keywords', p.keywords, 'published_at', p.published_at
  )
  from public.tlora_cms_posts p
  where p.status = 'published' and public.is_tlora_studio(p.studio_id)
  order by p.published_at desc
$$;

revoke all on function public.get_tlora_public_page(text) from public;
revoke all on function public.get_tlora_public_post(text) from public;
revoke all on function public.list_tlora_public_posts() from public;
grant execute on function public.get_tlora_public_page(text) to anon, authenticated;
grant execute on function public.get_tlora_public_post(text) to anon, authenticated;
grant execute on function public.list_tlora_public_posts() to anon, authenticated;

-- =========================================================
-- 11. ENABLE RLS
-- =========================================================
alter table public.platform_migration_runs enable row level security;
alter table public.platform_migration_backups enable row level security;
alter table public.studio_drive_connections enable row level security;
alter table public.tlora_cms_pages enable row level security;
alter table public.tlora_cms_page_sections enable row level security;
alter table public.tlora_cms_page_versions enable row level security;
alter table public.tlora_cms_posts enable row level security;
alter table public.tlora_cms_post_categories enable row level security;
alter table public.tlora_cms_post_category_links enable row level security;
alter table public.tlora_cms_post_versions enable row level security;
alter table public.tlora_cms_media_assets enable row level security;
alter table public.tlora_cms_menus enable row level security;
alter table public.tlora_cms_menu_items enable row level security;
alter table public.tlora_cms_settings enable row level security;
alter table public.tlora_cms_activity_logs enable row level security;
alter table public.customer_galleries enable row level security;
alter table public.customer_gallery_photos enable row level security;

-- =========================================================
-- 12. CREATE RLS POLICIES
-- =========================================================
do $drop_release_a_policies$
declare
  policy_row record;
begin
  for policy_row in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = any(array[
        'platform_migration_runs','platform_migration_backups','studio_drive_connections',
        'tlora_cms_pages','tlora_cms_page_sections','tlora_cms_page_versions',
        'tlora_cms_posts','tlora_cms_post_categories','tlora_cms_post_category_links',
        'tlora_cms_post_versions','tlora_cms_media_assets','tlora_cms_menus',
        'tlora_cms_menu_items','tlora_cms_settings','tlora_cms_activity_logs'
      ])
  loop
    execute format('drop policy if exists %I on %I.%I', policy_row.policyname, policy_row.schemaname, policy_row.tablename);
  end loop;
end
$drop_release_a_policies$;

create policy "Platform admins inspect migration runs" on public.platform_migration_runs
for select to authenticated using (public.is_platform_operator());
create policy "Platform admins inspect migration backups" on public.platform_migration_backups
for select to authenticated using (public.is_platform_operator());

create policy "Studio managers read own drive metadata" on public.studio_drive_connections
for select to authenticated using (public.can_manage_studio(studio_id));
-- No client insert/update policy is created for Drive tokens. OAuth server routes use service role.

create policy "TLORA admins manage pages" on public.tlora_cms_pages
for all to authenticated using (public.can_manage_tlora_cms()) with check (public.can_manage_tlora_cms() and public.is_tlora_studio(studio_id));

create policy "TLORA admins manage page sections" on public.tlora_cms_page_sections
for all to authenticated using (public.can_manage_tlora_cms()) with check (public.can_manage_tlora_cms());

create policy "TLORA admins manage page versions" on public.tlora_cms_page_versions
for all to authenticated using (public.can_manage_tlora_cms()) with check (public.can_manage_tlora_cms());
create policy "TLORA admins manage posts" on public.tlora_cms_posts
for all to authenticated using (public.can_manage_tlora_cms()) with check (public.can_manage_tlora_cms() and public.is_tlora_studio(studio_id));
create policy "Public reads TLORA post categories" on public.tlora_cms_post_categories
for select using (public.is_tlora_studio(studio_id));
create policy "TLORA admins manage post categories" on public.tlora_cms_post_categories
for all to authenticated using (public.can_manage_tlora_cms()) with check (public.can_manage_tlora_cms() and public.is_tlora_studio(studio_id));
create policy "Public reads TLORA post category links" on public.tlora_cms_post_category_links for select using (true);
create policy "TLORA admins manage post category links" on public.tlora_cms_post_category_links
for all to authenticated using (public.can_manage_tlora_cms()) with check (public.can_manage_tlora_cms());
create policy "TLORA admins manage post versions" on public.tlora_cms_post_versions
for all to authenticated using (public.can_manage_tlora_cms()) with check (public.can_manage_tlora_cms());
create policy "Public reads TLORA media metadata" on public.tlora_cms_media_assets
for select using (public.is_tlora_studio(studio_id));
create policy "TLORA admins manage media metadata" on public.tlora_cms_media_assets
for all to authenticated using (public.can_manage_tlora_cms()) with check (public.can_manage_tlora_cms() and public.is_tlora_studio(studio_id));
create policy "Public reads TLORA menus" on public.tlora_cms_menus
for select using (public.is_tlora_studio(studio_id));
create policy "TLORA admins manage menus" on public.tlora_cms_menus
for all to authenticated using (public.can_manage_tlora_cms()) with check (public.can_manage_tlora_cms() and public.is_tlora_studio(studio_id));
create policy "Public reads enabled TLORA menu items" on public.tlora_cms_menu_items for select using (is_enabled);
create policy "TLORA admins manage menu items" on public.tlora_cms_menu_items
for all to authenticated using (public.can_manage_tlora_cms()) with check (public.can_manage_tlora_cms());
create policy "TLORA admins manage settings" on public.tlora_cms_settings
for all to authenticated using (public.can_manage_tlora_cms()) with check (public.can_manage_tlora_cms() and public.is_tlora_studio(studio_id));
create policy "TLORA admins read activity" on public.tlora_cms_activity_logs
for select to authenticated using (public.can_manage_tlora_cms());
create policy "TLORA admins append activity" on public.tlora_cms_activity_logs
for insert to authenticated with check (public.can_manage_tlora_cms() and public.is_tlora_studio(studio_id));

drop policy if exists "Public can read customer galleries" on public.customer_galleries;
drop policy if exists "Public can read customer gallery photos" on public.customer_gallery_photos;
drop policy if exists "Admins can manage customer galleries" on public.customer_galleries;
drop policy if exists "Admins can manage customer gallery photos" on public.customer_gallery_photos;
drop policy if exists "Studio members can manage galleries" on public.customer_galleries;
drop policy if exists "Studio members manage operational galleries" on public.customer_galleries;
drop policy if exists "Studio members manage operational gallery photos" on public.customer_gallery_photos;
create policy "Studio members manage operational galleries" on public.customer_galleries
for all to authenticated
using (public.is_studio_member(studio_id))
with check (public.is_studio_member(studio_id));
create policy "Studio members manage operational gallery photos" on public.customer_gallery_photos
for all to authenticated
using (exists (
  select 1 from public.customer_galleries gallery
  where gallery.id = gallery_id and public.is_studio_member(gallery.studio_id)
))
with check (exists (
  select 1 from public.customer_galleries gallery
  where gallery.id = gallery_id and public.is_studio_member(gallery.studio_id)
));

-- =========================================================
-- 13. STORAGE POLICIES
-- =========================================================
insert into storage.buckets (id, name, public)
values ('tlora-cms-media', 'tlora-cms-media', true)
on conflict (id) do update set public = true;

drop policy if exists "Public reads TLORA CMS media" on storage.objects;
create policy "Public reads TLORA CMS media" on storage.objects
for select using (bucket_id = 'tlora-cms-media');
drop policy if exists "TLORA admins upload CMS media" on storage.objects;
create policy "TLORA admins upload CMS media" on storage.objects
for insert to authenticated with check (bucket_id = 'tlora-cms-media' and public.can_manage_tlora_cms());
drop policy if exists "TLORA admins update CMS media" on storage.objects;
create policy "TLORA admins update CMS media" on storage.objects
for update to authenticated using (bucket_id = 'tlora-cms-media' and public.can_manage_tlora_cms());
drop policy if exists "TLORA admins delete CMS media" on storage.objects;
create policy "TLORA admins delete CMS media" on storage.objects
for delete to authenticated using (bucket_id = 'tlora-cms-media' and public.can_manage_tlora_cms());

-- =========================================================
-- 14. SEED TLORA
-- =========================================================
insert into public.tlora_cms_menus (studio_id, menu_key, name)
select id, 'primary', 'Menu chính' from public.studios
where studio_type = 'first_party' and system_key = 'tlora'
on conflict (studio_id, menu_key) do nothing;

insert into public.tlora_cms_menu_items (menu_id, label, href, is_enabled, sort_order)
select m.id, seed.label, seed.href, true, seed.sort_order
from public.tlora_cms_menus m
cross join (values
  ('Trang chủ', '/', 10),
  ('Dịch vụ', '/dich-vu', 20),
  ('Bảng giá', '/bang-gia', 30),
  ('AI Concept', '/ai-concept', 40),
  ('Tin tức', '/tin-tuc', 50)
) as seed(label, href, sort_order)
where m.menu_key = 'primary'
  and exists (select 1 from public.studios s where s.id = m.studio_id and s.system_key = 'tlora')
  and not exists (select 1 from public.tlora_cms_menu_items existing where existing.menu_id = m.id);

insert into public.tlora_cms_post_categories (studio_id, slug, name, description)
select id, 'studio-tips', 'Studio Tips', 'Kiến thức chuẩn bị và trải nghiệm chụp ảnh.'
from public.studios where studio_type = 'first_party' and system_key = 'tlora'
on conflict (studio_id, slug) do nothing;

insert into public.tlora_cms_settings (studio_id, setting_key, draft_value, published_value)
select id, 'site',
  '{"siteName":"TLORA Studio","description":"Nơi cá tính trở thành nghệ thuật.","phone":"","email":"hello@tlorastudio.vn","address":"","facebookUrl":"","zalo":"","defaultOgImage":"/brand/tlora-logo.png"}'::jsonb,
  '{"siteName":"TLORA Studio","description":"Nơi cá tính trở thành nghệ thuật.","phone":"","email":"hello@tlorastudio.vn","address":"","facebookUrl":"","zalo":"","defaultOgImage":"/brand/tlora-logo.png"}'::jsonb
from public.studios where studio_type = 'first_party' and system_key = 'tlora'
on conflict (studio_id, setting_key) do nothing;

-- =========================================================
-- 15. CREATE COMPATIBILITY VIEWS
-- =========================================================
-- The physical legacy Drive table remains available during Release A.
-- No compatibility view shadows it. Source moves to studio_drive_connections first.
comment on table public.studio_google_drive_connections is
  'Release A compatibility table. Writes are mirrored by application code until Release C.';
comment on table public.albums is
  'Legacy album model. Do not delete; operational galleries use customer_galleries.';

-- =========================================================
-- 16. POST-MIGRATION VALIDATION
-- =========================================================
do $postflight$
declare
  tlora_count bigint;
  orphan_count bigint;
begin
  select count(*) into tlora_count from public.studios
  where studio_type = 'first_party' and system_key = 'tlora';
  if tlora_count <> 1 then
    raise exception 'TLORA post-flight failed: expected one TLORA first-party studio, got %', tlora_count;
  end if;

  select count(*) into orphan_count from public.customer_galleries where studio_id is null;
  if orphan_count > 0 then
    raise exception 'TLORA post-flight failed: % galleries still have null studio_id', orphan_count;
  end if;

  if current_setting('tlora.migration_mode', true) = 'preflight' then
    raise exception 'TLORA pre-flight complete; intentional rollback because migration_mode=preflight';
  end if;
end
$postflight$;

update public.platform_migration_runs
set status = 'completed',
    completed_at = now(),
    audit = audit || jsonb_build_object(
      'tlora_cms_pages', (select count(*) from public.tlora_cms_pages),
      'tlora_cms_sections', (select count(*) from public.tlora_cms_page_sections),
      'tlora_cms_posts', (select count(*) from public.tlora_cms_posts),
      'null_gallery_studio_ids', (select count(*) from public.customer_galleries where studio_id is null)
    )
where migration_key = '20260716_scope_refactor';

commit;
